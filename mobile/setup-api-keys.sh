#!/bin/bash

# Affiliate API Keys Setup Script
# Run this after obtaining your API keys

echo "🔑 Setting up Affiliate API Keys..."
echo "This script will help you configure your .env file"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

echo "Please enter your API keys (press Enter to skip any):"
echo ""

# Amazon API Keys
echo "📦 AMAZON AFFILIATE SETUP:"
read -p "Amazon Access Key ID: " AMAZON_ACCESS_KEY_ID
read -p "Amazon Secret Access Key: " AMAZON_SECRET_ACCESS_KEY  
read -p "Amazon Partner Tag: " AMAZON_PARTNER_TAG
read -p "Amazon Host (default: webservices.amazon.com): " AMAZON_HOST
read -p "Amazon Region (default: us-east-1): " AMAZON_REGION

# Set defaults
AMAZON_HOST=${AMAZON_HOST:-webservices.amazon.com}
AMAZON_REGION=${AMAZON_REGION:-us-east-1}

echo ""
echo "🛍️ FLIPKART AFFILIATE SETUP:"
read -p "Flipkart Affiliate ID: " FLIPKART_AFFILIATE_ID
read -p "Flipkart Affiliate Token: " FLIPKART_AFFILIATE_TOKEN

echo ""
echo "🔗 ADDITIONAL NETWORKS (Optional):"
read -p "CueLinks API Key: " CUELINKS_API_KEY
read -p "EarnKaro API Key: " EARNKARO_API_KEY

echo ""
echo "Writing to .env file..."

# Remove existing entries and add new ones
grep -v "AMAZON_ACCESS_KEY_ID\|AMAZON_SECRET_ACCESS_KEY\|AMAZON_PARTNER_TAG\|AMAZON_HOST\|AMAZON_REGION\|FLIPKART_AFFILIATE_ID\|FLIPKART_AFFILIATE_TOKEN\|CUELINKS_API_KEY\|EARNKARO_API_KEY" .env > .env.tmp

# Add new entries
{
    echo ""
    echo "# Amazon Product Advertising API Configuration"
    [ ! -z "$AMAZON_ACCESS_KEY_ID" ] && echo "AMAZON_ACCESS_KEY_ID=$AMAZON_ACCESS_KEY_ID"
    [ ! -z "$AMAZON_SECRET_ACCESS_KEY" ] && echo "AMAZON_SECRET_ACCESS_KEY=$AMAZON_SECRET_ACCESS_KEY"
    [ ! -z "$AMAZON_PARTNER_TAG" ] && echo "AMAZON_PARTNER_TAG=$AMAZON_PARTNER_TAG"
    echo "AMAZON_HOST=$AMAZON_HOST"
    echo "AMAZON_REGION=$AMAZON_REGION"
    echo ""
    echo "# Flipkart Affiliate API Configuration"
    [ ! -z "$FLIPKART_AFFILIATE_ID" ] && echo "FLIPKART_AFFILIATE_ID=$FLIPKART_AFFILIATE_ID"
    [ ! -z "$FLIPKART_AFFILIATE_TOKEN" ] && echo "FLIPKART_AFFILIATE_TOKEN=$FLIPKART_AFFILIATE_TOKEN"
    echo "FLIPKART_API_URL=https://affiliate-api.flipkart.net"
    echo ""
    echo "# Additional Affiliate Networks (Optional)"
    [ ! -z "$CUELINKS_API_KEY" ] && echo "CUELINKS_API_KEY=$CUELINKS_API_KEY"
    [ ! -z "$EARNKARO_API_KEY" ] && echo "EARNKARO_API_KEY=$EARNKARO_API_KEY"
} >> .env.tmp

mv .env.tmp .env

echo "✅ Environment variables configured!"
echo "🔒 Make sure .env is in your .gitignore file"
echo ""
echo "Next steps:"
echo "1. Test your API keys with the app"
echo "2. Check API rate limits and usage policies"
echo "3. Monitor your affiliate earnings in respective dashboards"
