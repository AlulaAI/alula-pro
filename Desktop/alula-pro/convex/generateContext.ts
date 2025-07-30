import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { api } from "./_generated/api";

// Mutation to trigger AI context generation for a client
export const generateForClient = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");
    
    // Trigger the action to generate context
    // We'll return immediately and let the action run in the background
    ctx.scheduler.runAfter(0, api.aiContext.getOrGenerateContext, {
      clientId: args.clientId,
    });
    
    return { started: true };
  },
});