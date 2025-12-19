const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;
const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'https://everythingmat-app.onrender.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'admin-zbvk.onrender.com'}` 
      : `http://localhost:${PORT}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    console.log('Image uploaded:', imageUrl);
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// File upload endpoint for Clarifai analysis
app.post('/api/clarifai/analyze-file', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    
    console.log('Analyzing uploaded file:', req.file.originalname);
    
    const response = await fetch('https://api.clarifai.com/v2/models/general-image-recognition/outputs', {
      method: 'POST',
      headers: {
        'Authorization': 'Key fd07cbf96493437d801644c9e09299cf',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [{
          data: {
            image: {
              base64: base64Image
            }
          }
        }]
      })
    });
    
    const result = await response.json();
    console.log('Clarifai response:', result);
    res.status(response.status).json(result);
  } catch (error) {
    console.error('File analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze file' });
  }
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'admin-service',
    timestamp: new Date().toISOString(),
    backend: MAIN_BACKEND_URL
  });
});

// Also support /health for compatibility
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'admin-service',
    timestamp: new Date().toISOString(),
    backend: MAIN_BACKEND_URL
  });
});

// Store the latest valid token for API requests
let latestToken = null;

// Auto-login to get token for API requests
const autoLogin = async () => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@everythingmat.com', 
        password: 'admin123' 
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      latestToken = data.token;
      console.log('Auto-login successful, token stored');
    } else {
      console.log('Auto-login failed');
    }
  } catch (error) {
    console.error('Auto-login error:', error);
  }
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
    const response = await fetch(`${MAIN_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful');
      latestToken = data.token; // Store token for future requests
      return res.json(data);
    } else {
      console.log('Login failed:', data);
      return res.status(401).json(data);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Add file upload endpoint for Clarifai analysis
app.post('/api/clarifai/analyze-file', async (req, res) => {
  try {
    // Note: This would require multer or similar middleware for file uploads
    // For now, we'll focus on URL-based analysis
    res.status(400).json({ 
      error: 'File upload not implemented yet. Please use image URLs.' 
    });
  } catch (error) {
    console.error('File analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze file' });
  }
});

// Clarifai API proxy endpoint
app.post('/api/clarifai/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    console.log('Analyzing image via Clarifai:', imageUrl);
    
    let imageData;
    
    // Handle blob URLs by converting to base64
    if (imageUrl.startsWith('blob:')) {
      // For blob URLs, we need to fetch the data and convert to base64
      // This is a limitation - blob URLs can't be accessed from server
      return res.status(400).json({ 
        error: 'Blob URLs cannot be analyzed. Please use a regular image URL or upload the file directly.' 
      });
    }
    
    const response = await fetch('https://api.clarifai.com/v2/models/general-image-recognition/outputs', {
      method: 'POST',
      headers: {
        'Authorization': 'Key fd07cbf96493437d801644c9e09299cf',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [{
          data: {
            image: {
              url: imageUrl
            }
          }
        }]
      })
    });
    
    const data = await response.json();
    console.log('Clarifai response:', data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Clarifai proxy error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/orders`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${MAIN_BACKEND_URL}/api/orders/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`${MAIN_BACKEND_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Helper function for auth headers
const getAuthHeaders = () => {
  const token = latestToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Debug endpoint to check database
app.get('/api/debug/products', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products?limit=10`);
    const data = await response.json();
    console.log('Debug - Products from backend:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products?limit=100`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('Creating product:', req.body);
    
    const headers = { 'Content-Type': 'application/json' };
    if (latestToken) {
      headers['Authorization'] = `Bearer ${latestToken}`;
    }
    
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    console.log('Product creation response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting product:', id);
    
    const headers = { 'Content-Type': 'application/json' };
    if (latestToken) {
      headers['Authorization'] = `Bearer ${latestToken}`;
    }
    
    const response = await fetch(`${MAIN_BACKEND_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers
    });
    const data = await response.json();
    console.log('Product deletion response:', response.status, data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/categories`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/subcategories', async (req, res) => {
  try {
    const response = await fetch(`${MAIN_BACKEND_URL}/api/subcategories`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Subcategories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Simple Admin Service running on http://localhost:${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Proxying to main backend at: ${MAIN_BACKEND_URL}`);
  
  // Auto-login to get token for API requests
  autoLogin();
});

module.exports = app;
