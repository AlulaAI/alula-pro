# External Services Setup Guide

This guide covers all external configurations required outside of the codebase for Clerk, Convex, and Polar integration.

## Prerequisites
- Clerk account (clerk.com)
- Convex account (convex.dev)
- Polar account (sandbox.polar.sh for testing)
- OpenAI API key
- ngrok installed (for local development)

## 1. Clerk Setup

### Create Application
1. Go to clerk.com and create new application
2. Name: "Your App Name"
3. Authentication methods: Email + Google (or your preference)

### Configure JWT Template ⚠️ CRITICAL
1. Navigate to: Configure → JWT Templates
2. Click "New Template"
3. Select "Convex" as template type
4. Name: "convex" (must match exactly)
5. **Click Save** (don't forget this step!)
6. Copy the "Issuer" URL for later use

### Get API Keys
1. Navigate to: Configure → API Keys
2. Select "React Router" framework
3. Copy both keys:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## 2. Convex Setup

### Initialize Project
```bash
npx convex dev
```
This creates a new project and adds keys to .env.local automatically.

### Configure Environment Variables
Go to Convex Dashboard → Your Project → Settings → Environment Variables

Add the following:

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_CLERK_FRONTEND_API_URL` | Issuer URL from Clerk JWT template | Clerk JWT Template |
| `FRONTEND_URL` | Your app URL (ngrok for local) | See ngrok setup below |
| `POLAR_ACCESS_TOKEN` | Access token | Polar Settings → Developers |
| `POLAR_ORGANIZATION_ID` | Organization ID | Polar Settings → General |
| `POLAR_WEBHOOK_SECRET` | Webhook secret | Generated when creating webhook |
| `OPENAI_API_KEY` | Your OpenAI key | OpenAI Dashboard |

### Get HTTP Actions URL
1. In Convex Dashboard → Settings → URL & Deploy Key
2. Click "Show development credentials"
3. Copy the "HTTP actions URL" for Polar webhook setup

## 3. Polar Setup (sandbox.polar.sh)

### Create Organization
1. Go to sandbox.polar.sh (test environment)
2. Create new organization
3. Note the Organization ID from Settings → General

### Create Access Token
1. Navigate to: Settings → Developers
2. Click "New Token"
3. Select all permissions
4. Set no expiration (for development)
5. Copy the token immediately

### Configure Webhook ⚠️ CRITICAL
1. Go to Settings → Webhooks
2. Click "Add endpoint"
3. URL: `{CONVEX_HTTP_ACTIONS_URL}/payments/webhook`
4. Format: Raw
5. Click "Generate new secret"
6. Copy the secret
7. Select all event types
8. **Click "Create"** (don't forget this step!)

## 4. Local Development with ngrok

### Expose localhost
```bash
ngrok http 5173
```

### Configure Vite
In `vite.config.js`, add ngrok URL to allowed hosts:
```javascript
export default defineConfig({
  server: {
    allowedHosts: ["your-ngrok-url.ngrok-free.app"]
  }
});
```

### Update Convex Environment
Update `FRONTEND_URL` in Convex dashboard with ngrok URL (remove trailing slash)

## 5. Verification Checklist

- [ ] Clerk JWT template created and saved
- [ ] All Convex environment variables set
- [ ] Polar webhook created (not just configured)
- [ ] ngrok URL in Vite config (for local dev)
- [ ] Test user can sign up
- [ ] Test subscription flow works
- [ ] Webhook receives events (check Convex logs)

## Common Issues

### "No address provided to Convex React client"
- Missing Convex environment variables in .env.local

### "Cannot find public function for subscriptions"
- Polar environment variables not set in Convex dashboard

### "Input should be valid URL"
- FRONTEND_URL not set or has trailing slash

### Webhook not firing
- Forgot to click "Create" after configuring webhook
- Wrong webhook URL format
- Missing webhook secret in Convex

### Blocked request with ngrok
- Add ngrok URL to vite.config.js allowedHosts

## Production Deployment

1. Switch from sandbox.polar.sh to www.polar.sh
2. Update FRONTEND_URL to production domain
3. Remove ngrok from Vite config
4. Update all API keys to production versions