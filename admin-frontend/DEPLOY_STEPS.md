# Admin Frontend Deployment Steps

## Option 1: Vercel (Recommended)

### 1. Deploy Admin Frontend
```bash
cd admin-frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard:
VITE_ADMIN_API_URL=https://your-admin-service.vercel.app
```

### 2. Update Environment Variable
In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `VITE_ADMIN_API_URL`
3. Value: `https://your-admin-service.up.railway.app` (your actual admin service URL)

## Option 2: Netlify

### 1. Build and Deploy
```bash
cd admin-frontend

# Build
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist

# Set environment variable in Netlify dashboard:
VITE_ADMIN_API_URL=https://your-admin-service.vercel.app
```

### 2. Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_ADMIN_API_URL = "https://your-admin-service.vercel.app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Option 3: Custom Domain Setup

### 1. DNS Configuration
```
A Record: admin.yourdomain.com → Admin Frontend IP
A Record: api.yourdomain.com → Main Backend IP  
A Record: admin-api.yourdomain.com → Admin Service IP
```

### 2. Update Frontend Environment
```env
VITE_ADMIN_API_URL=https://admin-api.yourdomain.com
```

## Testing Deployment

### 1. Verify Admin Service
```bash
curl https://your-admin-service.vercel.app/health

# Should return:
{
  "status": "healthy",
  "service": "admin-service"
}
```

### 2. Test Admin Frontend
```bash
# Visit https://your-admin-frontend.vercel.app
# Should show login page
```

### 3. Test Authentication
```bash
# Test login through admin service
curl -X POST https://your-admin-service.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@everythingmat.com","password":"admin123"}'
```

## Environment Variables Summary

### Admin Frontend (.env)
```env
VITE_ADMIN_API_URL=https://your-admin-service.vercel.app
```

### Admin Service (.env)
```env
PORT=3002
MAIN_BACKEND_URL=https://your-main-backend.vercel.app
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
```

### Main Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
```

## Data Flow Verification

1. **Admin Frontend** → **Admin Service** → **Database**
2. **Main Frontend** → **Main Backend** → **Database**
3. **Both read/write to same database** → **Real-time sync**

## Troubleshooting

### CORS Issues
Add your admin frontend URL to admin service CORS:
```javascript
app.use(cors({
  origin: [
    'https://your-admin-frontend.vercel.app',
    'https://your-main-frontend.vercel.app'
  ],
  credentials: true
}));
```

### Authentication Issues
Ensure JWT secrets match between admin service and main backend.

### Database Connection Issues
Verify MongoDB URI is accessible from both services.
