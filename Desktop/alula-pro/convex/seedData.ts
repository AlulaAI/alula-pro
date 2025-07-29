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
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
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
      communications: 3,
      actions: 3
    };
  },
});