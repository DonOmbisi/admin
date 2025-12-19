# Render Deployment Complete Guide

## Quick Deployment Steps

### 1. Admin Service (Web Service)

#### Render Dashboard Settings:
- **Name**: everythingmat-admin-service
- **Type**: Web Service
- **Root Directory**: admin-service
- **Runtime**: Node 18
- **Build Command**: npm install
- **Start Command**: npm start
- **Instance**: Free (then upgrade to Standard $7/month)

#### Environment Variables:
```
PORT=3002
NODE_ENV=production
MAIN_BACKEND_URL=https://your-main-backend.onrender.com
MONGODB_URI=mongodb+srv://DONMIKE:dataviz@cluster0.ca18ur6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=e7f3b2c4a1d94f8b9c6e3a7d2f5b8c1e3d6a9f0b2c4e7a8d9f1b3c6e2a4d7f9
ADMIN_JWT_SECRET=e7f3b2c4a1d94f8b9c6e3a7d2f5b8c1e3d6a9f0b2c4e7a8d9f1b3c6e2a4d7f9
```

### 2. Admin Frontend (Static Site)

#### Render Dashboard Settings:
- **Name**: everythingmat-admin-frontend
- **Type**: Static Site
- **Root Directory**: admin-frontend
- **Build Command**: npm run build
- **Publish Directory**: admin-frontend/dist
- **Node Version**: 18

#### Environment Variables:
```
VITE_ADMIN_API_URL=https://your-admin-service.onrender.com
```

## Render URLs After Deployment

```
Admin Service:    https://your-admin-service.onrender.com
Admin Frontend:   https://your-admin-frontend.onrender.com
Main Backend:    https://your-main-backend.onrender.com
```

## Custom Domain Setup (Optional)

### 1. Add Custom Domains in Render

#### For Admin Service:
1. Go to your admin service → Settings → Custom Domains
2. Add: `admin-api.yourdomain.com`
3. Update DNS: CNAME to `cname.vercel-dns.com`

#### For Admin Frontend:
1. Go to your admin frontend → Settings → Custom Domains
2. Add: `admin.yourdomain.com`
3. Update DNS: CNAME to `cname.vercel-dns.com`

### 2. Update Environment Variables

Once you have custom domains, update:

#### Admin Service:
```
MAIN_BACKEND_URL=https://api.yourdomain.com
```

#### Admin Frontend:
```
VITE_ADMIN_API_URL=https://admin-api.yourdomain.com
```

## Render-Specific Optimizations

### 1. Health Check Endpoint
Render automatically uses `/health` for health checks.

### 2. Port Handling
Render automatically sets PORT environment variable.

### 3. Instance Types
- **Free**: 512MB RAM, shared CPU (good for testing)
- **Standard**: $7/month, 512MB RAM, dedicated CPU
- **Standard Plus**: $15/month, 1GB RAM, dedicated CPU

## Testing Your Render Deployment

### 1. Check Admin Service Health
```bash
curl https://your-admin-service.onrender.com/health
```

### 2. Test Admin Frontend
Visit: https://your-admin-frontend.onrender.com
Should see login page.

### 3. Test Authentication
```bash
curl -X POST https://your-admin-service.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@everythingmat.com","password":"admin123"}'
```

### 4. Test Product Operations
1. Login to admin panel
2. Add a product
3. Check main website - product should appear

## Render Benefits

### ✅ Advantages:
- **Free tier** with 750 hours/month
- **Automatic SSL** certificates
- **GitHub integration** with auto-deploy
- **Environment variables** management
- **Logs and metrics**
- **Custom domains** support
- **Background workers** support

### ⚠️ Considerations:
- **Cold starts** on free tier (30-60 seconds)
- **Resource limits** on free tier
- **Upgrade needed** for production traffic

## Pricing Summary

| Plan | Price | RAM | CPU | Good For |
|------|-------|------|-----------|
| Free | $0 | 512MB | Shared | Development/Testing |
| Standard | $7 | 512MB | Dedicated | Production |
| Standard Plus | $15 | 1GB | Dedicated | High traffic |

## Migration from Other Hosting

### If coming from Railway:
1. Export environment variables
2. Update Render CORS settings
3. Update custom domains
4. Test all functionality

### If coming from Vercel:
1. Similar deployment process
2. Better for Node.js services than Vercel
3. More predictable pricing

## Troubleshooting Render

### Common Issues:

#### Service Not Starting:
```bash
# Check Render logs
# In dashboard → service → Logs
```

#### Database Connection:
```bash
# Verify MongoDB URI allows Render IP addresses
# Check MongoDB Atlas network access
```

#### CORS Issues:
Update CORS in admin service:
```javascript
app.use(cors({
  origin: [
    'https://your-admin-frontend.onrender.com',
    'https://your-main-frontend.onrender.com'
  ],
  credentials: true
}));
```

#### Environment Variables:
Ensure all required variables are set in Render dashboard.

## Production Checklist

Before going live with Render:

- [ ] All environment variables configured
- [ ] Custom domains pointing correctly
- [ ] SSL certificates active (automatic)
- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] CORS properly configured
- [ ] Login functionality tested
- [ ] Product operations tested
- [ ] Main website sync verified

Render provides excellent reliability and features for admin service deployment!
