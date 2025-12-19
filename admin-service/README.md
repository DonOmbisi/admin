# Everything Maternity Admin Service

A separate admin service that can be hosted independently while connecting to the main backend and database.

## Features

- **Independent Deployment**: Can be hosted separately from the main application
- **Proxy Architecture**: Proxies admin requests to the main backend
- **Authentication**: Shared authentication with main backend
- **Database Sync**: Direct database connection for admin operations
- **Security**: Rate limiting, helmet security, CORS protection

## Architecture

```
Admin Frontend → Admin Service → Main Backend → Database
                    ↘ Database (direct)
```

## Setup

1. **Install Dependencies**:
   ```bash
   cd admin-service
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

4. **Start Production**:
   ```bash
   npm start
   ```

## Environment Variables

- `PORT`: Admin service port (default: 3002)
- `MAIN_BACKEND_URL`: Main backend URL
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: JWT secret for admin service
- `NODE_ENV`: Environment (development/production)

## API Endpoints

The admin service provides the same API endpoints as the main backend for admin operations:

- `POST /api/auth/login` - Admin authentication
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete single product
- `DELETE /api/products/bulk-delete` - Bulk delete products
- `GET /api/categories` - Get categories
- `GET /api/orders` - Get orders

## Deployment Options

### Option 1: Local Development
```bash
# Main backend on port 3001
cd backend && npm start

# Admin service on port 3002
cd admin-service && npm run dev

# Frontend on port 5173
npm run dev
```

### Option 2: Separate Hosting
- Main backend: `https://api.everythingmaternity.com`
- Admin service: `https://admin.everythingmaternity.com`
- Frontend: `https://everythingmaternity.com`

### Option 3: Subdomain
- Main backend: `https://api.everythingmaternity.com`
- Admin service: `https://admin-api.everythingmaternity.com`
- Frontend: `https://everythingmaternity.com`

## Frontend Configuration

Update your frontend admin context to point to the admin service:

```typescript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://admin.everythingmaternity.com' 
  : 'http://localhost:3002';
```

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured for allowed origins
- **JWT Authentication**: Secure token-based auth
- **Admin Role Verification**: Admin-only endpoints

## Database

The admin service connects directly to the same MongoDB database as the main backend, ensuring data consistency.

## Monitoring

- Health check endpoint: `/health`
- Comprehensive error logging
- Request/response logging for debugging
