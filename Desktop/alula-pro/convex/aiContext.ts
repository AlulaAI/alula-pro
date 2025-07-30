import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// Check if we have a cached context that's still valid
export const getCachedContext = internalQuery({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cached = await ctx.db
      .query("aiContextCache")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .first();
    
    return cached?.context || null;
  },
});

// Store context in cache
export const setCachedContext = internalMutation({
  args: {
    clientId: v.id("clients"),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
    
    // Delete any existing cache for this client
    const existing = await ctx.db
      .query("aiContextCache")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }
    
    // Insert new cache entry
    await ctx.db.insert("aiContextCache", {
      clientId: args.clientId,
      context: args.context,
      generatedAt: now,
      expiresAt,
    });
  },
});

// Internal query to fetch all client data
export const getClientData = internalQuery({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Get client info
    const clientInfo = await ctx.db.get(args.clientId);
    if (!clientInfo) return null;

    // Get recent communications
    const recentCommunications = await ctx.db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(10);

    // Get active actions
    const activeActions = await ctx.db
      .query("actions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(100);

    // Get notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(10);

    // Get recent time entries
    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(5);

    // Get communication history summary
    const communicationHistory = await ctx.db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .take(100);

    return {
      clientInfo,
      recentCommunications,
      activeActions,
      notes,
      timeEntries,
      communicationHistory,
    };
  },
});

"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Generate AI context for a client based on all available information
export const generateClientContext = internalAction({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Fetch all client data
    const client = await ctx.runQuery(internal.aiContext.getClientData, {
      clientId: args.clientId,
    });

    if (!client) {
      throw new Error("Client not found");
    }

    // Aggregate all context data
    const contextData = {
      client: client.clientInfo,
      recentCommunications: client.recentCommunications,
      activeActions: client.activeActions,
      notes: client.notes,
      timeEntries: client.timeEntries,
      communicationHistory: client.communicationHistory,
    };

    // Generate context prompt
    const prompt = `You are an AI assistant helping eldercare consultants understand their clients quickly. 
    Analyze the following client data and generate a concise, actionable context summary.

    Client Information:
    - Name: ${contextData.client.name}
    - Email: ${contextData.client.email || "Not provided"}
    - Phone: ${contextData.client.phone || "Not provided"}
    - Status: ${contextData.client.status}
    - Last Contact: ${contextData.client.lastContactedAt ? new Date(contextData.client.lastContactedAt).toLocaleDateString() : "Never"}

    Recent Communications (last 10):
    ${contextData.recentCommunications.map(comm => 
      `- ${new Date(comm.createdAt).toLocaleDateString()} - ${comm.type} (${comm.direction}): ${comm.subject || comm.content.slice(0, 100)}...`
    ).join('\n')}

    Active Actions:
    ${contextData.activeActions.map(action => 
      `- ${action.urgencyLevel.toUpperCase()}: ${action.title} - ${action.summary}`
    ).join('\n')}

    Internal Notes:
    ${contextData.notes.map(note => 
      `- ${new Date(note.createdAt).toLocaleDateString()}: ${note.content.slice(0, 100)}...`
    ).join('\n')}

    Time Entries (last 5):
    ${contextData.timeEntries.map(entry => 
      `- ${new Date(entry.createdAt).toLocaleDateString()}: ${entry.duration} min - ${entry.description}`
    ).join('\n')}

    Generate a brief context summary (max 100 words) that includes:
    1. Key health/care concerns or conditions
    2. Family/caregiver situation
    3. Recent important events or changes
    4. Current care needs or action items
    
    Format as bullet points with the most critical information first. Focus on actionable insights.`;

    try {
      if (!openai) {
        // Fallback to simple keyword-based context
        const healthKeywords = ["medication", "fall", "confusion", "pain", "hospital", "doctor", "dementia", "alzheimer"];
        const contextParts = [];
        
        // Check recent communications for health keywords
        const healthConcerns = new Set<string>();
        for (const comm of contextData.recentCommunications) {
          const content = (comm.content + " " + (comm.subject || "")).toLowerCase();
          for (const keyword of healthKeywords) {
            if (content.includes(keyword)) {
              healthConcerns.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
          }
        }
        
        if (healthConcerns.size > 0) {
          contextParts.push(`• ${Array.from(healthConcerns).slice(0, 2).join("/")} issues`);
        }
        
        // Add family context
        const familyKeywords = ["daughter", "son", "spouse", "wife", "husband", "caregiver", "family"];
        let hasFamilyMention = false;
        for (const comm of contextData.recentCommunications) {
          if (familyKeywords.some(keyword => comm.content.toLowerCase().includes(keyword))) {
            hasFamilyMention = true;
            break;
          }
        }
        
        if (hasFamilyMention) {
          contextParts.push("• Family involved in care");
        }
        
        // Add urgency context
        if (contextData.activeActions.some(a => a.urgencyLevel === "critical" || a.urgencyLevel === "high")) {
          contextParts.push("• Urgent needs require attention");
        }
        
        const fallbackContext = contextParts.length > 0 
          ? contextParts.join("\n")
          : "• New client\n• Needs comprehensive assessment";
          
        await ctx.runMutation(internal.aiContext.setCachedContext, {
          clientId: args.clientId,
          context: fallbackContext,
        });
        
        return fallbackContext;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert eldercare consultant assistant. Provide concise, actionable context summaries.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      });

      const contextSummary = completion.choices[0]?.message?.content || "";

      // Store the generated context in cache
      await ctx.runMutation(internal.aiContext.setCachedContext, {
        clientId: args.clientId,
        context: contextSummary,
      });

      return contextSummary;
    } catch (error) {
      console.error("Failed to generate AI context:", error);
      throw new Error("Failed to generate context summary");
    }
  },
});

// Get or generate context with caching
export const getOrGenerateContext = action({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Check cache first
    const cached = await ctx.runQuery(internal.aiContext.getCachedContext, {
      clientId: args.clientId,
    });
    
    if (cached) {
      return cached;
    }
    
    // Generate new context
    return await ctx.runAction(internal.aiContext.generateClientContext, {
      clientId: args.clientId,
    });
  },
});