import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const clientId = await ctx.db.insert("clients", {
      consultantId: user._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      status: "active",
      createdAt: Date.now(),
    });

    return clientId;
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    let query = ctx.db
      .query("clients")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id));

    if (args.status) {
      const clients = await query.collect();
      return clients.filter(client => client.status === args.status);
    }

    return await query.collect();
  },
});

export const get = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const client = await ctx.db.get(args.clientId);
    if (!client || client.consultantId !== user._id) return null;

    return client;
  },
});

export const update = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const client = await ctx.db.get(args.clientId);
    if (!client || client.consultantId !== user._id) {
      throw new Error("Client not found");
    }

    const { clientId, ...updates } = args;
    await ctx.db.patch(args.clientId, updates);

    return args.clientId;
  },
});