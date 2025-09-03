# MyPC App - CI/CD Setup

This document outlines the complete CI/CD pipeline for the MyPC React Native app using Expo and GitHub Actions.

## 🚀 Pipeline Overview

Our CI/CD pipeline supports:
- **Automated builds** for iOS and Android
- **Preview builds** for pull requests
- **Production builds** for releases
- **OTA updates** for quick fixes
- **Store submissions** to Apple App Store and Google Play

## 📋 Prerequisites

1. **Expo Account**: [Sign up at expo.dev](https://expo.dev)
2. **EAS CLI**: `npm install -g @expo/eas-cli`
3. **GitHub Repository**: With Actions enabled
4. **Apple Developer Account**: For iOS builds (optional)
5. **Google Play Developer Account**: For Android builds (optional)

## 🔧 Initial Setup

### 1. Configure Expo Project

```bash
# Login to Expo
npx eas login

# Configure the project
npx eas build:configure

# Generate credentials
npx eas credentials
```

### 2. Set Up GitHub Secrets

Follow the [GitHub Secrets Setup Guide](.github/SETUP_SECRETS.md) to configure required tokens and keys.

### 3. Test Local Build

```bash
# Preview build
npx eas build --profile preview --platform all

# Production build
npx eas build --profile production --platform all
```

## 🏗️ Build Profiles

### Development Profile
- **Purpose**: Local development and debugging
- **Features**: Development client, simulator builds
- **Trigger**: Manual only

### Preview Profile  
- **Purpose**: Testing and QA
- **Features**: Internal distribution, staging environment
- **Trigger**: Pull requests to `main`

### Production Profile
- **Purpose**: App store releases
- **Features**: Store-ready builds, production environment  
- **Trigger**: Push to `main` branch

## 🚦 Workflow Triggers

| Branch/Event | Action | Build Profile | Distribution |
|--------------|--------|---------------|-------------|
| PR to `main` | Preview Build | `preview` | Internal |
| Push to `main` | Production Build | `production` | Store Submission |
| Push to `develop` | OTA Update | - | Existing Apps |

## 📱 Build Variants

### iOS Builds
- **Preview**: `.ipa` with staging bundle ID
- **Production**: `.ipa` ready for App Store submission
- **Requirements**: Apple Developer account, certificates

### Android Builds  
- **Preview**: `.apk` with staging application ID
- **Production**: `.aab` (Android App Bundle) for Google Play
- **Requirements**: Keystore, Google Play service account

## 🔄 Over-The-Air (OTA) Updates

OTA updates allow you to push JavaScript/TypeScript changes without going through app stores:

```bash
# Manual OTA update
npx eas update --branch preview --message "Bug fixes and improvements"

# Automatic OTA (triggered by push to develop)
git push origin develop
```

### OTA Limitations
- Cannot update native code
- Cannot change app permissions  
- Cannot update SDK version

## 🏪 Store Submission

### Automatic Submission
Production builds are automatically submitted to both stores when pushed to `main`.

### Manual Submission
```bash
# Submit to Google Play
npx eas submit --platform android --latest

# Submit to Apple App Store  
npx eas submit --platform ios --latest
```

## 📊 Monitoring & Debugging

### Build Status
- Check GitHub Actions tab for build progress
- View detailed logs in Expo dashboard
- Monitor build queue and estimated times

### Common Issues
1. **Certificate Issues**: Check Apple Developer account
2. **Keystore Problems**: Verify Android signing configuration
3. **Timeout Errors**: Consider upgrading build resources
4. **Dependency Conflicts**: Update package versions

### Debugging Commands
```bash
# Check project configuration
npx expo doctor

# Validate EAS configuration
npx eas build:configure --check

# View build logs
npx eas build:list --limit 10
```

## 🚀 Deployment Environments

### Staging (Preview)
- **URL**: Internal distribution links
- **Purpose**: QA testing, client reviews
- **Data**: Staging API endpoints

### Production
- **URL**: App Store and Google Play
- **Purpose**: End users
- **Data**: Production API endpoints

## 📈 Performance Optimization

### Build Speed
- Use appropriate resource classes in `eas.json`
- Enable caching for dependencies
- Optimize asset sizes

### Bundle Size
```bash
# Analyze bundle size
npx expo export --dump-sourcemap
npx expo-optimize

# Tree shaking optimization
npx eas build --profile production --clear-cache
```

## 🔒 Security Best Practices

1. **Never commit secrets** to repository
2. **Use environment variables** for API keys
3. **Rotate credentials** regularly
4. **Enable branch protection** for main branch
5. **Review dependencies** for vulnerabilities

## 🆘 Troubleshooting

### Build Failures
1. Check GitHub Actions logs
2. Verify EAS configuration
3. Test locally with same profile
4. Check Expo status page

### Store Rejections
1. Review store guidelines
2. Check app metadata
3. Verify permissions usage
4. Test on physical devices

### OTA Update Issues
1. Verify branch configuration
2. Check compatibility versions
3. Test update rollout

## 📞 Support

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build Docs**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)
- **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/en/actions)

## 🔄 Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Rotate credentials quarterly  
- [ ] Review build performance
- [ ] Monitor store compliance
- [ ] Update documentation

### Version Management
```bash
# Update app version
npx expo version

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

---

## Quick Commands Reference

```bash
# Development
npm start                          # Start Expo dev server
npm run type-check                # TypeScript validation

# Building  
npx eas build --profile preview    # Preview build
npx eas build --profile production # Production build

# Deployment
npx eas submit --latest            # Submit to stores
npx eas update --branch preview    # OTA update

# Monitoring
npx eas build:list                 # View build history
npx expo doctor                    # Health check
```
