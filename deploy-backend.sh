#!/bin/bash

# MyPC Backend Deployment Script
# This script helps deploy the backend to Railway

set -e  # Exit on any error

echo "🚀 MyPC Backend Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging in to Railway..."
railway login

echo "📁 Navigating to backend directory..."
cd backend

# Check if Railway project is initialized
if [ ! -f "railway.json" ]; then
    echo "🚀 Initializing Railway project..."
    railway init
fi

echo "🔧 Setting up environment variables..."
echo "Note: You'll need to set these variables in Railway dashboard manually:"
echo "- NODE_ENV=production"
echo "- PORT=3001"
echo "- MONGODB_URI=your-mongodb-atlas-connection-string"
echo "- JWT_SECRET=your-super-secure-jwt-secret"
echo "- CORS_ORIGIN=https://your-domain.com"

read -p "Have you set all required environment variables in Railway? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set environment variables first and re-run this script"
    echo "📖 Visit: https://railway.app/dashboard"
    exit 1
fi

echo "🚀 Deploying to Railway..."
railway up

echo "📊 Getting deployment status..."
railway status

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your backend should be available at the URL shown above"
echo "🔍 Test your deployment by visiting: [YOUR_URL]/health"
echo ""
echo "📝 Next steps:"
echo "1. Update your mobile app's EXPO_PUBLIC_API_URL in .env.production"
echo "2. Build and deploy your mobile app with EAS"
echo ""
