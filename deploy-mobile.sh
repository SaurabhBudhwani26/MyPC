#!/bin/bash

# MyPC Mobile App Deployment Script
# This script helps build and deploy the mobile app with EAS

set -e  # Exit on any error

echo "📱 MyPC Mobile App Deployment Script"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "mobile/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed"
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

echo "🔐 Logging in to EAS..."
eas login

echo "📁 Navigating to mobile directory..."
cd mobile

# Check if EAS project is initialized
if [ ! -f "eas.json" ]; then
    echo "🚀 Initializing EAS project..."
    eas init
fi

echo "🔧 Environment check..."
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found"
    echo "Please create mobile/.env.production with your backend URL and other settings"
    exit 1
fi

echo "✅ .env.production found"

echo "📋 Choose deployment option:"
echo "1) Android Preview Build (for testing)"
echo "2) iOS Preview Build (for testing)"
echo "3) Android Production Build (for Google Play)"
echo "4) iOS Production Build (for App Store)"
echo "5) Both Android & iOS Production Builds"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🤖 Building Android preview..."
        eas build --platform android --profile preview
        ;;
    2)
        echo "🍎 Building iOS preview..."
        eas build --platform ios --profile preview
        ;;
    3)
        echo "🤖 Building Android production..."
        eas build --platform android --profile production
        ;;
    4)
        echo "🍎 Building iOS production..."
        eas build --platform ios --profile production
        ;;
    5)
        echo "📱 Building both platforms for production..."
        eas build --platform all --profile production
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "⏳ Build started! This may take 10-15 minutes..."
echo "📊 You can check build status with: eas build:list"
echo "🌐 Or visit: https://expo.dev/accounts/[your-account]/projects/mypc-app/builds"

echo ""
echo "📝 Next steps after build completes:"
echo "1. Download the build from Expo dashboard"
echo "2. Test the app thoroughly"
echo "3. If ready for stores, use: eas submit --platform [android/ios]"
echo ""
