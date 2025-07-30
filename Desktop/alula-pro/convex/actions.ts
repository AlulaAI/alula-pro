import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const create = mutation({
  args: {
    clientId: v.optional(v.id("clients")),
    communicationId: v.optional(v.id("communications")),
    type: v.union(
      v.literal("client"),
      v.literal("business"),
      v.literal("lead"),
      v.literal("partner")
    ),
    title: v.string(),
    summary: v.string(),
    urgencyLevel: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const actionId = await ctx.db.insert("actions", {
      consultantId: user._id,
      clientId: args.clientId,
      communicationId: args.communicationId,
      type: args.type,
      title: args.title,
      summary: args.summary,
      urgencyLevel: args.urgencyLevel,
      status: "active",
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return actionId;
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const actions = await ctx.db
      .query("actions")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();


    // Sort by priority hierarchy: urgency level first, then type
    const sortedActions = actions.sort((a, b) => {
      // First, compare urgency levels
      const urgencyOrder = ['critical', 'high', 'medium', 'low'];
      const urgencyIndexA = urgencyOrder.indexOf(a.urgencyLevel);
      const urgencyIndexB = urgencyOrder.indexOf(b.urgencyLevel);
      
      if (urgencyIndexA !== urgencyIndexB) {
        return urgencyIndexA - urgencyIndexB; // Lower index = higher priority
      }
      
      // If same urgency level, compare client types
      const typeOrder = {
        'client': 1,    // Existing client - highest
        'lead': 2,      // New client - middle
        'business': 3,  // Business need - lowest
        'partner': 3,   // Partner same as business
      };
      
      const typeOrderA = typeOrder[a.type] || 999;
      const typeOrderB = typeOrder[b.type] || 999;
      
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB; // Lower number = higher priority
      }

      // If same urgency and type, sort by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date (newest first)
      return b.createdAt - a.createdAt;
    });

    // Get client details for each action
    const actionsWithClients = await Promise.all(
      sortedActions.map(async (action) => {
        const client = action.clientId ? await ctx.db.get(action.clientId) : null;
        return {
          ...action,
          client,
        };
      })
    );

    return actionsWithClients;
  },
});

export const archive = mutation({
  args: {
    actionId: v.id("actions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const action = await ctx.db.get(args.actionId);
    if (!action || action.consultantId !== user._id) {
      throw new Error("Action not found");
    }

    await ctx.db.patch(args.actionId, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});

export const snooze = mutation({
  args: {
    actionId: v.id("actions"),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const action = await ctx.db.get(args.actionId);
    if (!action || action.consultantId !== user._id) {
      throw new Error("Action not found");
    }

    await ctx.db.patch(args.actionId, {
      status: "snoozed",
      snoozedUntil: Date.now() + (args.hours * 60 * 60 * 1000),
      updatedAt: Date.now(),
    });
  },
});

export const listArchived = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const actions = await ctx.db
      .query("actions")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .filter((q) => q.eq(q.field("status"), "archived"))
      .collect();

    // Sort by updated date (most recent first)
    const sortedActions = actions.sort((a, b) => b.updatedAt - a.updatedAt);

    // Get client details for each action
    const actionsWithClients = await Promise.all(
      sortedActions.map(async (action) => {
        const client = action.clientId ? await ctx.db.get(action.clientId) : null;
        return {
          ...action,
          client,
        };
      })
    );

    return actionsWithClients;
  },
});

export const restore = mutation({
  args: {
    actionId: v.id("actions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const action = await ctx.db.get(args.actionId);
    if (!action || action.consultantId !== user._id) {
      throw new Error("Action not found");
    }

    await ctx.db.patch(args.actionId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

export const getActionWithDetails = query({
  args: {
    actionId: v.id("actions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const action = await ctx.db.get(args.actionId);
    if (!action || action.consultantId !== user._id) return null;

    // Get client details
    const client = action.clientId ? await ctx.db.get(action.clientId) : null;

    // Get related communication
    const communication = action.communicationId 
      ? await ctx.db.get(action.communicationId) 
      : null;

    // Get client communication history
    let communicationHistory: any[] = [];
    if (action.clientId) {
      communicationHistory = await ctx.db
        .query("communications")
        .withIndex("by_client", (q) => q.eq("clientId", action.clientId!))
        .order("desc")
        .take(20);
    }

    // For now, keep the simple keyword-based context as we can't call actions from queries
    let keyContext = null;
    if (action.clientId) {
      // Check if we have a cached AI context
      const now = Date.now();
      // First try to find context specific to this communication
      let cached = null;
      if (action.communicationId) {
        cached = await ctx.db
          .query("aiContextCache")
          .withIndex("by_client_comm", (q) => 
            q.eq("clientId", action.clientId!).eq("communicationId", action.communicationId)
          )
          .filter((q) => q.gt(q.field("expiresAt"), now))
          .first();
      }
      
      // If no specific context, look for general client context
      if (!cached) {
        cached = await ctx.db
          .query("aiContextCache")
          .withIndex("by_client_comm", (q) => 
            q.eq("clientId", action.clientId!).eq("communicationId", undefined)
          )
          .filter((q) => q.gt(q.field("expiresAt"), now))
          .first();
      }
      
      if (cached) {
        keyContext = cached.context;
      } else {
        // Fallback to simple keyword-based context
        const recentComms = await ctx.db
          .query("communications")
          .withIndex("by_client", (q) => q.eq("clientId", action.clientId!))
          .order("desc")
          .take(5);

        const contextParts = [];

        // Look for positive engagement indicators
        const engagementKeywords = ["visit", "walk", "activity", "family", "friend", "enjoy", "participate"];
        let hasPositiveEngagement = false;
        
        for (const comm of recentComms) {
          const content = (comm.content + " " + (comm.subject || "")).toLowerCase();
          if (engagementKeywords.some(keyword => content.includes(keyword))) {
            hasPositiveEngagement = true;
            break;
          }
        }

        // Check for family context
        const familyKeywords = ["daughter", "son", "spouse", "wife", "husband", "caregiver", "family", "brother", "sister"];
        const familyMembers = new Set<string>();
        
        for (const comm of recentComms) {
          const content = comm.content.toLowerCase();
          for (const keyword of familyKeywords) {
            if (content.includes(keyword)) {
              familyMembers.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
          }
        }

        if (familyMembers.size > 0) {
          contextParts.push(Array.from(familyMembers).slice(0, 1).join(", ") + " is caregiver");
        }

        // Add timing/frequency context
        if (communicationHistory.length > 3) {
          contextParts.push(`${communicationHistory.length}+ recent contacts`);
        } else if (communicationHistory.length === 1) {
          contextParts.push("First contact");
        }

        // Create a strength-based narrative fallback
        keyContext = `${client.name} `;
        if (communicationHistory.length > 10) {
          keyContext += `has built a strong relationship through ${communicationHistory.length} meaningful interactions`;
        } else if (communicationHistory.length > 0) {
          keyContext += `is actively engaged in their care journey`;
        } else {
          keyContext += `is beginning their care journey with us`;
        }
        
        if (familyMembers.size > 0) {
          keyContext += ` with supportive ${Array.from(familyMembers)[0].toLowerCase()} involvement`;
        }
        
        keyContext += ". ";
        
        if (action.urgencyLevel === "critical" || action.urgencyLevel === "high") {
          keyContext += "Ready for immediate support and connection.";
        } else {
          keyContext += "Continuing to explore opportunities for enhanced well-being.";
        }
      }
    }

    return {
      ...action,
      client,
      communication,
      communicationHistory,
      keyContext,
    };
  },
});