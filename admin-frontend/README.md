# Everything Maternity Admin Frontend

A separate admin frontend that connects to the admin service for complete independence from the main application.

## Features

- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Complete Admin Panel**: Dashboard, Products, Categories, Orders management
- **Authentication**: Secure login with JWT tokens
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Live data synchronization with admin service

## Architecture

```
Admin Frontend → Admin Service → Main Backend → Database
```

## Setup

1. **Install Dependencies**:
   ```bash
   cd admin-frontend
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root:
   ```env
   VITE_ADMIN_API_URL=http://localhost:3002
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Pages

### Dashboard (`/dashboard`)
- Overview statistics
- Recent products
- Key metrics

### Products (`/products`)
- Product listing with search
- Bulk selection and deletion
- Individual product actions
- Status indicators

### Categories (`/categories`)
- Category management
- Grid layout
- Edit/delete actions

### Orders (`/orders`)
- Order listing
- Status filtering
- Search functionality
- Customer information

### Login (`/login`)
- Secure authentication
- Form validation
- Error handling

## API Integration

The frontend connects to the admin service through the `AdminServiceContext`:

```typescript
const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 
  (import.meta.env.PROD 
    ? 'https://admin.everythingmaternity.com' 
    : 'http://localhost:3002');
```

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theme**: Pink-based color scheme
- **Responsive**: Mobile-first design
- **Icons**: Lucide React icons

## Security Features

- JWT token authentication
- Secure token storage
- Automatic logout on token expiry
- Protected routes

## Deployment Options

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Environment Variables

- `VITE_ADMIN_API_URL`: Admin service URL
- `NODE_ENV`: Environment (development/production)

## Development

### Port Configuration
- Admin Frontend: `http://localhost:5174`
- Admin Service: `http://localhost:3002`
- Main Backend: `http://localhost:3001`

### Hot Reload
The development server supports hot module replacement for fast development.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Bundle Size**: Optimized with Vite
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Automatic minification
