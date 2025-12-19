# Combined Admin Service Deployment

## Overview
Single service that serves both the admin API and React frontend from one deployment.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│              Combined Admin Service                       │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │   React App    │    │   Admin API     │         │
│  │   (Frontend)   │    │   (Backend)     │         │
│  │   Port 3002    │    │   Port 3002     │         │
│  └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │   Main Backend │
                   │   Port 3001    │
                   └─────────────────┘
```

## Setup Instructions

### 1. Build Process (Automatic)
The build process is now automatic:
```bash
cd admin/service

# This runs automatically on Render:
npm run setup  # Builds frontend + copies files + installs dependencies
```

### 2. Deploy to Render

#### Create Web Service
1. **Render Dashboard** → **"New +"** → **"Web Service"**
2. **Connect GitHub repo**
3. **Configure:**
   ```
   Name: everythingmat-admin-combined
   Root Directory: admin/service
   Build Command: npm run setup
   Start Command: npm start
   Runtime: Node 18
   Instance Type: Free → Standard ($7/month)
   ```

#### Environment Variables
```env
PORT=3002
NODE_ENV=production
MAIN_BACKEND_URL=https://everythingmat-app.onrender.com
MONGODB_URI=mongodb+srv://DONMIKE:dataviz@cluster0.ca18ur6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=e7f3b2c4a1d94f8b9c6e3a7d2f5b8c1e3d6a9f0b2c4e7a8d9f1b3c6e2a4d7f9
```

### 3. Frontend Configuration (Already Done)

**No changes needed!** The frontend is already configured for combined deployment:

- `API_BASE` uses `VITE_ADMIN_API_URL` env var, or empty string (relative URLs)
- For combined deployment, empty string = same origin (perfect!)
- All API calls use relative paths like `/api/products`

### 3. Single URL Access

After deployment, you'll have:
```
Admin Panel: https://your-admin-service.onrender.com
Admin API:   https://your-admin-service.onrender.com/api
```

## Benefits of Combined Approach

✅ **Single Deployment**: Only one service to manage
✅ **Simpler**: No CORS issues between frontend and API
✅ **Cheaper**: One service instead of two
✅ **Easier**: Same domain, no cross-origin issues
✅ **Faster**: No network latency between frontend and API

## How It Works

### Frontend Requests
- React app makes requests to `/api/*`
- Same service handles both frontend and API
- No CORS issues (same origin)

### API Proxy
- `/api/auth/login` → Handled locally
- `/api/products/*` → Proxied to main backend
- `/api/orders/*` → Proxied to main backend

### Static Files
- React build files served from `/`
- All non-API routes serve `index.html`
- React Router handles client-side routing

## Testing Combined Service

### 1. Local Development
```bash
cd admin/service

# Build frontend first
npm run build-frontend

# Start combined service
npm run dev

# Access at: http://localhost:3002
```

### 2. Production Testing
```bash
# Health check
curl https://your-admin-service.onrender.com/api/health

# Should return:
{
  "status": "healthy",
  "service": "admin-service"
}
```

### 3. Admin Panel Test
Visit: https://your-admin-service.onrender.com
Should show login page and work perfectly.

## Project Structure
```
admin/                         # Admin module
├── service/                   # Deployed as root directory
│   ├── combined-server.js     # Main server file
│   ├── dist/                  # Built React app (copied from ../frontend)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── node_modules/
│   ├── package.json
│   └── .env
│
└── frontend/                  # Source directory (not deployed)
    ├── src/
    ├── package.json
    └── ...
```

## Render Configuration

### Build Process
1. Render runs `npm run setup`
2. This builds React frontend first
3. Then installs Node.js dependencies
4. Starts combined server

### Runtime
- Single Node.js process
- Serves static files and handles API
- Proxies admin requests to main backend

## Cost Comparison

| Approach | Services | Cost/Month |
|-----------|-----------|-------------|
| Separate | 2 (API + Frontend) | $7-25 |
| **Combined** | **1** | **$7** |

## Migration from Separate to Combined

### If you already deployed separately:
1. **Create new combined service** on Render
2. **Update environment variables**
3. **Deploy combined service**
4. **Test functionality**
5. **Delete old separate services**
6. **Update DNS/custom domains**

## Custom Domain Setup

### Single Domain
```
admin.yourdomain.com → https://your-combined-admin.onrender.com
```

### Environment Update
```env
VITE_ADMIN_API_URL=https://admin.yourdomain.com
```

## Troubleshooting

### Frontend Not Loading
- Check if `admin-frontend/dist` exists
- Verify build command completed successfully
- Check Render build logs

### API Not Working
- Verify environment variables
- Check main backend URL is correct
- Test proxy requests manually

### CORS Issues
- Should not exist with combined approach
- If they do, check API_BASE configuration

## Recommended Approach

**For most users, the combined approach is better because:**

1. **Simpler deployment**
2. **No CORS issues**
3. **Lower cost**
4. **Easier maintenance**
5. **Same origin security**

Only use separate approach if you need:
- Independent scaling of frontend vs API
- Different deployment schedules
- Different hosting providers for frontend vs API
