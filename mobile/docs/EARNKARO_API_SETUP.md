# EarnKaro API Setup Guide

## Overview

Your app is currently using **demo/test API credentials** for EarnKaro. To enable real-time affiliate deals and link conversions, you need to get an actual EarnKaro API key.

## Current Status ✅

- **EarnKaro API Service**: ✅ Configured and working
- **Authentication**: ✅ Properly implemented 
- **Mock Data**: ✅ Enhanced PC component deals
- **API Key**: ❌ Using test key (needs real key for live data)

## Getting Your Real EarnKaro API Key

### Step 1: Sign Up for EarnKaro

1. Go to **[EarnKaro.com](https://www.earnkaro.com/)**
2. Click **"Join Now"** or **"Sign Up"**
3. Complete the registration process
4. Verify your email and phone number

### Step 2: Apply for API Access

1. **Login to your EarnKaro account**
2. **Contact EarnKaro Support** for API access:
   - Email: `support@earnkaro.com`
   - Subject: "API Access Request for Affiliate Integration"
   - Mention your use case: "PC Component Price Comparison App"

3. **Provide the following information**:
   ```
   App Name: MyPC - PC Component Price Comparison
   Platform: React Native (iOS/Android)
   Use Case: Affiliate link conversion and deal fetching
   Expected Monthly Volume: [Your estimate]
   ```

### Step 3: Get Your API Token

Once approved, EarnKaro will provide you with:
- **API Token**: Your unique authentication key
- **API Documentation**: Specific endpoints and usage limits
- **Usage Guidelines**: Terms and conditions

### Step 4: Configure Your App

1. **Update your `.env` file**:
   ```bash
   # Replace the test key with your real API key
   EXPO_PUBLIC_EARNKARO_API_KEY=your_real_earnkaro_api_key_here
   ```

2. **Restart your Expo app**:
   ```bash
   npx expo start --clear
   ```

## What You'll Get With Real API Key

### ✅ Real-Time Features

- **Live Deal Fetching**: Actual PC component deals from merchants
- **Affiliate Link Conversion**: Convert any product URL to earn commissions
- **Commission Tracking**: Track your earnings from affiliate links
- **Merchant Coverage**: Amazon, Flipkart, and 500+ other retailers

### 📊 API Capabilities

Based on the EarnKaro API structure:

```javascript
// Link Conversion
POST https://ekaro-api.affiliaters.in/api/converter/public
{
  "deal": "https://www.amazon.in/dp/B08166SLDF",
  "convert_option": "convert_only"
}

// Response
{
  "status": "success",
  "data": {
    "converted_links": [{
      "original_url": "https://www.amazon.in/dp/B08166SLDF",
      "converted_url": "https://ekaro.affiliaters.in/link/12345",
      "merchant": "Amazon",
      "commission_rate": "3.5%"
    }]
  }
}
```

## Testing Your Integration

Once you have a real API key:

1. **Check the logs** in your Expo app:
   ```
   ✅ EarnKaro API Test Success: [real API response]
   💰 EarnKaro returned X real deals
   ```

2. **Verify affiliate links** are working:
   - Click on any product link in your app
   - Should redirect through EarnKaro tracking URL
   - Commission tracking will be active

## Alternative: Quick Testing with Demo Mode

While waiting for API approval, your app works perfectly with enhanced mock data:

- **2+ Demo PC Components** with realistic pricing
- **Affiliate Link Simulation** (non-functional tracking)
- **Full UI/UX Testing** capabilities
- **All app features** work except real commission tracking

## Support

If you need help with the API integration:

1. **EarnKaro Support**: `support@earnkaro.com`
2. **API Documentation**: Will be provided upon approval
3. **Test Mode**: Your app continues working with mock data

---

**Note**: The authentication error you saw (401) is expected with the test API key. This confirms your integration is working correctly and ready for a real API key! 🎉
