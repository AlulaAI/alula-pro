import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// Check if we have a cached context that's still valid
export const getCachedContext = internalQuery({
  args: {
    clientId: v.id("clients"),
    communicationId: v.optional(v.id("communications")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // If we have a communication ID, look for specific context
    if (args.communicationId) {
      const cached = await ctx.db
        .query("aiContextCache")
        .withIndex("by_client_comm", (q) => 
          q.eq("clientId", args.clientId).eq("communicationId", args.communicationId)
        )
        .filter((q) => q.gt(q.field("expiresAt"), now))
        .first();
      
      if (cached) return cached.context;
    }
    
    // Otherwise, look for general client context
    const cached = await ctx.db
      .query("aiContextCache")
      .withIndex("by_client_comm", (q) => 
        q.eq("clientId", args.clientId).eq("communicationId", undefined)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .first();
    
    return cached?.context || null;
  },
});

// Store context in cache
export const setCachedContext = internalMutation({
  args: {
    clientId: v.id("clients"),
    communicationId: v.optional(v.id("communications")),
    context: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
    
    // Delete any existing cache for this client/communication combo
    const existing = await ctx.db
      .query("aiContextCache")
      .withIndex("by_client_comm", (q) => 
        q.eq("clientId", args.clientId).eq("communicationId", args.communicationId)
      )
      .take(100);
    
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }
    
    // Insert new cache entry
    await ctx.db.insert("aiContextCache", {
      clientId: args.clientId,
      communicationId: args.communicationId,
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
    communicationId: v.optional(v.id("communications")),
  },
  handler: async (ctx, args) => {
    // Fetch all client data
    const client = await ctx.runQuery(internal.aiContext.getClientData, {
      clientId: args.clientId,
    });

    if (!client) {
      throw new Error("Client not found");
    }
    
    // Get the specific communication if provided
    let currentCommunication = null;
    if (args.communicationId) {
      const comms = client.recentCommunications.find(c => c._id === args.communicationId);
      if (comms) {
        currentCommunication = comms;
      }
    }

    // Aggregate all context data
    const contextData = {
      client: client.clientInfo,
      recentCommunications: client.recentCommunications,
      activeActions: client.activeActions,
      notes: client.notes,
      timeEntries: client.timeEntries,
      communicationHistory: client.communicationHistory,
      currentCommunication,
    };

    // Generate context prompt
    const prompt = contextData.currentCommunication 
      ? `You are trained in Teepa Snow's Positive Approach to Care™. Help an eldercare consultant respond to a client by providing a strength-based context summary (maximum 75 words, no bullet points).

Current Message:
From: ${contextData.currentCommunication.direction === 'inbound' ? contextData.client.name : 'Consultant'}
Date: ${new Date(contextData.currentCommunication.createdAt).toLocaleDateString()}
Content: ${contextData.currentCommunication.content}

Client: ${contextData.client.name}
Recent Engagement: ${contextData.recentCommunications.length} communications in 30 days
Current Support Activities: ${contextData.activeActions.length}

Recent Interactions:
${contextData.recentCommunications.slice(0, 5).map(comm => 
  `${new Date(comm.createdAt).toLocaleDateString()}: ${comm.subject || comm.content.slice(0, 50)}...`
).join('\n')}

Care Team Notes:
${contextData.notes.slice(0, 3).map(note => 
  `${note.content.slice(0, 50)}...`
).join('\n')}

Write a concise summary focusing on:
- Client's current abilities and strengths
- What they CAN do and ARE doing well
- Positive engagement opportunities
- Supportive relationships and resources
- Context for responding with encouragement

Use person-first language. Focus on abilities, not disabilities. Highlight successes and positive moments.`
      : `You are trained in Teepa Snow's Positive Approach to Care™. Provide a strength-based summary of this client (maximum 75 words, no bullet points).

Client: ${contextData.client.name}
Engagement Level: ${contextData.client.status === 'active' ? 'Actively engaged' : 'Building relationship'}
Recent Activity: ${contextData.recentCommunications.length} meaningful connections, ${contextData.activeActions.length} support opportunities

Recent Positive Interactions:
${contextData.recentCommunications.slice(0, 5).map(comm => 
  `${new Date(comm.createdAt).toLocaleDateString()}: ${comm.subject || comm.content.slice(0, 50)}...`
).join('\n')}

Current Support Focus:
${contextData.activeActions.slice(0, 3).map(action => 
  `${action.title}`
).join('\n')}

Write a concise summary highlighting:
- What the client is doing well
- Their strengths and abilities
- Positive relationships and support systems
- Opportunities for meaningful engagement
- Recent successes or progress

Use person-first, ability-focused language. Emphasize possibilities, not problems.`;

    try {
      if (!openai) {
        // Fallback to simple keyword-based context
        const positiveKeywords = ["visit", "walk", "activity", "family", "friend", "enjoy", "music", "garden", "cook", "read"];
        const supportKeywords = ["daughter", "son", "spouse", "wife", "husband", "caregiver", "family", "friend", "neighbor"];
        
        // Check for positive activities and interests
        const positiveActivities = new Set<string>();
        for (const comm of contextData.recentCommunications) {
          const content = (comm.content + " " + (comm.subject || "")).toLowerCase();
          for (const keyword of positiveKeywords) {
            if (content.includes(keyword)) {
              positiveActivities.add(keyword);
            }
          }
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
        
        // Create a strength-based narrative for fallback
        let fallbackNarrative = "";
        if (contextData.currentCommunication) {
          fallbackNarrative = `${contextData.client.name} ${contextData.currentCommunication.direction === 'inbound' ? 'actively reached out' : 'engaged in conversation'} `;
          if (contextData.recentCommunications.length > 5) {
            fallbackNarrative += `and maintains regular communication. `;
          } else {
            fallbackNarrative += `showing positive engagement. `;
          }
        } else {
          fallbackNarrative = `${contextData.client.name} `;
          if (contextData.communicationHistory.length === 0) {
            fallbackNarrative += "is beginning their care journey with us. ";
          } else if (contextData.communicationHistory.length > 10) {
            fallbackNarrative += "has built a strong relationship through ${contextData.communicationHistory.length} meaningful interactions. ";
          } else {
            fallbackNarrative += "continues to engage positively in their care. ";
          }
        }
        
        if (hasFamilyMention) {
          fallbackNarrative += "Has supportive family involvement. ";
        }
        
        if (contextData.activeActions.length > 0) {
          fallbackNarrative += `Currently exploring ${contextData.activeActions.length} opportunities for enhanced well-being.`;
        } else {
          fallbackNarrative += "Ready for new opportunities to thrive.";
        }
          
        await ctx.runMutation(internal.aiContext.setCachedContext, {
          clientId: args.clientId,
          communicationId: args.communicationId,
          context: fallbackNarrative,
        });
        
        return fallbackNarrative;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert eldercare consultant trained in Teepa Snow's Positive Approach to Care™. Write concise, strength-based summaries (75 words max) that focus on abilities, not disabilities. Use person-first language, highlight what clients CAN do, and emphasize positive relationships and opportunities. No bullet points - write as a flowing summary that inspires hope and connection.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const contextSummary = completion.choices[0]?.message?.content || "";

      // Store the generated context in cache
      await ctx.runMutation(internal.aiContext.setCachedContext, {
        clientId: args.clientId,
        communicationId: args.communicationId,
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
    communicationId: v.optional(v.id("communications")),
  },
  handler: async (ctx, args) => {
    // Check cache first
    const cached = await ctx.runQuery(internal.aiContext.getCachedContext, {
      clientId: args.clientId,
      communicationId: args.communicationId,
    });
    
    if (cached) {
      return cached;
    }
    
    // Generate new context
    return await ctx.runAction(internal.aiContext.generateClientContext, {
      clientId: args.clientId,
      communicationId: args.communicationId,
    });
  },
});