import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getCommunication = internalQuery({
  args: {
    communicationId: v.id("communications"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.communicationId);
  },
});

export const updateCommunicationAnalysis = internalMutation({
  args: {
    communicationId: v.id("communications"),
    urgencyScore: v.number(),
    aiSummary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.communicationId, {
      urgencyScore: args.urgencyScore,
      aiSummary: args.aiSummary,
    });
  },
});

export const createActionFromCommunication = internalMutation({
  args: {
    communicationId: v.id("communications"),
    clientId: v.id("clients"),
    urgencyLevel: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    title: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const communication = await ctx.db.get(args.communicationId);
    if (!communication) return;

    await ctx.db.insert("actions", {
      consultantId: communication.consultantId,
      clientId: args.clientId,
      communicationId: args.communicationId,
      type: "client",
      title: args.title,
      summary: args.summary,
      urgencyLevel: args.urgencyLevel,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});