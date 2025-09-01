# My PC App - PC Parts Price Comparison Platform

A comprehensive PC parts price comparison platform with both web and mobile applications, featuring real-time pricing from Amazon, Flipkart, and other Indian retailers.

## Project Structure

```
my-pc-app/
├── web/                    # Next.js web application
├── mobile/                 # React Native mobile app (Expo)
├── shared/                 # Shared TypeScript packages
└── README.md              # This file
```

## Features

### Core Features
- 🔍 **Part Search & Comparison** - Search and compare PC components across multiple stores
- 💰 **Real-time Pricing** - Live price updates from Amazon, Flipkart, and other retailers
- 🧩 **Build Compatibility** - Check component compatibility and get warnings
- 📱 **Cross-platform** - Available on web, iOS, and Android
- 🎯 **Price Alerts** - Get notified when prices drop
- 📊 **Price History** - Track price trends over time

### Advanced Features
- 🤖 **Smart Recommendations** - AI-powered part suggestions based on budget and use case
- 🏷️ **Deal Detection** - Automatic detection of special offers and discounts
- 🔧 **Build Templates** - Pre-configured builds for gaming, workstation, budget setups
- 📈 **Price Trend Analysis** - Historical pricing data and predictions
- 🛒 **Multi-store Baskets** - Compare total costs across different store combinations

## Technology Stack

### Frontend (Web)
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for server state management
- **Zustand** for client state management
- **React Hook Form** with Zod validation

### Frontend (Mobile)
- **React Native** with Expo
- **Expo Router** for navigation
- **NativeWind** for styling (Tailwind CSS for React Native)
- **React Query** for server state management
- **Zustand** for client state management

### Shared
- **TypeScript** for type safety
- **Axios** for HTTP requests
- Shared types and utilities

### Backend (To be implemented)
- **FastAPI** or **Node.js/NestJS**
- **PostgreSQL** for data storage
- **Redis** for caching
- **Amazon PA-API** integration
- **Flipkart Affiliate API** integration

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- For mobile development: Expo CLI or EAS CLI

### Installation

1. **Clone and install dependencies:**
```bash
cd my-pc-app

# Install shared package dependencies
cd shared && npm install && cd ..

# Install web dependencies
cd web && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..
```

2. **Environment Setup:**
Create `.env.local` files in both `web/` and `mobile/` directories:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Amazon Affiliate
AMAZON_AFFILIATE_TAG=your-tag
AMAZON_PA_API_ACCESS_KEY=your-access-key
AMAZON_PA_API_SECRET_KEY=your-secret-key

# Flipkart Affiliate
FLIPKART_AFFILIATE_ID=your-affiliate-id
FLIPKART_AFFILIATE_TOKEN=your-token
```

### Development

#### Web Application
```bash
cd web
npm run dev
```
Visit http://localhost:3000

#### Mobile Application
```bash
cd mobile
npx expo start
```
Use Expo Go app or iOS/Android simulators

#### Shared Package (Development)
```bash
cd shared
npm run dev
```

## API Endpoints (Planned)

```
GET /api/search?q=ryzen+7600           # Search parts
GET /api/parts/{id}                    # Get part details
GET /api/parts/{id}/offers             # Get part offers
POST /api/builds/price                 # Calculate build price
GET /api/deals/today                   # Today's best deals
GET /api/parts/{id}/price-history      # Price history
```

## Affiliate Integration

### Supported Stores
- **Amazon India** (via PA-API)
- **Flipkart** (via Affiliate API)
- **Other stores** (via affiliate networks like Cuelinks, EarnKaro)

### Revenue Model
- Affiliate commissions from partner stores
- Premium features for power users
- API access for third-party developers

## Compatibility Engine

The app includes a sophisticated compatibility checking system:

### CPU ↔ Motherboard
- Socket matching (AM5, LGA1700, etc.)
- Chipset compatibility
- Power delivery validation

### RAM ↔ Motherboard
- DDR generation matching
- Speed compatibility
- Capacity limits

### GPU ↔ Case
- Physical clearance checking
- PCIe slot requirements
- Power connector validation

### PSU Calculation
- TDP sum × 1.5 safety margin
- Connector requirements
- Efficiency ratings

## Development Roadmap

### Week 1
- [x] Project initialization
- [x] Shared types and utilities
- [ ] Backend API setup
- [ ] Amazon PA-API integration
- [ ] Basic search functionality

### Week 2
- [ ] Flipkart API integration
- [ ] Price comparison features
- [ ] Basic compatibility engine
- [ ] Mobile app navigation

### Week 3
- [ ] Build composer
- [ ] Affiliate link integration
- [ ] Price alerts system
- [ ] Advanced compatibility rules

### Week 4
- [ ] Deal detection
- [ ] Price history tracking
- [ ] User preferences
- [ ] Performance optimization

## Contributing

1. Follow TypeScript strict mode
2. Use the shared types from `@my-pc-app/shared`
3. Maintain consistency between web and mobile UX
4. Test affiliate links before deployment
5. Respect API rate limits

## License

MIT License - See LICENSE file for details

## Support

For questions about setup or development, please create an issue in the repository.
