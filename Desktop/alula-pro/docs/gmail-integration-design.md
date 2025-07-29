# Gmail Integration Design Document

## Overview
Integrate Gmail to automatically process incoming emails, classify them as business-related or personal, analyze urgency, and display in the Alula Pro dashboard.

## Key Design Principles
1. **Leverage Existing Infrastructure**: Use Clerk's Google OAuth to minimize new auth flows
2. **Real-time Processing**: Use Gmail Push Notifications via Pub/Sub for instant updates
3. **Intelligent Classification**: AI-powered email categorization and urgency detection
4. **Seamless Integration**: Emails appear as communications in existing dashboard

## Architecture Components

### 1. Authentication Flow
```typescript
// Extend Clerk's Google OAuth scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.labels'
];
```

**Benefits of using Clerk's existing OAuth:**
- No separate Google auth flow needed
- Single sign-on experience
- Token management handled by Clerk
- Automatic token refresh

### 2. Email Processing Pipeline

#### A. Email Ingestion Methods
1. **Push Notifications (Primary)**
   - Gmail Pub/Sub webhooks for real-time updates
   - Convex HTTP endpoint to receive notifications
   
2. **Periodic Sync (Fallback)**
   - Scheduled Convex action every 5 minutes
   - Catches any missed push notifications

#### B. Classification System
```typescript
interface EmailClassification {
  isBusinessRelated: boolean;
  confidence: number;
  category: 'client' | 'business' | 'lead' | 'partner' | 'personal';
  urgencyScore: number;
  aiSummary: string;
  suggestedClient?: string; // Match to existing client
}
```

#### C. Processing Flow
1. Receive email notification
2. Fetch email content using Gmail API
3. Extract sender, subject, body
4. Run AI classification:
   - Business relevance detection
   - Client matching (fuzzy match against existing clients)
   - Urgency analysis
5. Create communication record if business-related
6. Generate action items for urgent emails

### 3. Database Schema Updates

```typescript
// Add to existing schema
gmailIntegrations: defineTable({
  userId: v.string(),
  email: v.string(),
  refreshToken: v.string(), // Encrypted
  historyId: v.string(), // Gmail sync marker
  labels: v.array(v.string()), // Gmail labels to watch
  isActive: v.boolean(),
  lastSync: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_email", ["email"]),

emailMappings: defineTable({
  gmailMessageId: v.string(),
  communicationId: v.id("communications"),
  processedAt: v.number(),
})
  .index("by_gmail_id", ["gmailMessageId"]),
```

### 4. Convex Functions

```typescript
// convex/gmail.ts
export const setupGmailWatch = action({
  handler: async (ctx) => {
    // Set up Gmail push notifications
  }
});

export const processGmailWebhook = httpAction({
  handler: async (ctx, request) => {
    // Handle incoming Gmail notifications
  }
});

export const syncGmailMessages = action({
  handler: async (ctx) => {
    // Periodic sync fallback
  }
});

export const classifyEmail = action({
  args: {
    from: v.string(),
    subject: v.string(),
    body: v.string(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // AI classification logic
  }
});
```

### 5. AI Classification Prompts

```typescript
const BUSINESS_CLASSIFICATION_PROMPT = `
Analyze this email and determine:
1. Is this business-related for an elder care consultant?
2. What category: client communication, business operations, new lead, partner?
3. Urgency score (0-100)
4. Brief summary (max 2 sentences)

Consider elder care context:
- Family member updates about clients
- Medical/health communications
- Care facility correspondence
- Insurance/billing matters
- Professional networking

Email:
From: {from}
Subject: {subject}
Body: {body}
`;
```

### 6. UI/UX Components

#### A. Settings Page Addition
```typescript
// Email Integration Settings
- Connect/Disconnect Gmail
- Select labels to monitor
- Email filtering rules
- Test connection
```

#### B. Dashboard Integration
- Emails appear as regular communications
- Special "Email" icon for email-sourced items
- Original email link preserved

### 7. Security Considerations

1. **Token Storage**
   - Store refresh tokens encrypted in Convex
   - Use Convex environment variables for encryption keys

2. **Data Privacy**
   - Only process email metadata by default
   - Full content processing requires explicit consent
   - Allow users to exclude specific senders/domains

3. **Rate Limiting**
   - Implement exponential backoff for API calls
   - Cache processed emails to avoid reprocessing

### 8. Implementation Phases

**Phase 1: Basic Integration (Week 1)**
- Extend Clerk OAuth scopes
- Create Gmail connection UI
- Implement basic email fetching

**Phase 2: AI Classification (Week 2)**
- Build classification system
- Train on eldercare-specific patterns
- Implement urgency detection

**Phase 3: Real-time Updates (Week 3)**
- Set up Gmail Pub/Sub
- Create webhook handlers
- Implement sync mechanisms

**Phase 4: Advanced Features (Week 4)**
- Smart client matching
- Email threading support
- Bulk actions for emails

## Technical Implementation Guide

### Step 1: Update Clerk Configuration
Contact Clerk support or use dashboard to add Gmail OAuth scopes to your Google provider.

### Step 2: Create Gmail Service
```typescript
// convex/services/gmail.ts
import { google } from 'googleapis';

export async function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.gmail({
    version: 'v1',
    auth: oauth2Client
  });
}
```

### Step 3: Webhook Endpoint
```typescript
// convex/http.ts
http.route({
  path: "/webhooks/gmail",
  method: "POST",
  handler: gmailWebhook,
});
```

### Step 4: Email Processor
```typescript
// convex/actions/processEmail.ts
export const processEmail = action({
  args: { messageId: v.string() },
  handler: async (ctx, args) => {
    // 1. Fetch email from Gmail
    // 2. Check if already processed
    // 3. Run classification
    // 4. Create communication if business-related
    // 5. Mark as processed
  }
});
```

## Benefits

1. **Zero Manual Entry**: Emails automatically appear in dashboard
2. **Intelligent Filtering**: Only see business-relevant emails
3. **Unified Communication**: Emails treated like any other communication
4. **Time Saving**: AI prioritization reduces email overwhelm
5. **Client Context**: Emails automatically linked to correct clients

## Future Enhancements

1. **Email Templates**: Quick replies with templates
2. **Bulk Operations**: Process multiple emails at once
3. **Smart Filters**: Learn from user behavior
4. **Email Analytics**: Track response times and patterns
5. **Two-way Sync**: Send emails from dashboard