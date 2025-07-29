import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getCurrentUser } from "./users";
import { api } from "./_generated/api";

// Query to check if user has Gmail connected
export const getIntegration = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const integration = await ctx.db
      .query("gmailIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return integration;
  },
});

// Mutation to save Gmail OAuth tokens
export const saveOAuthTokens = mutation({
  args: {
    email: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const tokenExpiration = Date.now() + (args.expiresIn * 1000);

    // Check if integration already exists
    const existing = await ctx.db
      .query("gmailIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        email: args.email,
        isActive: true,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken || existing.refreshToken,
        tokenExpiration,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      const integrationId = await ctx.db.insert("gmailIntegrations", {
        userId: user._id,
        email: args.email,
        isActive: true,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiration,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return integrationId;
    }
  },
});

// Mutation to save Gmail integration (for test mode)
export const connectGmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Check if integration already exists
    const existing = await ctx.db
      .query("gmailIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        email: args.email,
        isActive: true,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      const integrationId = await ctx.db.insert("gmailIntegrations", {
        userId: user._id,
        email: args.email,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return integrationId;
    }
  },
});

// Mutation to disconnect Gmail
export const disconnectGmail = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const integration = await ctx.db
      .query("gmailIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// Action to sync Gmail messages
export const syncEmails = action({
  handler: async (ctx) => {
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");

    const integration = await ctx.runQuery(api.gmail.getIntegration);
    if (!integration || !integration.isActive) {
      throw new Error("Gmail not connected");
    }

    // Get OAuth token from Clerk
    // Note: This requires additional setup with Clerk to access OAuth tokens
    // For now, we'll create a placeholder
    console.log("Syncing emails for:", integration.email);

    // TODO: Implement actual Gmail API calls
    // 1. Get access token from Clerk
    // 2. Use Gmail API to fetch messages
    // 3. Process each message
    // 4. Create communications for business emails

    return { synced: 0, message: "Gmail sync not yet implemented" };
  },
});

// Action to process a single email
export const processEmail = action({
  args: {
    messageId: v.string(),
    from: v.string(),
    subject: v.string(),
    body: v.string(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if already processed
    const existing = await ctx.runQuery(api.gmail.checkEmailProcessed, {
      gmailMessageId: args.messageId,
    });
    
    if (existing) {
      return { processed: false, reason: "Already processed" };
    }

    // TODO: Run AI classification
    // For now, we'll use simple keyword matching
    const businessKeywords = [
      'care', 'medication', 'appointment', 'health', 'doctor',
      'insurance', 'facility', 'family', 'update', 'concern'
    ];
    
    const lowerContent = (args.subject + ' ' + args.body).toLowerCase();
    const isBusinessRelated = businessKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );

    if (!isBusinessRelated) {
      return { processed: false, reason: "Not business related" };
    }

    // Create communication
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");

    // Try to match to a client by email domain
    const clients: any[] = await ctx.runQuery(api.clients.list, {});
    const fromDomain = args.from.split('@')[1];
    const matchedClient = clients.find((client: any) => 
      client.email && client.email.includes(fromDomain)
    );

    const communicationId: any = await ctx.runMutation(api.communications.create, {
      clientId: matchedClient?._id || clients[0]?._id, // Default to first client
      type: "email" as const,
      direction: "inbound" as const,
      subject: args.subject,
      content: args.body,
    });

    // Record mapping
    await ctx.runMutation(api.gmail.recordEmailMapping, {
      gmailMessageId: args.messageId,
      communicationId,
    });

    return { 
      processed: true, 
      communicationId,
      clientMatched: !!matchedClient 
    };
  },
});

// Query to check if email was already processed
export const checkEmailProcessed = query({
  args: {
    gmailMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("emailMappings")
      .withIndex("by_gmail_id", (q) => q.eq("gmailMessageId", args.gmailMessageId))
      .first();
    
    return !!mapping;
  },
});

// Mutation to record email mapping
export const recordEmailMapping = mutation({
  args: {
    gmailMessageId: v.string(),
    communicationId: v.id("communications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailMappings", {
      gmailMessageId: args.gmailMessageId,
      communicationId: args.communicationId,
      processedAt: Date.now(),
    });
  },
});

// Mutation to update last sync time
export const updateLastSync = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const integration = await ctx.db
      .query("gmailIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        lastSync: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});