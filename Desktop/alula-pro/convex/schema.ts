import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
    role: v.optional(v.union(v.literal("consultant"), v.literal("admin"))),
    organizationId: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
  
  clients: defineTable({
    consultantId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    lastContactedAt: v.optional(v.number()),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_status", ["status"]),

  communications: defineTable({
    clientId: v.id("clients"),
    consultantId: v.string(),
    type: v.union(
      v.literal("email"),
      v.literal("phone"),
      v.literal("sms"),
      v.literal("in_person")
    ),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    subject: v.optional(v.string()),
    content: v.string(),
    urgencyScore: v.optional(v.number()),
    aiSummary: v.optional(v.string()),
    metadata: v.optional(v.object({
      from: v.optional(v.string()),
      to: v.optional(v.string()),
      cc: v.optional(v.string()),
      bcc: v.optional(v.string()),
      messageId: v.optional(v.string()),
      threadId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
    })),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("snoozed")
    ),
    snoozedUntil: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_consultant", ["consultantId"])
    .index("by_status", ["status"])
    .index("by_urgency", ["urgencyScore"]),

  actions: defineTable({
    consultantId: v.string(),
    clientId: v.optional(v.id("clients")),
    communicationId: v.optional(v.id("communications")),
    type: v.union(
      v.literal("client"),
      v.literal("business"),
      v.literal("lead"),
      v.literal("partner")
    ),
    title: v.string(),
    summary: v.string(),
    urgencyLevel: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("snoozed")
    ),
    snoozedUntil: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_status", ["status"])
    .index("by_urgency", ["urgencyLevel"])
    .index("by_client", ["clientId"]),

  notes: defineTable({
    clientId: v.id("clients"),
    consultantId: v.string(),
    communicationId: v.optional(v.id("communications")),
    type: v.union(v.literal("internal"), v.literal("client_facing")),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_consultant", ["consultantId"]),
  subscriptions: defineTable({
    userId: v.optional(v.string()),
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),
  webhookEvents: defineTable({
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
  })
    .index("type", ["type"])
    .index("polarEventId", ["polarEventId"]),

  gmailIntegrations: defineTable({
    userId: v.id("users"),
    email: v.string(),
    isActive: v.boolean(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiration: v.optional(v.number()),
    lastSync: v.optional(v.number()),
    historyId: v.optional(v.string()),
    watchExpiration: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  emailMappings: defineTable({
    gmailMessageId: v.string(),
    communicationId: v.id("communications"),
    processedAt: v.number(),
  })
    .index("by_gmail_id", ["gmailMessageId"]),

  timeEntries: defineTable({
    consultantId: v.string(),
    clientId: v.id("clients"),
    duration: v.number(), // in minutes
    description: v.string(),
    billable: v.boolean(),
    rate: v.optional(v.number()), // hourly rate
    relatedActionId: v.optional(v.id("actions")),
    relatedCommunicationId: v.optional(v.id("communications")),
    createdAt: v.number(),
  })
    .index("by_consultant", ["consultantId"])
    .index("by_client", ["clientId"])
    .index("by_billable", ["billable"])
    .index("by_date", ["createdAt"]),
});
