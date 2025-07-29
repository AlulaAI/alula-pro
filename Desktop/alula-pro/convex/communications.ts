import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { api } from "./_generated/api";

export const get = query({
  args: {
    communicationId: v.id("communications"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const communication = await ctx.db.get(args.communicationId);
    if (!communication || communication.consultantId !== user._id) {
      return null;
    }

    return communication;
  },
});

export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = args.limit || 10;
    const communications = await ctx.db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);

    // Filter to only user's communications
    return communications.filter(c => c.consultantId === user._id);
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    type: v.union(
      v.literal("email"),
      v.literal("phone"),
      v.literal("sms"),
      v.literal("in_person")
    ),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    subject: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Verify client belongs to consultant
    const client = await ctx.db.get(args.clientId);
    if (!client || client.consultantId !== user._id) {
      throw new Error("Client not found");
    }

    // Create communication
    const communicationId = await ctx.db.insert("communications", {
      clientId: args.clientId,
      consultantId: user._id,
      type: args.type,
      direction: args.direction,
      subject: args.subject,
      content: args.content,
      status: "active",
      createdAt: Date.now(),
    });

    // Update client's last contacted time
    await ctx.db.patch(args.clientId, {
      lastContactedAt: Date.now(),
    });

    // Schedule AI analysis
    await ctx.scheduler.runAfter(0, api.aiActions.analyzeUrgency, {
      communicationId,
    });

    return communicationId;
  },
});

export const listActive = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const communications = await ctx.db
      .query("communications")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    // Get client details for each communication
    const communicationsWithClients = await Promise.all(
      communications.map(async (comm) => {
        const client = await ctx.db.get(comm.clientId);
        return {
          ...comm,
          client,
        };
      })
    );

    return communicationsWithClients;
  },
});

export const archive = mutation({
  args: {
    communicationId: v.id("communications"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const communication = await ctx.db.get(args.communicationId);
    if (!communication || communication.consultantId !== user._id) {
      throw new Error("Communication not found");
    }

    await ctx.db.patch(args.communicationId, {
      status: "archived",
    });
  },
});

export const createInternalNote = mutation({
  args: {
    clientId: v.id("clients"),
    content: v.string(),
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

    // Create internal note as a communication
    const noteId = await ctx.db.insert("communications", {
      clientId: args.clientId,
      consultantId: user._id,
      type: "in_person", // Using in_person as internal note type
      direction: "outbound",
      subject: "Internal Note",
      content: args.content,
      metadata: {
        from: user.name || user.email || "Consultant",
      },
      status: "active",
      createdAt: Date.now(),
    });

    return noteId;
  },
});