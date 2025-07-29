import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createTimeEntry = mutation({
  args: {
    clientId: v.id("clients"),
    duration: v.number(), // in minutes
    description: v.string(),
    billable: v.boolean(),
    rate: v.optional(v.number()),
    relatedActionId: v.optional(v.id("actions")),
    relatedCommunicationId: v.optional(v.id("communications")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Verify client belongs to consultant
    const client = await ctx.db.get(args.clientId);
    if (!client || client.consultantId !== user._id) {
      throw new Error("Client not found");
    }

    const timeEntryId = await ctx.db.insert("timeEntries", {
      consultantId: user._id,
      clientId: args.clientId,
      duration: args.duration,
      description: args.description,
      billable: args.billable,
      rate: args.rate,
      relatedActionId: args.relatedActionId,
      relatedCommunicationId: args.relatedCommunicationId,
      createdAt: Date.now(),
    });

    return timeEntryId;
  },
});

export const listByClient = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("consultantId"), user._id))
      .order("desc")
      .collect();

    return timeEntries;
  },
});