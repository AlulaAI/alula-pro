"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate AI context for a client based on all available information
export const generateClientContext = action({
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

      // Store the generated context
      await ctx.runMutation(internal.aiContext.storeClientContext, {
        clientId: args.clientId,
        context: contextSummary,
        generatedAt: Date.now(),
      });

      return contextSummary;
    } catch (error) {
      console.error("Failed to generate AI context:", error);
      throw new Error("Failed to generate context summary");
    }
  },
});

// Internal query to fetch all client data
export const getClientData = internalAction({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const db = ctx.db;
    
    // Get client info
    const clientInfo = await db.get(args.clientId);
    if (!clientInfo) return null;

    // Get recent communications
    const recentCommunications = await db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(10);

    // Get active actions
    const activeActions = await db
      .query("actions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get notes
    const notes = await db
      .query("notes")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(10);

    // Get recent time entries
    const timeEntries = await db
      .query("timeEntries")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(5);

    // Get communication history summary
    const communicationHistory = await db
      .query("communications")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

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

// Store generated context
export const storeClientContext = internalAction({
  args: {
    clientId: v.id("clients"),
    context: v.string(),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Store in a cache table or as part of the client record
    // For now, we'll return it directly
    return args.context;
  },
});