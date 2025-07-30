import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Test function to verify AI context generation
export const testContextGeneration = action({
  args: {},
  handler: async (ctx) => {
    // Get first client with actions
    const actions = await ctx.runQuery(api.actions.listActive);
    
    if (!actions || actions.length === 0) {
      return { error: "No active actions found" };
    }
    
    const firstActionWithClient = actions.find(a => a.clientId);
    if (!firstActionWithClient) {
      return { error: "No actions with clients found" };
    }
    
    console.log("Testing AI context for client:", firstActionWithClient.client?.name);
    
    try {
      // Test the AI context generation
      const context = await ctx.runAction(api.aiContext.getOrGenerateContext, {
        clientId: firstActionWithClient.clientId!,
      });
      
      return {
        success: true,
        clientName: firstActionWithClient.client?.name,
        generatedContext: context,
        contextLength: context.length,
        hasBulletPoints: context.includes("•"),
      };
    } catch (error) {
      return {
        error: "Failed to generate context",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});