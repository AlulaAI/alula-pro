# Complete Gmail OAuth Setup Guide

This guide walks through the complete setup process for Gmail integration with Clerk and Google Cloud Console.

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Gmail API
1. Navigate to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on Gmail API and press **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required fields:
   - App name: "Alula Pro"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - Click **Add or Remove Scopes**
   - Add these Gmail scopes:
     ```
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/gmail.modify
     https://www.googleapis.com/auth/gmail.labels
     ```
   - Optional: Add `https://www.googleapis.com/auth/gmail.send` if you plan to send emails
5. Add test users (your email) if in testing mode
6. Save and continue

### 1.4 Get OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Your OAuth 2.0 Client ID should already exist (created by Clerk)
3. Note the Client ID and Client Secret if you need them

## Step 2: Clerk Dashboard Configuration

### 2.1 Update Google OAuth Settings
1. Log in to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Configure** → **SSO Connections** → **Google**
3. Make sure Google OAuth is enabled

### 2.2 Add Gmail Scopes
1. In the Google OAuth settings, find **Scopes** or **OAuth Scopes**
2. Add these scopes (in addition to default ones):
   ```
   gmail.readonly
   gmail.modify
   gmail.labels
   ```
   Or the full URLs:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.labels
   ```
3. Save the configuration

### 2.3 Force Re-authentication (Important!)
Since you've already signed in before adding these scopes, you need to:
1. Sign out of your Alula Pro app
2. Sign back in using "Continue with Google"
3. You should see a new consent screen asking for Gmail permissions
4. Accept the permissions

## Step 3: Convex Environment Variables

Add these to your Convex dashboard environment variables:

```bash
# These might not be needed if using Clerk's OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-app-url/api/auth/callback/google
```

## Step 4: Test the Integration

1. **Sign out** of Alula Pro completely
2. **Sign in** using "Continue with Google" button
3. **Accept** the Gmail permissions when prompted
4. Go to **Settings** → **Integrations**
5. Toggle on **Gmail Integration**
6. You should see "Connected to: your-email@gmail.com"
7. Click **Sync Now** to test

## Step 5: Implement OAuth Token Retrieval

To complete the integration, you need to retrieve OAuth tokens from Clerk. Here are two approaches:

### Option A: Using Clerk's Backend API (Recommended)

Create an API endpoint in your app:

```typescript
// app/api/gmail-token/route.ts
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's OAuth access token
    const response = await clerkClient.users.getUserOauthAccessToken(
      userId,
      'oauth_google'
    );

    return Response.json({ 
      accessToken: response.token,
      // Note: Clerk may handle refresh tokens internally
    });
  } catch (error) {
    return Response.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
```

### Option B: Using Clerk Frontend Hooks

```typescript
// In your React component
import { useAuth } from '@clerk/react-router';

const { getToken } = useAuth();

// Get Google OAuth token
const token = await getToken({ 
  template: 'oauth_google' 
});
```

## Troubleshooting

### "Insufficient scopes" error
- Make sure you added all required scopes in Clerk
- Sign out and sign back in with Google
- Check that you accepted Gmail permissions

### "Gmail API not enabled"
- Go to Google Cloud Console
- Enable Gmail API for your project
- Wait a few minutes for it to propagate

### Toggle not working
- Check browser console for errors
- Ensure you're signed in with Google OAuth
- Try the test mode first (without Google OAuth)

### No emails showing up
- OAuth token retrieval needs to be implemented
- Check Convex logs for any errors
- Verify Gmail API is enabled

## Security Best Practices

1. **Minimal Scopes**: Only request scopes you actually need
2. **Token Storage**: Never store tokens in frontend code
3. **Refresh Tokens**: Implement automatic token refresh
4. **User Consent**: Clearly explain why you need email access
5. **Data Handling**: Only store necessary email data

## Next Development Steps

1. Implement OAuth token retrieval endpoint
2. Update `gmailActions.ts` to use real tokens
3. Implement email fetching with Gmail API
4. Set up Gmail push notifications for real-time updates
5. Add email classification with OpenAI
6. Create email-to-client matching logic

The foundation is ready - you just need to connect the OAuth tokens from Clerk to the Gmail API calls!