# GitHub Secrets Configuration

This document explains how to configure GitHub repository secrets for the MyPC app CI/CD pipeline.

## Required Secrets

### Expo Configuration

1. **EXPO_TOKEN**
   - Go to [Expo Access Tokens](https://expo.dev/accounts/[username]/settings/access-tokens)
   - Create a new token with appropriate permissions
   - Copy the token and add it as a GitHub secret

### Apple App Store (iOS)

2. **APPLE_ID**
   - Your Apple ID email address
   - Example: `your-email@example.com`

3. **APPLE_APP_SPECIFIC_PASSWORD**
   - Generate at [Apple ID Account Page](https://appleid.apple.com/account/manage)
   - Go to "App-Specific Passwords" section
   - Create a new password for "MyPC CI/CD"

4. **APPLE_TEAM_ID**
   - Found in [Apple Developer Account](https://developer.apple.com/account/)
   - Under "Membership" tab
   - Example: `A1B2C3D4E5`

### Google Play Store (Android)

5. **GOOGLE_SERVICE_ACCOUNT_KEY**
   - Create service account in Google Cloud Console
   - Enable Google Play Developer API
   - Create and download JSON key file
   - Copy the entire JSON content as the secret value

## Setting Up GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact names listed above

## Environment Setup

### Local Development

Create a `.env.local` file (not committed):
```bash
EXPO_TOKEN=your_expo_token_here
NODE_ENV=development
```

### Production Environment

The CI/CD pipeline will automatically use:
- `NODE_ENV=production` for production builds
- `NODE_ENV=staging` for preview builds
- `NODE_ENV=development` for development builds

## Security Notes

- Never commit secrets to the repository
- Use environment-specific configurations
- Rotate tokens regularly
- Use least-privilege access for service accounts

## Testing the Setup

1. Push to `develop` branch → Triggers OTA update
2. Create PR → Triggers preview build
3. Push to `main` branch → Triggers production build and store submission

## Troubleshooting

### Expo Token Issues
- Ensure token has correct permissions
- Check token hasn't expired
- Verify project access rights

### Apple Submission Issues
- Verify Apple ID has App Store Connect access
- Check Apple Team ID is correct
- Ensure app-specific password is valid

### Google Play Issues
- Verify service account has correct permissions
- Check JSON key file format
- Ensure Google Play Developer API is enabled

## Next Steps

After configuring secrets:
1. Test the workflow with a PR
2. Monitor build logs for any issues
3. Set up notifications (Slack/Discord)
4. Configure additional environments if needed
