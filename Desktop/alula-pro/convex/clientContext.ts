import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate key context based on available client data
export const generateKeyContext = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    // Get client info
    const client = await ctx.db.get(args.clientId);
    if (!client) return null;

    // Get recent communications to understand context
    const recentComms = await ctx.db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(5);

    // Get any internal notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(3);

    // Get recent actions to understand ongoing concerns
    const recentActions = await ctx.db
      .query("actions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(3);

    // Build context based on available data
    const contextParts = [];

    // Add health concerns from recent communications
    const healthKeywords = ["medication", "fall", "confusion", "pain", "hospital", "doctor", "dementia", "alzheimer"];
    const healthConcerns = new Set<string>();
    
    for (const comm of recentComms) {
      const content = (comm.content + " " + (comm.subject || "")).toLowerCase();
      for (const keyword of healthKeywords) {
        if (content.includes(keyword)) {
          healthConcerns.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      }
    }

    if (healthConcerns.size > 0) {
      contextParts.push(Array.from(healthConcerns).slice(0, 2).join(", ") + " concerns");
    }

    // Check for family mentions
    const familyKeywords = ["daughter", "son", "spouse", "wife", "husband", "caregiver", "family"];
    let hasFamilyMention = false;
    
    for (const comm of recentComms) {
      const content = comm.content.toLowerCase();
      if (familyKeywords.some(keyword => content.includes(keyword))) {
        hasFamilyMention = true;
        break;
      }
    }

    if (hasFamilyMention) {
      contextParts.push("Family involved");
    }

    // Add timing context
    if (recentComms.length > 0) {
      const daysSinceLastContact = Math.floor(
        (Date.now() - recentComms[0].createdAt) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastContact === 0) {
        contextParts.push("Contacted today");
      } else if (daysSinceLastContact === 1) {
        contextParts.push("Contacted yesterday");
      } else if (daysSinceLastContact <= 7) {
        contextParts.push(`Last contact ${daysSinceLastContact} days ago`);
      }
    }

    // Check for urgency indicators
    const urgentActions = recentActions.filter(a => 
      a.urgencyLevel === "critical" || a.urgencyLevel === "high"
    );
    
    if (urgentActions.length > 0) {
      contextParts.push("Urgent needs");
    }

    // If we have notes, add a summary
    if (notes.length > 0) {
      const latestNote = notes[0];
      if (latestNote.content.length > 50) {
        contextParts.push("See internal notes");
      }
    }

    // Return formatted context
    return contextParts.length > 0 
      ? contextParts.slice(0, 3).join(" • ")
      : "New client • Needs assessment";
  },
});

// Store custom context for a client
export const updateClientContext = mutation({
  args: {
    clientId: v.id("clients"),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // For now, store in a note with special type
    await ctx.db.insert("notes", {
      clientId: args.clientId,
      consultantId: user._id,
      type: "internal" as const,
      content: `[KEY CONTEXT] ${args.context}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});