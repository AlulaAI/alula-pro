"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Enhanced email processor with AI classification
export const processIncomingEmail = action({
  args: {
    from: v.string(),
    to: v.string(), 
    subject: v.string(),
    body: v.string(),
    messageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("Processing incoming email from:", args.from);
    
    // Get current user
    const user = await ctx.runQuery(api.users.getCurrentUserAction);
    if (!user) throw new Error("Not authenticated");

    // Check if email was already processed
    if (args.messageId) {
      const existing = await ctx.runQuery(api.gmail.checkEmailProcessed, {
        gmailMessageId: args.messageId,
      });
      if (existing) {
        return { processed: false, reason: "Already processed" };
      }
    }

    // AI Classification
    const classificationPrompt = `
You are an AI assistant for an eldercare consulting service. Analyze this email and determine:

1. Is this related to eldercare services? (yes/no)
2. Classification:
   - "new_lead": Someone inquiring about services for themselves or a family member
   - "existing_client": Communication from a known client or their family
   - "business": Professional/partnership/vendor communication
   - "spam": Unrelated to eldercare services

3. Urgency level (0-100):
   - 90-100: Medical emergency, immediate care needed
   - 70-89: Urgent care needs, safety concerns
   - 50-69: Important but not urgent (scheduling, questions)
   - 0-49: General inquiries, information requests

4. Summary: Brief 1-2 sentence summary of the email's main point

5. Suggested client name: If this is a new lead, extract the potential client's name (the elderly person needing care, not necessarily the sender)

Email Details:
From: ${args.from}
To: ${args.to}
Subject: ${args.subject}
Body: ${args.body}

Respond in JSON format:
{
  "isElderCareRelated": boolean,
  "classification": "new_lead" | "existing_client" | "business" | "spam",
  "urgencyScore": number,
  "summary": string,
  "suggestedClientName": string | null,
  "senderName": string | null
}
`;

    try {
      const completion = await openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in eldercare consulting. Analyze emails accurately and extract relevant information. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: classificationPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const classification = JSON.parse(completion.choices[0].message.content || "{}");
      console.log("Email classification:", classification);

      // If not eldercare related, skip processing
      if (!classification.isElderCareRelated || classification.classification === "spam") {
        return { 
          processed: false, 
          reason: "Not eldercare related",
          classification 
        };
      }

      // Extract email domain and sender info
      const emailMatch = args.from.match(/<(.+?)>/) || [null, args.from];
      const senderEmail = emailMatch[1] || args.from;
      const senderName = classification.senderName || args.from.split('<')[0].trim();

      // Try to find existing client by email
      const clients: any[] = await ctx.runQuery(api.clients.list, {});
      let clientId = null;
      
      // Check if sender matches any existing client email
      const existingClient = clients.find((client: any) => 
        client.email && client.email.toLowerCase() === senderEmail.toLowerCase()
      );

      if (existingClient) {
        clientId = existingClient._id;
      } else if (classification.classification === "new_lead") {
        // Create new client for new leads
        const clientName = classification.suggestedClientName || senderName || "Unknown Client";
        
        clientId = await ctx.runMutation(api.clients.create, {
          name: clientName,
          email: senderEmail,
          // Add note about this being from email inquiry
        });

        console.log("Created new client:", clientName);
      } else {
        // For other types, use first client as fallback
        clientId = clients[0]?._id;
      }

      if (!clientId) {
        throw new Error("No client found or created");
      }

      // Create communication record
      const communicationId: any = await ctx.runMutation(api.communications.create, {
        clientId,
        type: "email" as const,
        direction: "inbound" as const,
        subject: args.subject,
        content: args.body,
      });

      // Update communication with AI summary and metadata
      await ctx.runMutation(api.communications.updateWithAI, {
        communicationId,
        aiSummary: classification.summary,
        urgencyScore: classification.urgencyScore,
        metadata: {
          from: args.from,
          to: args.to,
          messageId: args.messageId,
          threadId: args.threadId,
        },
      });

      // Create action if high urgency
      if (classification.urgencyScore >= 70) {
        const urgencyLevel = classification.urgencyScore >= 90 ? "critical" : "high";
        
        await ctx.runMutation(api.actions.create, {
          clientId,
          communicationId,
          type: classification.classification === "new_lead" ? "lead" : "client",
          title: args.subject,
          summary: classification.summary,
          urgencyLevel,
        });
      }

      // Record email mapping if messageId exists
      if (args.messageId) {
        await ctx.runMutation(api.gmail.recordEmailMapping, {
          gmailMessageId: args.messageId,
          communicationId,
        });
      }

      return {
        processed: true,
        communicationId,
        clientId,
        classification,
        isNewClient: classification.classification === "new_lead",
      };

    } catch (error) {
      console.error("Error processing email:", error);
      throw new Error("Failed to process email");
    }
  },
});

// Test function for demo purposes
export const testEmailProcessing = action({
  args: {
    scenario: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scenario = args.scenario || "new_lead";
    
    const testEmails = {
      new_lead: {
        from: "Sarah Johnson <jason+1@withalula.com>",
        to: "consultant@alulacare.com",
        subject: "Need help with my mother's care",
        body: `Hi,

I found your website and I'm reaching out because I need help with my 82-year-old mother, Margaret. She's been living alone since my father passed last year, but we're noticing she's becoming more forgetful and had a fall last week.

We're not sure what kind of care she needs or how to even start looking for help. She's resistant to the idea of moving but we're worried about her safety.

Can you help us figure out the best options? This is becoming quite urgent as we found out she's been forgetting to take her medications.

Thanks,
Sarah Johnson
(555) 123-4567`,
      },
      urgent_client: {
        from: "Mike Wilson <mike.wilson@example.com>",
        to: "consultant@alulacare.com", 
        subject: "URGENT: Dad had another fall - need immediate help",
        body: `This is Mike Wilson (Robert Wilson's son).

Dad had another fall this morning and hit his head. He's at the ER now and they're running tests. The doctor says he can't go back home alone after this.

We need to arrange 24/7 care immediately or find a facility that can take him. Can you help us TODAY? 

Please call me ASAP at (555) 987-6543.

Mike`,
      },
      professional_referral: {
        from: "Jen Kowalski <jen@dowdaseniorconsultants.com>",
        to: "missy.harden@alulacare.com",
        subject: "Referral - Mrs. Thompson needs care coordination",
        body: `Hi Missy,

I have a referral for you. Mrs. Dorothy Thompson (88) lives in your service area and her family reached out to us, but we're at capacity right now.

She's recently widowed and her daughter Linda is overwhelmed trying to manage her care from out of state. Dorothy has mild dementia, diabetes, and mobility issues. She's currently at home with part-time help but needs a comprehensive care assessment and ongoing coordination.

The family has a good budget for private care. Linda's number is (555) 234-5678.

Let me know if you can take this on. Happy to provide a warm handoff.

Best,
Jen Kowalski
Dowda Senior Consultants`,
      },
      target_marketing: {
        from: "Target <deals@e.target.com>",
        to: "missy.harden@alulacare.com",
        subject: "🎯 Don't miss out! 30% off home essentials this weekend",
        body: `Shop these deals before they're gone!

Living Room Furniture - Up to 30% off
Kitchen Appliances - Buy 2 Get 1 Free  
Bedding & Bath - Starting at $9.99

Plus, get free shipping on orders over $35!

[Shop Now] [Unsubscribe]

Target Corporation | Minneapolis, MN 55403`,
      },
      lunch_invitation: {
        from: "Reamey Walsh <reamey@dementiacarespecialists.com>",
        to: "missy.harden@alulacare.com",
        subject: "Lunch this week?",
        body: `Hey Missy!

It's been way too long! I know we're both swamped with clients, but are you free for lunch this week? I'm thinking Thursday or Friday around noon?

There's this new Mediterranean place downtown I've been wanting to try. Plus I'd love to catch up - feels like we haven't talked since the conference in March!

Let me know what works for you.

Reamey`,
      },
      amazon_order: {
        from: "Amazon <shipment-tracking@amazon.com>",
        to: "missy.harden@alulacare.com",
        subject: "Your order has been delivered",
        body: `Your package was delivered.

Order #123-4567890-1234567
Delivered to: Front door

Items:
- Compression Socks (3 pairs)
- Hand Sanitizer (12 oz)

Track your package: [Link]

Thank you for shopping with Amazon!`,
      },
      routine_update: {
        from: "Patricia Chen <pchen@example.com>",
        to: "consultant@alulacare.com",
        subject: "Mom's doing better with the new aide",
        body: `Hi,

Just wanted to give you a quick update. Mom (Eleanor Chen) seems to be doing much better with the new aide you recommended. They get along well and Mom is eating better.

We'd like to increase the hours from 4 to 6 per day starting next month if possible.

Thanks for all your help!
Patricia`,
      },
      newsletter_spam: {
        from: "Wellness Weekly <newsletter@wellnessweekly.com>",
        to: "missy.harden@alulacare.com",
        subject: "10 Superfoods That Will Change Your Life! 🥑",
        body: `This Week's Top Stories:

🥑 The Avocado Secret Doctors Don't Want You to Know
🧘 5-Minute Morning Yoga That Burns 500 Calories  
💊 New Vitamin Trend Taking Hollywood by Storm

SPECIAL OFFER: Get 50% off your first month!

Click here to read more...

Copyright 2024 Wellness Weekly | Unsubscribe`,
      },
    };

    const emailData = testEmails[scenario as keyof typeof testEmails] || testEmails.new_lead;
    
    return await ctx.runAction(api.emailProcessor.processIncomingEmail, {
      ...emailData,
      messageId: `test-${Date.now()}`,
    });
  },
});