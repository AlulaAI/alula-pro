"use node";

import { v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { google } from 'googleapis';

// Helper to get OAuth client from stored tokens
async function getGmailClient(ctx: ActionCtx) {
  const integration = await ctx.runQuery(api.gmail.getIntegration);
  
  if (!integration || !integration.isActive) {
    throw new Error("Gmail not connected");
  }
  
  if (!integration.accessToken) {
    throw new Error("No access token found. Please reconnect Gmail.");
  }
  
  // Check if token is expired
  if (integration.tokenExpiration && Date.now() > integration.tokenExpiration) {
    // TODO: Implement token refresh
    throw new Error("Access token expired. Please reconnect Gmail.");
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Action to fetch emails from Gmail
export const fetchEmails = action({
  args: {
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");
    
    try {
      const gmail = await getGmailClient(ctx);
      
      // List messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: args.maxResults || 10,
        q: 'is:unread category:primary', // Focus on primary inbox unread emails
      });
      
      const messages = response.data.messages || [];
      const emails = [];
      
      // Fetch details for each message
      for (const message of messages) {
        if (!message.id) continue;
        
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });
        
        const headers = detail.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // Extract body
        let body = '';
        const parts = detail.data.payload?.parts || [];
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
        
        // If no multipart, check the main body
        if (!body && detail.data.payload?.body?.data) {
          body = Buffer.from(detail.data.payload.body.data, 'base64').toString();
        }
        
        emails.push({
          id: message.id,
          from,
          subject,
          body: body.substring(0, 500), // Limit body length
          date: new Date(date).getTime(),
        });
      }
      
      // Process emails
      for (const email of emails) {
        // TODO: Implement processEmail action
        // await ctx.runAction(api.gmailActions.processEmail, {
        //   messageId: email.id,
        //   from: email.from,
        //   subject: email.subject,
        //   body: email.body,
        //   receivedAt: email.date,
        // });
      }
      
      // Update last sync time
      await ctx.runMutation(api.gmail.updateLastSync);
      
      return {
        success: true,
        message: `Synced ${emails.length} emails`,
        emails: emails.length,
      };
    } catch (error: any) {
      console.error("Error fetching emails:", error);
      throw new Error(error.message || "Failed to fetch emails");
    }
  },
});

// Action to set up Gmail watch/push notifications
export const setupGmailWatch = action({
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");
    
    try {
      // TODO: Implement Gmail watch setup
      // This would:
      // 1. Get Gmail client with OAuth
      // 2. Call gmail.users.watch() to set up push notifications
      // 3. Store the watch expiration in the database
      
      console.log("Setting up Gmail watch for user:", user._id);
      
      return {
        success: true,
        message: "Gmail watch setup pending implementation",
      };
    } catch (error) {
      console.error("Error setting up Gmail watch:", error);
      throw new Error("Failed to set up Gmail watch");
    }
  },
});

// Action to send a reply email
export const sendReply = action({
  args: {
    messageId: v.string(),
    threadId: v.optional(v.string()),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");
    
    try {
      const gmail = await getGmailClient(ctx);
      
      // Prepare the email
      const email = [
        `To: ${args.to}`,
        `Subject: ${args.subject}`,
        `In-Reply-To: ${args.messageId}`,
        `References: ${args.messageId}`,
        '',
        args.body
      ].join('\r\n');
      
      const encodedMessage = Buffer.from(email).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      // Send the email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: args.threadId,
        },
      });
      
      return {
        success: true,
        messageId: response.data.id,
      };
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new Error(error.message || "Failed to send email");
    }
  },
});

// Action to handle Gmail webhook notifications
export const handleGmailWebhook = action({
  args: {
    message: v.object({
      data: v.string(),
      messageId: v.string(),
      publishTime: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Decode the base64 message
      const decodedData = Buffer.from(args.message.data, 'base64').toString();
      const notification = JSON.parse(decodedData);
      
      console.log("Gmail webhook notification:", notification);
      
      // TODO: Process the notification
      // 1. Get the history ID from the notification
      // 2. Fetch changes since last history ID
      // 3. Process new emails
      
      return {
        success: true,
        processed: true,
      };
    } catch (error) {
      console.error("Error processing Gmail webhook:", error);
      throw new Error("Failed to process Gmail webhook");
    }
  },
});