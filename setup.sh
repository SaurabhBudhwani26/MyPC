#!/bin/bash

echo "🚀 Setting up My PC App development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared package dependencies
echo "📦 Installing shared package dependencies..."
cd shared && npm install && cd ..

# Build shared package
echo "🔨 Building shared package..."
cd shared && npm run build && cd ..

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web && npm install && cd ..

# Install mobile dependencies
echo "📦 Installing mobile dependencies..."
cd mobile && npm install && cd ..

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f "web/.env.local" ]; then
    cp web/.env.example web/.env.local
    echo "📝 Created web/.env.local - please update with your API keys"
fi

if [ ! -f "mobile/.env.local" ]; then
    cp mobile/.env.example mobile/.env.local
    echo "📝 Created mobile/.env.local - please update with your API keys"
fi

echo ""
echo "✅ Setup complete! Your My PC App is ready for development."
echo ""
echo "🚀 To start development:"
echo "  npm run dev                    # Start all services"
echo "  npm run dev:web               # Start web app only"
echo "  npm run dev:mobile            # Start mobile app only"
echo ""
echo "📱 For mobile development:"
echo "  1. Install Expo Go on your phone"
echo "  2. Run 'npm run dev:mobile'"
echo "  3. Scan the QR code with Expo Go"
echo ""
echo "🌐 Web app will be available at: http://localhost:3000"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Update API keys in .env.local files"
echo "  2. Set up your backend API server"
echo "  3. Configure affiliate accounts"
