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
      ? `You are helping an eldercare consultant prepare to respond to a client message. Write a brief narrative (maximum 75 words) that provides relevant context about this client to help craft an appropriate response.

Current Message to Respond To:
From: ${contextData.currentCommunication.direction === 'inbound' ? contextData.client.name : 'Consultant'}
Date: ${new Date(contextData.currentCommunication.createdAt).toLocaleDateString()}
Subject: ${contextData.currentCommunication.subject || 'No subject'}
Content: ${contextData.currentCommunication.content}

Client Background:
- Name: ${contextData.client.name}
- Recent Communications: ${contextData.recentCommunications.length} in last 30 days
- Active Care Needs: ${contextData.activeActions.length} tasks

Recent History (last 5 communications):
${contextData.recentCommunications.slice(0, 5).map(comm => 
  `- ${new Date(comm.createdAt).toLocaleDateString()}: ${comm.subject || comm.content.slice(0, 50)}...`
).join('\n')}

Recent Notes:
${contextData.notes.slice(0, 3).map(note => 
  `- ${note.content.slice(0, 50)}...`
).join('\n')}

Write a flowing narrative that connects the client's history to the current message, highlighting only the most relevant details that would help respond appropriately. Focus on:
1. What triggered this message
2. Relevant health/care situation
3. Family dynamics if pertinent
4. Suggested tone/approach for response`
      : `You are helping an eldercare consultant understand a client's current situation. Write a brief narrative (maximum 75 words) summarizing the most important aspects of this client's care situation.

Client: ${contextData.client.name}
Status: ${contextData.client.status}
Recent Activity: ${contextData.recentCommunications.length} communications, ${contextData.activeActions.length} active tasks

Recent Communications:
${contextData.recentCommunications.slice(0, 5).map(comm => 
  `- ${new Date(comm.createdAt).toLocaleDateString()}: ${comm.subject || comm.content.slice(0, 50)}...`
).join('\n')}

Active Needs:
${contextData.activeActions.slice(0, 3).map(action => 
  `- ${action.urgencyLevel}: ${action.title}`
).join('\n')}

Write a flowing narrative that captures their current care journey, focusing on immediate needs and recent developments. Make it personal and action-oriented.`;

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
        
        // Create a simple narrative for fallback
        let fallbackNarrative = "";
        if (contextData.currentCommunication) {
          fallbackNarrative = `${contextData.client.name} ${contextData.currentCommunication.direction === 'inbound' ? 'reached out' : 'was contacted'} about `;
          if (healthConcerns.size > 0) {
            fallbackNarrative += `${Array.from(healthConcerns)[0].toLowerCase()} concerns. `;
          } else {
            fallbackNarrative += "care needs. ";
          }
        } else {
          fallbackNarrative = `${contextData.client.name} is `;
          if (contextData.communicationHistory.length === 0) {
            fallbackNarrative += "a new client requiring initial assessment. ";
          } else {
            fallbackNarrative += "an existing client ";
            if (healthConcerns.size > 0) {
              fallbackNarrative += `dealing with ${Array.from(healthConcerns)[0].toLowerCase()} issues. `;
            } else {
              fallbackNarrative += "needing ongoing support. ";
            }
          }
        }
        
        if (hasFamilyMention) {
          fallbackNarrative += "Family is involved in care decisions. ";
        }
        
        if (contextData.activeActions.some(a => a.urgencyLevel === "critical")) {
          fallbackNarrative += "Urgent attention required.";
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
            content: "You are an expert eldercare consultant assistant. Write brief, empathetic narratives that help consultants understand their clients' situations. Maximum 75 words, flowing prose, no bullet points.",
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