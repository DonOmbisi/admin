const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'https://everythingmat-app.onrender.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://DONMIKE:dataviz@cluster0.ca18ur6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'e7f3b2c4a1d94f8b9c6e3a7d2f5b8c1e3d6a9f0b2c4e7a8d9f1b3c6e2a4d7f9';

console.log('Environment variables loaded:');
console.log('PORT:', PORT);
console.log('MAIN_BACKEND_URL:', MAIN_BACKEND_URL);
console.log('MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Local frontend
    'https://everythingmaternity.vercel.app',  // Previous frontend
    process.env.NODE_ENV === 'production'
      ? 'https://admin-service-xq0t.onrender.com'  // ← Replace with your actual admin frontend URL
      : undefined
  ].filter(Boolean),  // Remove undefined values
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Database connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB (Admin Service)'))
.catch(err => console.error('MongoDB connection error:', err));

// User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// JWT verification - simplified since we trust tokens from main backend
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  // For now, just check if token exists and is properly formatted
  // The main backend will validate the actual token
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.role) {
      return res.status(403).json({ error: 'Invalid token format' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'admin-service',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });
    console.log('Proxying to:', `${MAIN_BACKEND_URL}/api/auth/login`);
    
    // Always authenticate with main backend
    const response = await fetch(`${MAIN_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Main backend response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful, received token');
      const token = data.token;
      
      // Create/update user in admin service DB for future use
      try {
        const decoded = jwt.decode(token);
        const adminUser = {
          email: decoded.email,
          firstName: decoded.firstName || 'Admin',
          lastName: decoded.lastName || 'User',
          role: 'admin',
          createdAt: new Date()
        };
        
        await User.findOneAndUpdate(
          { email },
          adminUser,
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.log('DB sync error (non-critical):', dbError.message);
      }
      
      return res.json(data);
    } else {
      const errorData = await response.json();
      console.log('Login failed:', errorData);
      return res.status(401).json(errorData);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// File upload endpoint for saving images
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file to disk
    fs.writeFileSync(filepath, req.file.buffer);

    // Return the URL for the uploaded image
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'admin-service-xq0t.onrender.com'}`
      : `http://localhost:${PORT}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    console.log('Image uploaded:', imageUrl);

    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Public endpoints (no auth required)
app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products?limit=100`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Note: Product creation is now handled by the authenticated proxy below

app.get('/api/categories', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/categories`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/subcategories', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/subcategories`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Subcategories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Protected endpoints (auth required)
app.use('/api/*', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const targetUrl = `${MAIN_BACKEND_URL}${req.originalUrl}`;

    // Build headers, preserving the Authorization header
    const headers = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    console.log('Proxying authenticated request to:', targetUrl);
    console.log('Headers:', headers);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    console.log('Proxy response status:', response.status);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Serve static files (React app)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Combined Admin Service running on http://localhost:${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Proxying to main backend at: ${MAIN_BACKEND_URL}`);
});

module.exports = app;
