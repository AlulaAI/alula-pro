# Google OAuth Direct Integration Setup

This guide explains how to set up direct Google OAuth for Gmail integration.

## Prerequisites

1. A Google Cloud Console project
2. Gmail API enabled
3. OAuth consent screen configured

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Choose **Web application**
5. Configure:
   - Name: "Alula Pro Gmail Integration"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production URL
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (for development)
     - `https://your-app.com/auth/google/callback` (for production)
6. Save and copy the Client ID and Client Secret

### 1.2 Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Fill in required fields
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/userinfo.email`
4. Add test users if in development

## Step 2: Environment Variables

### 2.1 Local Development (.env.local)

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
VITE_APP_URL=http://localhost:5173
```

### 2.2 Convex Environment Variables

In your Convex dashboard, add:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

For production, update the redirect URI accordingly.

## Step 3: Implementation Overview

### OAuth Flow

1. User clicks "Connect Gmail" in settings
2. App redirects to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to `/auth/google/callback`
5. App exchanges code for tokens
6. Tokens are stored in Convex database
7. Gmail sync can now access user's emails

### Key Files

- `/app/lib/google-oauth.ts` - OAuth helper functions
- `/app/routes/auth/google/callback.tsx` - OAuth callback handler
- `/convex/gmail.ts` - Database operations
- `/convex/gmailActions.ts` - Gmail API operations

## Step 4: Testing

1. Start your dev server: `npm run dev`
2. Go to Settings → Integrations
3. Click the Gmail toggle to "Connect"
4. You'll be redirected to Google
5. Grant permissions
6. You'll be redirected back to settings
7. Gmail should show as connected
8. Click "Sync Now" to test email fetching

## Step 5: Production Deployment

1. Update environment variables with production values
2. Update OAuth redirect URIs in Google Cloud Console
3. Ensure HTTPS is enabled (required for OAuth)
4. Consider implementing token refresh (currently not implemented)

## Security Considerations

1. **Client Secret**: Never expose the client secret in frontend code
2. **State Parameter**: Always use state parameter for CSRF protection
3. **Token Storage**: Tokens are stored encrypted in Convex
4. **Refresh Tokens**: Implement refresh logic for long-term access
5. **Scopes**: Only request necessary scopes

## Troubleshooting

### "Invalid redirect URI"
- Check that redirect URI in Google Console matches exactly
- Include protocol (http/https) and trailing slashes

### "Access blocked: Authorization Error"
- Ensure OAuth consent screen is configured
- Add test users if app is in testing mode

### "Failed to exchange code for tokens"
- Check client ID and secret
- Ensure environment variables are set correctly

### Tokens expire after 1 hour
- Implement refresh token logic
- Currently, users need to reconnect after expiration

## Next Steps

1. Implement token refresh logic
2. Add email classification with AI
3. Set up Gmail push notifications
4. Add email filtering options
5. Implement batch processing for efficiency