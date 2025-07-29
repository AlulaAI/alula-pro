import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const seedTestData = mutation({
  handler: async (ctx) => {
    console.log("seedTestData called");
    
    const user = await getCurrentUser(ctx);
    console.log("Current user:", user);
    
    if (!user) {
      throw new Error("No user found. Please log in first.");
    }

    // Clear existing data first (optional - comment out if you want to preserve existing data)
    const existingActions = await ctx.db
      .query("actions")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .collect();
    
    for (const action of existingActions) {
      await ctx.db.delete(action._id);
    }

    const existingCommunications = await ctx.db
      .query("communications")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .collect();
    
    for (const comm of existingCommunications) {
      await ctx.db.delete(comm._id);
    }

    const existingClients = await ctx.db
      .query("clients")
      .withIndex("by_consultant", (q) => q.eq("consultantId", user._id))
      .collect();

    for (const client of existingClients) {
      await ctx.db.delete(client._id);
    }

    console.log("Cleared existing data");

    // Create test clients
    const client1 = await ctx.db.insert("clients", {
      consultantId: user._id,
      name: "Margaret Johnson",
      email: "family@example.com",
      phone: "(555) 123-4567",
      address: "123 Oak Street, Springfield",
      status: "active",
      createdAt: Date.now() - 3 * 365 * 24 * 60 * 60 * 1000, // 3 years ago
      lastContactedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    });

    const client2 = await ctx.db.insert("clients", {
      consultantId: user._id,
      name: "Robert Smith",
      email: "rsmith@example.com",
      phone: "(555) 987-6543",
      status: "active",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    });

    // Create test communications
    const comm1 = await ctx.db.insert("communications", {
      clientId: client1,
      consultantId: user._id,
      type: "phone",
      direction: "inbound",
      subject: "Concerns about Mom's medication",
      content: "The family called to express concerns about Margaret's new medication. She seems more confused than usual and has been experiencing dizziness. They want to know if this is a normal side effect or if they should contact her doctor immediately.",
      urgencyScore: 85,
      aiSummary: "Family reports increased confusion and dizziness after new medication - urgent medical consultation may be needed",
      metadata: {
        phoneNumber: "(555) 123-4567",
        from: "Margaret's daughter Sarah",
      },
      status: "active",
      createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    });

    const comm2 = await ctx.db.insert("communications", {
      clientId: client1,
      consultantId: user._id,
      type: "email",
      direction: "inbound",
      subject: "Follow-up on care plan",
      content: "Thank you for the updated care plan. We've implemented the suggested daily routine and Margaret seems to be responding well. Can we schedule a follow-up call next week to discuss progress?",
      urgencyScore: 40,
      aiSummary: "Positive update on care plan implementation - routine follow-up requested",
      metadata: {
        from: "sarah.johnson@example.com",
        to: "consultant@alulacare.com, familycare@alulacare.com",
        cc: "brother.mike@example.com",
        messageId: "msg-12345",
        threadId: "thread-12345",
      },
      status: "active",
      createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    });

    const comm3 = await ctx.db.insert("communications", {
      clientId: client2,
      consultantId: user._id,
      type: "in_person",
      direction: "outbound",
      subject: "Monthly check-in visit",
      content: "Visited Robert at home. He appears to be managing well with current support. Noted some clutter accumulation in living areas. Discussed meal prep services and he's interested in trying them.",
      urgencyScore: 30,
      aiSummary: "Routine visit - client stable, interested in meal prep services",
      metadata: {
        from: "Consultant Name",
      },
      status: "active",
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    });

    // Create extensive history for Margaret Johnson
    const margaretHistory = [
      {
        type: "email" as const,
        direction: "inbound" as const,
        subject: "Mom had a fall yesterday",
        content: "Hi, I wanted to let you know Mom had a minor fall yesterday evening. She's okay, but we took her to the ER just to be safe. They did x-rays and nothing is broken. She's back home now but seems a bit shaken up. The doctor suggested we review her mobility aids.",
        metadata: {
          from: "sarah.johnson@example.com",
          to: "consultant@alulacare.com",
        },
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
      },
      {
        type: "phone" as const,
        direction: "outbound" as const,
        subject: "Follow-up on fall incident",
        content: "Called family to check on Margaret after fall. Discussed installing grab bars in bathroom and getting a medical alert device. Family is on board with both suggestions. Will coordinate with home modification contractor.",
        metadata: {
          phoneNumber: "(555) 123-4567",
          from: "Consultant",
        },
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
      },
      {
        type: "in_person" as const,
        direction: "outbound" as const,
        subject: "Internal Note: Margaret's cognitive assessment",
        content: "During today's visit, noticed Margaret repeated the same story three times within 30 minutes. She also couldn't remember what she had for breakfast. Family hasn't mentioned increased confusion, but this seems to be progressing. Will monitor closely and may need to suggest formal cognitive evaluation.",
        metadata: {
          from: "Consultant",
        },
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 2 weeks ago
      },
      {
        type: "email" as const,
        direction: "outbound" as const,
        subject: "Monthly Update - Margaret Johnson",
        content: "Dear Sarah and family,\n\nHere's our monthly update on Margaret's care:\n\nPositives:\n- Medication compliance has been excellent with the new pill organizer\n- She's enjoying the adult day program on Tuesdays and Thursdays\n- Appetite has improved with the meal delivery service\n\nAreas of attention:\n- Some increased confusion in the evenings (sundowning)\n- Resistance to bathing - we've adjusted the schedule to mornings when she's more cooperative\n- Need to schedule follow-up with Dr. Martinez for medication review\n\nRecommendations for next month:\n- Consider increasing day program to 3 days per week\n- Install additional lighting in hallways for evening hours\n- Schedule dental check-up (it's been 8 months)\n\nPlease let me know if you have any questions.\n\nBest regards",
        metadata: {
          from: "consultant@alulacare.com",
          to: "sarah.johnson@example.com, mike.johnson@example.com",
        },
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 1 month ago
      },
      {
        type: "in_person" as const,
        direction: "outbound" as const,
        subject: "Quarterly care plan review with family",
        content: "Met with Sarah, Mike, and their sister Patricia for quarterly review. Discussed:\n1. Margaret's progression - mild cognitive impairment advancing\n2. Updated POA documents\n3. Future care options including memory care facilities\n4. Respite care for family caregivers\n5. Financial planning for long-term care\n\nFamily is united in keeping Margaret at home as long as safely possible. Will increase support services.",
        metadata: {
          from: "Consultant",
        },
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 3 months ago
      },
      {
        type: "phone" as const,
        direction: "inbound" as const,
        subject: "Mom refused to let aide in today",
        content: "Margaret wouldn't let the home health aide in this morning. She said she didn't know who they were and didn't need help. The aide called us and we had to leave work to go over. This is the third time this month. We're getting worried about her safety when she's alone.",
        metadata: {
          phoneNumber: "(555) 123-4567",
          from: "Mike Johnson",
        },
        createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000, // 4 months ago
      },
      {
        type: "email" as const,
        direction: "inbound" as const,
        subject: "Thank you for the birthday surprise!",
        content: "The whole family wanted to thank you for organizing the surprise birthday party for Mom's 82nd! She was so happy and talked about it for days. The photo album you helped us create was perfect - she loves looking through it. You've been such a blessing to our family.",
        metadata: {
          from: "sarah.johnson@example.com",
          to: "consultant@alulacare.com",
        },
        createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000, // 6 months ago
      },
      {
        type: "in_person" as const,
        direction: "outbound" as const,
        subject: "Internal Note: Family dynamics observation",
        content: "Noticed some tension between siblings during visit. Sarah (primary caregiver) seems burned out and frustrated that Mike and Patricia don't help more. Mike defensive about work commitments. Patricia lives out of state but offers financial support. May need to facilitate family meeting to discuss caregiver responsibilities and respite options.",
        metadata: {
          from: "Consultant",
        },
        createdAt: Date.now() - 240 * 24 * 60 * 60 * 1000, // 8 months ago
      },
      {
        type: "email" as const,
        direction: "outbound" as const,
        subject: "Successfully coordinated Mom's cataract surgery",
        content: "Just wanted to update you that Mom's cataract surgery went well today. The doctor said everything looks good. She'll need eye drops 3x daily for two weeks. I've updated her medication chart and instructed the home health aide. Follow-up appointment is scheduled for next Tuesday at 2 PM.",
        metadata: {
          from: "consultant@alulacare.com",
          to: "sarah.johnson@example.com, mike.johnson@example.com, patricia.j.williams@example.com",
        },
        createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
      },
      {
        type: "phone" as const,
        direction: "inbound" as const,
        subject: "First call - need help with Mom",
        content: "Initial consultation call from Sarah Johnson. Her mother Margaret (79 at the time) recently diagnosed with mild cognitive impairment. Family overwhelmed and needs guidance on care options, safety modifications, and navigating healthcare system. Scheduled initial assessment visit.",
        metadata: {
          phoneNumber: "(555) 123-4567",
          from: "Sarah Johnson",
        },
        createdAt: Date.now() - 3 * 365 * 24 * 60 * 60 * 1000, // 3 years ago
      },
    ];

    // Insert all historical communications
    for (const comm of margaretHistory) {
      await ctx.db.insert("communications", {
        clientId: client1,
        consultantId: user._id,
        type: comm.type,
        direction: comm.direction,
        subject: comm.subject,
        content: comm.content,
        metadata: comm.metadata,
        status: "active",
        createdAt: comm.createdAt,
      });
    }

    // Create test actions
    await ctx.db.insert("actions", {
      consultantId: user._id,
      clientId: client1,
      communicationId: comm1,
      type: "client",
      title: "Urgent: Medication side effects for Margaret",
      summary: "Family reports increased confusion and dizziness. Need to coordinate with doctor and possibly adjust medication.",
      urgencyLevel: "high",
      status: "active",
      dueDate: Date.now() + 4 * 60 * 60 * 1000, // Due in 4 hours
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
      updatedAt: Date.now() - 2 * 60 * 60 * 1000,
    });

    await ctx.db.insert("actions", {
      consultantId: user._id,
      clientId: client2,
      type: "client",
      title: "Set up meal prep service for Robert",
      summary: "Follow up on Robert's interest in meal prep services. Research options and send recommendations.",
      urgencyLevel: "medium",
      status: "active",
      dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // Due in 2 days
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("actions", {
      consultantId: user._id,
      type: "business",
      title: "Complete quarterly client reviews",
      summary: "Review all active client care plans and prepare quarterly reports for families.",
      urgencyLevel: "low",
      status: "active",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // Due in 1 week
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    });

    return { 
      message: "Test data created successfully",
      clients: 2,
      communications: 13, // 3 original + 10 Margaret history
      actions: 3
    };
  },
});