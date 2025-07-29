"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Initialize OpenAI client - in production, set OPENAI_API_KEY in Convex environment variables
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const analyzeUrgency = action({
  args: {
    communicationId: v.id("communications"),
  },
  handler: async (ctx, args) => {
    const communication = await ctx.runQuery(internal.ai.getCommunication, {
      communicationId: args.communicationId,
    });

    if (!communication) return;

    try {
      // Check if OpenAI is available
      if (!openai) {
        console.warn("OpenAI not configured - using default urgency analysis");
        // Simple keyword-based urgency detection
        const urgentKeywords = ['emergency', 'urgent', 'critical', 'immediate', 'asap', 'fall', 'hospital', 'pain', 'confused', 'lost'];
        const content = (communication.content + ' ' + (communication.subject || '')).toLowerCase();
        const hasUrgentKeyword = urgentKeywords.some(keyword => content.includes(keyword));
        const urgencyScore = hasUrgentKeyword ? 75 : 50;
        
        await ctx.runMutation(internal.ai.updateCommunicationAnalysis, {
          communicationId: args.communicationId,
          urgencyScore,
          aiSummary: communication.content.substring(0, 100) + "...",
        });

        if (urgencyScore >= 70) {
          await ctx.runMutation(internal.ai.createActionFromCommunication, {
            communicationId: args.communicationId,
            clientId: communication.clientId,
            urgencyLevel: "high",
            title: `Review: ${communication.subject || "New " + communication.type}`,
            summary: communication.content.substring(0, 200),
          });
        }
        return;
      }

      const prompt = `Analyze this ${communication.type} communication and determine its urgency level for an elder care consultant.

Communication type: ${communication.type}
Direction: ${communication.direction}
Subject: ${communication.subject || "No subject"}
Content: ${communication.content}

Provide:
1. An urgency score from 0-100 (0=not urgent, 100=critical)
2. A brief summary (max 2 sentences) highlighting the key issue
3. Identify any risk factors (health crisis, safety concern, family conflict, etc.)

Consider elder care specific factors like:
- Health emergencies or sudden changes
- Medication issues
- Falls or safety concerns
- Cognitive changes or confusion
- Family stress or conflict
- Time-sensitive decisions

Return as JSON: { urgencyScore: number, summary: string, riskFactors: string[] }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant helping elder care consultants prioritize communications. Focus on identifying urgent situations that need immediate attention.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      // Update communication with AI analysis
      await ctx.runMutation(internal.ai.updateCommunicationAnalysis, {
        communicationId: args.communicationId,
        urgencyScore: result.urgencyScore || 50,
        aiSummary: result.summary || communication.content.substring(0, 100),
      });

      // Create action if urgency is high
      if (result.urgencyScore >= 70) {
        const urgencyLevel = 
          result.urgencyScore >= 90 ? "critical" :
          result.urgencyScore >= 70 ? "high" : "medium";

        await ctx.runMutation(internal.ai.createActionFromCommunication, {
          communicationId: args.communicationId,
          clientId: communication.clientId,
          urgencyLevel,
          title: `Urgent: ${communication.subject || "New " + communication.type}`,
          summary: result.summary || communication.content.substring(0, 200),
        });
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      // Set default urgency
      await ctx.runMutation(internal.ai.updateCommunicationAnalysis, {
        communicationId: args.communicationId,
        urgencyScore: 50,
        aiSummary: communication.content.substring(0, 100),
      });
    }
  },
});