# Understanding Clerk OAuth Integration

## What You're Seeing in Clerk Dashboard

When you look at your Clerk dashboard under **Configure → SSO Connections → Google**, you might see:

1. **Google OAuth is enabled** ✓
2. **Basic scopes** like email, profile are included by default
3. **No obvious place to add Gmail scopes** - This is the confusing part!

## The Reality of Clerk OAuth Scopes

### What Clerk Supports:

1. **Basic OAuth Authentication**: Sign in with Google, get user profile
2. **OAuth Token Access**: Via `getUserOauthAccessToken()` backend method
3. **Default Scopes**: email, profile, openid

### What's NOT Clear in the UI:

Clerk doesn't have a UI field to add custom OAuth scopes like Gmail access. This is a limitation of their current dashboard interface.

## Your Options:

### Option 1: Contact Clerk Support (Recommended)
Ask them to add Gmail scopes to your Google OAuth configuration. They can do this backend configuration for you:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.labels`

### Option 2: Use Clerk's OAuth Token + Google APIs
This is what we've partially implemented:

1. **User signs in with Google via Clerk** ✓
2. **Get OAuth token server-side**:
   ```javascript
   // In a Next.js API route (not in Convex)
   import { clerkClient } from '@clerk/nextjs/server';
   
   const [oauthToken] = await clerkClient.users.getUserOauthAccessToken(
     userId,
     'oauth_google'
   );
   ```
3. **Use token with Gmail API**

### Option 3: Separate Google OAuth Flow
If Clerk can't add Gmail scopes, implement a separate OAuth flow:

1. Keep Clerk for authentication
2. Add a separate "Connect Gmail" flow using Google's OAuth directly
3. Store Gmail tokens in your database (encrypted)

## Current Implementation Status

✅ **What's Working:**
- Gmail settings UI toggle
- Database schema for OAuth tokens
- Basic connection flow
- Test mode without actual OAuth

❌ **What's Missing:**
- Gmail scopes in Clerk's Google OAuth
- API endpoint to retrieve OAuth tokens from Clerk
- Actual Gmail API integration

## Next Steps:

### If Clerk Supports Gmail Scopes:
1. Contact Clerk support to add Gmail scopes
2. Create an API endpoint to get OAuth tokens
3. Complete the Gmail integration

### If Clerk Doesn't Support Gmail Scopes:
1. Implement separate Google OAuth flow
2. Use Google's OAuth2 library directly
3. Store tokens securely in Convex

## Example API Endpoint You Need

Create this in your React Router app:

```typescript
// app/api/get-google-token.ts
import { clerkClient } from '@clerk/react-router/api';

export async function action({ request }: { request: Request }) {
  const { userId } = await request.json();
  
  try {
    const [oauthToken] = await clerkClient.users.getUserOauthAccessToken(
      userId,
      'oauth_google'
    );
    
    return Response.json({ 
      token: oauthToken.token,
      expiresAt: oauthToken.expiresAt 
    });
  } catch (error) {
    return Response.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
```

## The Bottom Line

Clerk's OAuth integration is primarily designed for authentication, not for accessing third-party APIs with extended scopes. While they have the `getUserOauthAccessToken()` method, adding custom scopes like Gmail access isn't straightforward through their UI.

Your best bet is to:
1. **Contact Clerk support** and ask them to add Gmail scopes
2. If they can't, implement a **separate Gmail OAuth flow**
3. For now, the **test mode** lets you develop the UI and flow