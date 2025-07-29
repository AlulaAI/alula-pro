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

    // Calculate priority score for each action
    const typeWeights = {
      client: 3,    // Existing client
      lead: 2,      // New client
      business: 1,  // Business need
      partner: 1,   // Partner (same as business)
    };

    const urgencyValues = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };

    // Sort by combined priority score
    const sortedActions = actions.sort((a, b) => {
      // Calculate priority scores
      const scoreA = (typeWeights[a.type] || 1) * (urgencyValues[a.urgencyLevel] || 0);
      const scoreB = (typeWeights[b.type] || 1) * (urgencyValues[b.urgencyLevel] || 0);

      // Sort by score (highest first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // If same score, sort by due date
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
        .take(10);
    }

    return {
      ...action,
      client,
      communication,
      communicationHistory,
    };
  },
});