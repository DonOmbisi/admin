const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'http://localhost:3001';
const path = require('path');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Local frontend
    'https://admin-frontend-39xw.onrender.com',  // Main app
    'https://admin-service-xq0t.onrender.com' // Admin service
  ].filter(Boolean),  // Remove undefined values
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB (Admin Service)'))
.catch(err => console.error('MongoDB connection error:', err));

// User schema (simplified version)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Product schema (for direct DB access)
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  subcategory: String,
  images: [String],
  description: String,
  features: [String],
  isNew: Boolean,
  isBestseller: Boolean,
  inStock: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const Product = mongoose.model('Product', ProductSchema);

// JWT verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'admin-service',
    timestamp: new Date().toISOString()
  });
});

// Login (sync with main backend)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check local user first
    const user = await User.findOne({ email });
    
    if (!user) {
      // Try to authenticate with main backend
      const response = await fetch(`${MAIN_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        
        // Create/update user in admin service DB
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
        
        return res.json(data);
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get products (proxy to main backend)
app.get('/api/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products?${new URLSearchParams(req.query)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (proxy to main backend)
app.get('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (proxy to main backend)
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (proxy to main backend)
app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (proxy to main backend)
app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products/${req.params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Bulk delete products (proxy to main backend)
app.delete('/api/products/bulk-delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Bulk deletion error:', error);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

// Get categories (proxy to main backend)
app.get('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/categories`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get orders (proxy to main backend)
app.get('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/orders?${new URLSearchParams(req.query)}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Serve static admin frontend (if built)
app.use(express.static('dist'));

// Catch all handler for SPA
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: __dirname });
});

app.listen(PORT, () => {
  console.log(`Admin Service running on http://localhost:${PORT}`);
  console.log(`Proxying to main backend at: ${MAIN_BACKEND_URL}`);
});

module.exports = app;
