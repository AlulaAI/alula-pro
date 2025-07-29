# Gmail OAuth Setup with Clerk

This document explains how to complete the Gmail integration by configuring OAuth scopes in Clerk.

## Current Status

The Gmail integration UI is now implemented with:
- Settings page with Gmail connection toggle
- Database schema for storing OAuth tokens
- Convex functions for Gmail operations
- Placeholder for actual Gmail API calls

## Next Steps to Complete Integration

### 1. Configure Clerk OAuth Scopes

In your Clerk Dashboard:

1. Navigate to **Configure** → **SSO Connections** → **Google**
2. Under **OAuth Scopes**, add the following Gmail scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.labels
   ```

3. Save the changes

### 2. Enable Gmail API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Search for "Gmail API" and enable it
5. Configure OAuth consent screen if needed

### 3. Set Environment Variables in Convex

Add these to your Convex environment variables:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
```

### 4. Implement OAuth Token Retrieval

The missing piece is retrieving OAuth tokens from Clerk. This requires:

1. **Backend API Route**: Create an API endpoint that can:
   - Call Clerk's backend API to get OAuth tokens
   - Return them securely to your Convex action

2. **Update gmailActions.ts**: Modify the `getGmailClient` function to:
   - Fetch OAuth tokens from your backend API
   - Use them to authenticate with Gmail

Example implementation pattern:

```typescript
// In your backend API (e.g., Next.js API route)
import { clerkClient } from '@clerk/nextjs/server';

export async function getGoogleTokens(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  const googleAccount = user.externalAccounts.find(
    account => account.provider === 'oauth_google'
  );
  
  // Get OAuth tokens - exact method depends on Clerk version
  // You may need to use Clerk's OAuth token endpoint
  const tokens = await clerkClient.users.getOAuthAccessToken(
    userId,
    'oauth_google'
  );
  
  return tokens;
}
```

### 5. Complete Gmail Sync Implementation

Once OAuth tokens are available:

1. Update `fetchEmails` in `gmailActions.ts` to:
   - Get OAuth tokens
   - Create authenticated Gmail client
   - Fetch actual emails
   - Process and store them

2. Implement `setupGmailWatch` for real-time updates:
   - Set up Gmail push notifications
   - Store watch expiration
   - Handle renewal

3. Create webhook handler for Gmail notifications:
   - Process incoming notifications
   - Fetch new emails
   - Update database

## Security Considerations

1. **Token Storage**: OAuth tokens should be encrypted at rest
2. **Token Refresh**: Implement automatic token refresh logic
3. **Scope Limitations**: Only request necessary Gmail scopes
4. **User Consent**: Ensure clear user consent for email access

## Testing

1. Connect Gmail account in Settings
2. Click "Sync Now" to test email fetching
3. Check browser console for any errors
4. Verify emails appear in dashboard

## Troubleshooting

Common issues:

1. **"Insufficient scopes"**: Add required scopes in Clerk dashboard
2. **"Invalid credentials"**: Check environment variables
3. **"API not enabled"**: Enable Gmail API in Google Cloud Console
4. **Token expiration**: Implement refresh token logic

## Alternative Approach

If Clerk OAuth token access is limited, consider:

1. Direct Google OAuth flow separate from Clerk
2. Store tokens securely in Convex
3. Use service account for server-side access
4. Implement custom OAuth flow with PKCE

The current implementation provides the foundation - completing the OAuth token retrieval is the final step to enable full Gmail functionality.