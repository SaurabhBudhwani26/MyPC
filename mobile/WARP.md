# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the **mobile application** component of the My PC App - a comprehensive PC parts price comparison platform. The mobile app is built with React Native using Expo and is part of a monorepo structure alongside web and shared packages.

**Key Purpose**: Mobile app for comparing PC component prices across Indian retailers (Amazon, Flipkart) with compatibility checking and build recommendations.

## Development Commands

### Core Development
```bash
# Start mobile development server
npm start
# or
expo start

# Start with specific platforms
npm run android      # Android emulator/device
npm run ios         # iOS simulator/device
npm run web         # Web browser

# Start with cache cleared
expo start --clear

# Install new Expo-compatible packages
npx expo install <package-name>
```

### Monorepo Commands (from project root)
```bash
# Start all development services (web, mobile, shared)
npm run dev

# Start only mobile
npm run dev:mobile

# Build shared package (required when shared types change)
npm run build:shared

# Type checking across project
npm run type-check

# Install all dependencies for all packages
npm run install:all
```

### Build and Production
```bash
# Build for production
expo build:android
expo build:ios

# Build with EAS (Expo Application Services)
eas build --platform android
eas build --platform ios
eas build --platform all
```

## Architecture and Structure

### Technology Stack
- **React Native** with Expo SDK ~53.0
- **TypeScript** for type safety
- **React Query** (@tanstack/react-query) for server state management
- **Zustand** for client state management
- **Axios** for HTTP requests
- **Expo Router** for navigation (intended)
- **NativeWind** for styling (Tailwind CSS for React Native, intended)

### Project Structure Context
```
my-pc-app/
├── mobile/           # THIS REPOSITORY (React Native/Expo)
├── web/             # Next.js web application
├── shared/          # Shared TypeScript types and utilities
└── package.json     # Monorepo root with workspaces
```

### Key Dependencies
- `@tanstack/react-query`: Server state management and caching
- `axios`: HTTP client for API calls
- `zustand`: Lightweight state management
- `expo`: Core Expo SDK and tools

### Shared Package Integration
The mobile app uses shared types and utilities from `@my-pc-app/shared`:

```typescript
// Import shared types (when implemented)
import { Part, Offer, PCBuild } from '@my-pc-app/shared';
```

**Important**: When shared types change, rebuild the shared package:
```bash
cd ../shared && npm run build
```

## Development Workflow

### When Working on Features
1. **Check shared package**: See if types/utilities exist in `../shared/src/`
2. **Add missing shared code**: Define new types in shared package first
3. **Rebuild shared**: Run `npm run build:shared` from project root
4. **Implement in mobile**: Use shared types in mobile-specific components
5. **Test across platforms**: Use Expo Go app for device testing

### State Management Pattern
- **React Query**: Server state (API calls, caching, background sync)
- **Zustand**: Client state (UI state, user preferences, temporary data)

### Styling Approach
Currently using StyleSheet. The project plans to migrate to:
- **NativeWind**: Tailwind CSS classes for React Native
- **Expo components**: Native UI components

### Environment Setup
Create `.env.local` in mobile directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
AMAZON_AFFILIATE_TAG=your-tag
FLIPKART_AFFILIATE_ID=your-affiliate-id
```

## Core Features (In Development)

### Primary Features
- **Part Search & Comparison**: Search PC components across multiple Indian retailers
- **Real-time Pricing**: Live price updates from Amazon, Flipkart
- **Build Compatibility**: Component compatibility checking engine
- **Price Alerts**: Notifications when component prices drop
- **Build Templates**: Pre-configured PC builds for different use cases

### Architecture Components
- **Search Engine**: Component search with filters and sorting
- **Price Aggregator**: Multi-store price comparison
- **Compatibility Engine**: CPU↔Motherboard, RAM↔Motherboard, GPU↔Case validation
- **Affiliate Integration**: Revenue through affiliate commissions

## API Integration (Planned)

### Expected API Endpoints
```
GET /api/search?q=ryzen+7600           # Search parts
GET /api/parts/{id}                    # Get part details
GET /api/parts/{id}/offers             # Get part offers
POST /api/builds/price                 # Calculate build price
GET /api/deals/today                   # Today's best deals
```

### Affiliate APIs
- **Amazon Product Advertising API (PA-API 5.0)**
- **Flipkart Affiliate API**
- **Additional affiliate networks** (Cuelinks, EarnKaro)

## Testing and Debugging

### Device Testing
```bash
# Install Expo Go on phone
# Scan QR code from terminal
expo start

# Use iOS simulator
expo start --ios

# Use Android emulator
expo start --android
```

### Common Issues
```bash
# Clear Expo cache
expo start --clear

# Reset Metro bundler
expo start --reset-cache

# Check TypeScript errors
npm run type-check
```

## Development Status

### Current Implementation
- [x] Basic Expo setup with TypeScript
- [x] React Query and Zustand integration
- [x] Basic UI structure with feature cards
- [x] Monorepo workspace configuration

### Next Development Steps
1. **Backend API Setup**: FastAPI/NestJS with PostgreSQL
2. **Amazon PA-API Integration**: Product search and pricing
3. **Flipkart API Integration**: Alternative pricing source
4. **Navigation Setup**: Expo Router implementation
5. **Search Interface**: Component search and filtering
6. **Compatibility Engine**: Component compatibility validation
7. **Price Comparison**: Multi-store price display
8. **Build Composer**: PC build creation and validation

## Key Considerations

### Performance
- Use React Query for aggressive caching of price data
- Implement virtual lists for large component catalogs
- Background sync for price updates

### Affiliate Revenue
- Generate affiliate links for component purchases
- Track conversion rates and commission earnings
- Maintain compliance with affiliate program terms

### User Experience
- Fast search with debounced input
- Offline support for saved builds
- Push notifications for price alerts
- Compatibility warnings during build creation
