#!/bin/bash

# Interactive API Keys Setup Script for PC Components App
# Run this after getting your affiliate API keys

echo "🚀 Welcome to PC Components App API Setup!"
echo "=========================================="
echo ""
echo "This script will help you configure all your affiliate API keys."
echo "Have your API keys ready before continuing."
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        echo -n "$prompt (default: $default): "
    else
        echo -n "$prompt: "
    fi
    
    read input
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

# Check if .env exists
if [ -f .env ]; then
    echo "📁 Found existing .env file. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created successfully"
else
    echo "📁 Creating new .env file..."
    touch .env
fi

echo ""
echo "🔑 Let's configure your affiliate API keys:"
echo ""

# EarnKaro Configuration
echo "1️⃣ EARNKARO CONFIGURATION"
echo "------------------------"
echo "If you haven't signed up yet, visit: https://earnkaro.com/"
echo ""

prompt_with_default "Enter your EarnKaro API Key" "your_earnkaro_api_key_here" "EARNKARO_KEY"
prompt_with_default "EarnKaro API URL" "https://ekaro-api.affiliaters.in/api" "EARNKARO_URL"

echo ""

# CueLinks Configuration (optional)
echo "2️⃣ CUELINKS CONFIGURATION (Optional)"
echo "-----------------------------------"
echo "If you have CueLinks account, visit: https://www.cuelinks.com/"
echo ""

read -p "Do you have a CueLinks API key? (y/n): " has_cuelinks
if [[ $has_cuelinks =~ ^[Yy]$ ]]; then
    prompt_with_default "Enter your CueLinks API Key" "" "CUELINKS_KEY"
else
    echo "⏭️ Skipping CueLinks configuration"
    CUELINKS_KEY=""
fi

echo ""

# Flipkart Configuration
echo "3️⃣ FLIPKART AFFILIATE CONFIGURATION"
echo "----------------------------------"
echo "If you haven't applied yet, visit: https://affiliate.flipkart.com/"
echo ""

read -p "Do you have Flipkart Affiliate credentials? (y/n): " has_flipkart
if [[ $has_flipkart =~ ^[Yy]$ ]]; then
    prompt_with_default "Enter your Flipkart Affiliate ID" "" "FLIPKART_ID"
    prompt_with_default "Enter your Flipkart Affiliate Token" "" "FLIPKART_TOKEN"
    prompt_with_default "Flipkart API URL" "https://affiliate-api.flipkart.net" "FLIPKART_URL"
else
    echo "⏭️ Using demo values for Flipkart (will show mock data)"
    FLIPKART_ID="demo_affiliate_id"
    FLIPKART_TOKEN="demo_affiliate_token"
    FLIPKART_URL="https://affiliate-api.flipkart.net"
fi

echo ""

# Amazon Configuration
echo "4️⃣ AMAZON ASSOCIATES CONFIGURATION"
echo "---------------------------------"
echo "If you haven't applied yet, visit: https://affiliate-program.amazon.in/"
echo ""

read -p "Do you have Amazon Associates + PA-API access? (y/n): " has_amazon
if [[ $has_amazon =~ ^[Yy]$ ]]; then
    prompt_with_default "Enter your Amazon Access Key ID" "" "AMAZON_ACCESS_KEY"
    prompt_with_default "Enter your Amazon Secret Access Key" "" "AMAZON_SECRET_KEY"
    prompt_with_default "Enter your Amazon Partner Tag" "" "AMAZON_PARTNER_TAG"
    prompt_with_default "Amazon Host" "webservices.amazon.in" "AMAZON_HOST"
    prompt_with_default "Amazon Region" "us-east-1" "AMAZON_REGION"
else
    echo "⏭️ Skipping Amazon configuration (will use mock data)"
    AMAZON_ACCESS_KEY=""
    AMAZON_SECRET_KEY=""
    AMAZON_PARTNER_TAG=""
    AMAZON_HOST="webservices.amazon.in"
    AMAZON_REGION="us-east-1"
fi

echo ""

# Additional Configuration
echo "5️⃣ ADDITIONAL CONFIGURATION"
echo "--------------------------"

prompt_with_default "API URL (your backend)" "http://localhost:3001/api" "API_URL"
prompt_with_default "Enable debug mode" "true" "DEBUG_MODE"

echo ""
echo "💾 Writing configuration to .env file..."

# Write to .env file
cat > .env << EOF
# API Configuration
EXPO_PUBLIC_API_URL=$API_URL

# Amazon Product Advertising API Configuration
EOF

if [ -n "$AMAZON_ACCESS_KEY" ]; then
cat >> .env << EOF
AMAZON_ACCESS_KEY_ID=$AMAZON_ACCESS_KEY
AMAZON_SECRET_ACCESS_KEY=$AMAZON_SECRET_KEY
AMAZON_PARTNER_TAG=$AMAZON_PARTNER_TAG
EOF
else
cat >> .env << EOF
# AMAZON_ACCESS_KEY_ID=your-access-key-id
# AMAZON_SECRET_ACCESS_KEY=your-secret-access-key
# AMAZON_PARTNER_TAG=your-amazon-affiliate-tag
EOF
fi

cat >> .env << EOF
AMAZON_HOST=$AMAZON_HOST
AMAZON_REGION=$AMAZON_REGION

# Flipkart Affiliate API Configuration
FLIPKART_AFFILIATE_ID=$FLIPKART_ID
FLIPKART_AFFILIATE_TOKEN=$FLIPKART_TOKEN
FLIPKART_API_URL=$FLIPKART_URL

# EarnKaro API Configuration
EARNKARO_API_KEY=$EARNKARO_KEY
EARNKARO_API_URL=$EARNKARO_URL

EOF

if [ -n "$CUELINKS_KEY" ]; then
cat >> .env << EOF
# CueLinks API Configuration
CUELINKS_API_KEY=$CUELINKS_KEY

EOF
else
cat >> .env << EOF
# CueLinks API Configuration (Optional)
# CUELINKS_API_KEY=your-cuelinks-key

EOF
fi

cat >> .env << EOF
# Debug Mode
EXPO_PUBLIC_DEBUG_MODE=$DEBUG_MODE
EOF

echo "✅ Configuration saved to .env file!"
echo ""

# Security check
echo "🔒 SECURITY REMINDER:"
echo "- ✅ .env file should be in .gitignore"
echo "- ✅ Never commit API keys to version control"
echo "- ✅ Keep your API keys secure and private"
echo ""

# Validation
echo "🧪 VALIDATING CONFIGURATION:"
echo ""

working_apis=0

if [ "$EARNKARO_KEY" != "your_earnkaro_api_key_here" ] && [ -n "$EARNKARO_KEY" ]; then
    echo "✅ EarnKaro: Configured"
    working_apis=$((working_apis + 1))
else
    echo "⚠️ EarnKaro: Not configured (will use mock data)"
fi

if [ -n "$CUELINKS_KEY" ]; then
    echo "✅ CueLinks: Configured"
    working_apis=$((working_apis + 1))
else
    echo "⚠️ CueLinks: Not configured"
fi

if [ "$FLIPKART_ID" != "demo_affiliate_id" ] && [ -n "$FLIPKART_ID" ]; then
    echo "✅ Flipkart: Configured"
    working_apis=$((working_apis + 1))
else
    echo "⚠️ Flipkart: Using demo mode"
fi

if [ -n "$AMAZON_ACCESS_KEY" ]; then
    echo "✅ Amazon: Configured"
    working_apis=$((working_apis + 1))
else
    echo "⚠️ Amazon: Not configured (will use mock data)"
fi

echo ""
echo "📊 SUMMARY:"
echo "- Working APIs: $working_apis/4"
if [ $working_apis -gt 0 ]; then
    echo "- Status: ✅ Ready to earn money!"
else
    echo "- Status: 🎭 Demo mode (using mock data)"
fi
echo ""

# Next steps
echo "🚀 NEXT STEPS:"
echo ""
echo "1. Test your app:"
echo "   npx expo start"
echo ""
echo "2. Go to 'Deals' tab and check for real data"
echo ""
echo "3. Monitor your earnings:"
if [ "$EARNKARO_KEY" != "your_earnkaro_api_key_here" ]; then
    echo "   - EarnKaro: https://earnkaro.com/dashboard"
fi
if [ "$FLIPKART_ID" != "demo_affiliate_id" ]; then
    echo "   - Flipkart: https://affiliate.flipkart.com/dashboard"
fi
if [ -n "$AMAZON_ACCESS_KEY" ]; then
    echo "   - Amazon: https://affiliate-program.amazon.in/"
fi
echo ""

echo "4. Share your app and start earning! 💰"
echo ""

# Offer to start the app
read -p "🚀 Would you like to start your app now? (y/n): " start_app
if [[ $start_app =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting your PC Components App..."
    npx expo start
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "Good luck with your affiliate earnings! 💰"
