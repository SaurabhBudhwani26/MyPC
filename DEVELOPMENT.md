# Development Guide

## Quick Start Commands

### Start all services for development:
```bash
npm run dev
```

### Start individual services:
```bash
# Web app only (Next.js)
npm run dev:web

# Mobile app only (Expo)
npm run dev:mobile

# Shared package watcher
npm run dev:shared
```

## Project URLs

- **Web App**: http://localhost:3000
- **Mobile App**: Use Expo Go app to scan QR code
- **Expo DevTools**: http://localhost:19002

## First Steps After Setup

1. **Set up environment variables:**
   ```bash
   cp web/.env.example web/.env.local
   cp mobile/.env.example mobile/.env.local
   ```

2. **Get affiliate API keys:**
   - Amazon Associates: https://affiliate-program.amazon.in/
   - Amazon PA-API: https://webservices.amazon.in/paapi5/documentation/
   - Flipkart Affiliate: https://affiliate.flipkart.com/

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Adding New Features

1. **Define types first** in `shared/src/types/index.ts`
2. **Add utilities** in `shared/src/utils/index.ts` if needed
3. **Build shared package**: `cd shared && npm run build`
4. **Implement in web** (`web/src/`) and mobile (`mobile/src/`)
5. **Test on both platforms**

### Working with the Shared Package

The shared package contains:
- Common TypeScript types
- Utility functions
- API configurations
- Constants

To use shared types in web or mobile:
```typescript
import { Part, Offer, PCBuild } from '@my-pc-app/shared';
```

### Mobile Development Tips

1. **Install Expo Go** on your phone from App Store/Play Store
2. **Start dev server**: `npm run dev:mobile`
3. **Scan QR code** with Expo Go to test on device
4. **Use simulators** for iOS (Xcode) or Android (Android Studio)

### Web Development Tips

1. **Hot reload** is enabled by default
2. **TypeScript checking** happens automatically
3. **Tailwind CSS** is configured with hot reload
4. **Use Radix UI** components for accessibility

## Testing

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build Verification
```bash
npm run build
```

## Common Tasks

### Adding New Dependencies

**For web:**
```bash
cd web && npm install [package-name]
```

**For mobile:**
```bash
cd mobile && npx expo install [package-name]
```

**For shared:**
```bash
cd shared && npm install [package-name]
```

### Updating Shared Package

When you make changes to the shared package:
```bash
cd shared && npm run build
```

### Clean Build Artifacts
```bash
npm run clean
```

## Architecture Overview

### Data Flow
1. **User searches** for PC parts
2. **API calls** Amazon PA-API + Flipkart API
3. **Price aggregation** and comparison
4. **Compatibility checking** using rules engine
5. **Affiliate link generation** for purchases

### State Management
- **React Query**: Server state, caching, background updates
- **Zustand**: Client-side state (user preferences, UI state)

### Styling
- **Web**: Tailwind CSS + Radix UI
- **Mobile**: NativeWind (Tailwind for RN) + Expo components

## Next Steps

1. **Set up backend API** (FastAPI/NestJS)
2. **Integrate Amazon PA-API**
3. **Integrate Flipkart Affiliate API**
4. **Implement search functionality**
5. **Add price comparison features**
6. **Build compatibility engine**
7. **Add affiliate link tracking**

## Troubleshooting

### Common Issues

**Metro bundler issues (React Native):**
```bash
cd mobile && npx expo start --clear
```

**TypeScript errors:**
```bash
npm run type-check
```

**Build issues:**
```bash
npm run clean && npm run build
```

**Package resolution issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```
