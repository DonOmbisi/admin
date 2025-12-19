# EverythingMat Admin Portal

Complete admin management system for EverythingMat e-commerce platform.

## Architecture

```
Admin Portal (This Project)
├── Admin Frontend (React) - Static Site
└── Admin Service (Node.js) - Web Service
    └── Proxies to Main App API
        └── https://everythingmat-app.onrender.com/api/*

Main App (Separate Project)
├── Store Frontend + API
└── https://everythingmat-app.onrender.com
```

## Project Structure

```
everythingmat-admin-portal/
├── admin-frontend/     # React admin interface
├── admin-service/      # Node.js admin API
├── docker-compose.yml  # Local development
├── package.json        # Root package.json for scripts
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/everythingmat-admin-portal.git
   cd everythingmat-admin-portal
   npm install
   ```

2. **Start services:**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start separately:
   npm run dev:frontend  # Admin UI on http://localhost:3000
   npm run dev:service   # Admin API on http://localhost:3002
   ```

3. **Access admin panel:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3002/api

## Deployment

### Admin Service (Backend)
**Platform:** Render Web Service
**Root Directory:** `admin-service`
**Build Command:** `npm install`
**Start Command:** `npm start`
**Environment Variables:**
```
PORT=3002
NODE_ENV=production
MAIN_BACKEND_URL=https://everythingmat-app.onrender.com
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Admin Frontend (UI)
**Platform:** Render Static Site (or Vercel/Netlify)
**Root Directory:** `admin-frontend`
**Build Command:** `npm run build`
**Publish Directory:** `dist`
**Environment Variables:**
```
VITE_ADMIN_API_URL=https://your-admin-service.onrender.com
```

## API Routes

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Products Management
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories Management
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Orders Management
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details

## Development Scripts

```bash
# Install all dependencies
npm install

# Start both services for development
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:service

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

### Admin Service (.env)
```
PORT=3002
NODE_ENV=development
MAIN_BACKEND_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/everythingmat-admin
JWT_SECRET=your-development-jwt-secret
```

### Admin Frontend (.env.local)
```
VITE_ADMIN_API_URL=http://localhost:3002
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
