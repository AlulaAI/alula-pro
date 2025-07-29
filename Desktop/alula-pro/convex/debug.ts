import { query } from "./_generated/server";

export const checkAuth = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("Identity from auth:", identity);
    
    if (!identity) {
      return { authenticated: false, message: "No identity found" };
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    
    console.log("User from database:", user);
    
    return {
      authenticated: true,
      identity: {
        subject: identity.subject,
        name: identity.name,
        email: identity.email
      },
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email
      } : null
    };
  },
});