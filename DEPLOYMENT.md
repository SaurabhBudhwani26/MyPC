# MyPC App - Deployment Guide

This guide covers deploying both the backend API and mobile app for the MyPC application.

## Prerequisites

- Node.js 18+
- Expo CLI or EAS CLI
- Railway account (for backend deployment)
- MongoDB Atlas account (for database)
- Expo account (for mobile app deployment)

## Backend Deployment

### Step 1: Set up MongoDB Atlas

1. Create a free MongoDB Atlas account at https://mongodb.com/atlas
2. Create a new cluster (choose the free tier)
3. Create a database user with read/write permissions
4. Whitelist IP addresses (use 0.0.0.0/0 for production access from anywhere)
5. Get your connection string

### Step 2: Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

4. **Initialize Railway project:**
   ```bash
   railway init
   ```

5. **Set environment variables in Railway dashboard or CLI:**
   ```bash
   # Required environment variables
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set MONGODB_URI="your-mongodb-atlas-connection-string"
   railway variables set JWT_SECRET="your-super-secure-jwt-secret"
   railway variables set CORS_ORIGIN="https://your-mobile-app-domain.com"
   
   # Optional: Rate limiting
   railway variables set RATE_LIMIT_WINDOW_MS=900000
   railway variables set RATE_LIMIT_MAX_REQUESTS=100
   
   # Optional: Affiliate API keys
   railway variables set AMAZON_AFFILIATE_TAG="your-affiliate-tag"
   railway variables set AMAZON_PA_API_ACCESS_KEY="your-access-key"
   railway variables set AMAZON_PA_API_SECRET_KEY="your-secret-key"
   railway variables set FLIPKART_AFFILIATE_ID="your-affiliate-id"
   railway variables set FLIPKART_AFFILIATE_TOKEN="your-affiliate-token"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Get your backend URL:**
   ```bash
   railway status
   ```
   Note down the generated URL (e.g., `https://mypc-backend-production.up.railway.app`)

### Step 3: Verify Backend Deployment

Visit your backend URL + `/health` (e.g., `https://mypc-backend-production.up.railway.app/health`) to verify deployment.

## Mobile App Deployment

### Step 1: Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Update Environment Variables

1. **Update mobile/.env.production:**
   ```env
   # Replace with your actual backend URL from Railway
   EXPO_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
   
   # Add your affiliate tags
   AMAZON_AFFILIATE_TAG=your-affiliate-tag
   FLIPKART_AFFILIATE_ID=your-affiliate-id
   
   # App configuration
   EXPO_PUBLIC_APP_ENV=production
   EXPO_PUBLIC_API_TIMEOUT=10000
   ```

### Step 4: Configure Expo Project

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Initialize EAS project:**
   ```bash
   eas init
   ```

3. **Update mobile/app.json with your details:**
   ```json
   {
     "expo": {
       "name": "MyPC - PC Builder & Price Comparison",
       "slug": "mypc-app",
       "owner": "your-expo-username",
       "extra": {
         "eas": {
           "projectId": "your-eas-project-id"
         }
       },
       "ios": {
         "bundleIdentifier": "com.yourcompany.mypc"
       },
       "android": {
         "package": "com.yourcompany.mypc"
       }
     }
   }
   ```

### Step 5: Build the App

1. **For Android APK (testing):**
   ```bash
   eas build --platform android --profile preview
   ```

2. **For iOS TestFlight (testing):**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **For production builds:**
   ```bash
   # Android (Google Play Store)
   eas build --platform android --profile production
   
   # iOS (App Store)
   eas build --platform ios --profile production
   ```

### Step 6: Submit to App Stores (Optional)

1. **Submit to Google Play Store:**
   ```bash
   eas submit --platform android
   ```

2. **Submit to Apple App Store:**
   ```bash
   eas submit --platform ios
   ```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | Yes | `production` |
| `PORT` | Server port | Yes | `3001` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-super-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origins | No | `https://app.com,https://web.com` |
| `AMAZON_AFFILIATE_TAG` | Amazon affiliate tag | No | `your-tag-20` |
| `FLIPKART_AFFILIATE_ID` | Flipkart affiliate ID | No | `your-id` |

### Mobile (.env.production)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | Yes | `https://api.mypc.com/api` |
| `AMAZON_AFFILIATE_TAG` | Amazon affiliate tag | No | `your-tag-20` |
| `FLIPKART_AFFILIATE_ID` | Flipkart affiliate ID | No | `your-id` |
| `EXPO_PUBLIC_APP_ENV` | App environment | No | `production` |

## Deployment Commands Quick Reference

### Backend Deployment
```bash
# Deploy backend to Railway
cd backend
railway up

# Check deployment status
railway status

# View logs
railway logs
```

### Mobile App Deployment
```bash
# Build for testing
cd mobile
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Build for production
eas build --platform android --profile production
eas build --platform ios --profile production

# Check build status
eas build:list
```

## Updating Deployments

### Backend Updates
```bash
cd backend
# Make your changes
railway up  # Redeploy
```

### Mobile App Updates
```bash
cd mobile
# Update version in app.json
# Make your changes
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Monitoring and Maintenance

### Backend Monitoring
- Railway provides built-in monitoring at https://railway.app/dashboard
- API health check: `GET /health`
- API documentation: `GET /api-docs`

### Mobile App Monitoring
- Expo provides analytics at https://expo.dev/
- Consider integrating Sentry for error monitoring
- Monitor app store reviews and ratings

## Troubleshooting

### Common Backend Issues
1. **Database connection failed**: Check MongoDB Atlas whitelist and connection string
2. **CORS errors**: Verify `CORS_ORIGIN` environment variable
3. **JWT errors**: Ensure `JWT_SECRET` is set and consistent

### Common Mobile App Issues
1. **API connection failed**: Verify `EXPO_PUBLIC_API_URL` matches your backend deployment
2. **Build failed**: Check that all required environment variables are set
3. **App store submission failed**: Verify bundle identifiers and certificates

### Getting Help
- Railway: https://railway.app/help
- Expo: https://docs.expo.dev/
- MongoDB Atlas: https://docs.atlas.mongodb.com/

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to git
2. **API Keys**: Use separate development and production keys
3. **Database**: Use strong passwords and enable MongoDB Atlas security features
4. **HTTPS**: Always use HTTPS in production (Railway provides this automatically)
5. **Rate Limiting**: Configure appropriate rate limits for your API

## Cost Considerations

### Railway (Backend)
- Free tier: $5/month credit
- Pro plan: $20/month for additional resources

### MongoDB Atlas (Database)
- Free tier: 512MB storage (sufficient for starting)
- Paid plans start at $9/month

### Expo EAS (Mobile Builds)
- Free tier: Limited builds per month
- Production plan: $99/month for unlimited builds

## Next Steps

1. Set up CI/CD pipelines for automated deployments
2. Implement proper logging and monitoring
3. Add analytics and crash reporting
4. Set up automated backups for your database
5. Configure custom domains for your backend API
