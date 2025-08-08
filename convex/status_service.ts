import { v } from "convex/values";
import { statusTypeValidator } from "./schema";
import { mutation } from "./_generated/server";

export const registerStatus = mutation({
  args: {
    lead_id: v.id("lead"),
    statusName: statusTypeValidator,
    patch: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    //check if the status already exists
    const status = await ctx.db
      .query("status")
      .withIndex("by_lead_id", (q) => q.eq("lead_id", args.lead_id))
      .filter((q) => q.eq(q.field("status"), args.statusName))
      .first();

    if (!status && !args.patch) {
      throw new Error("Status not found");
    }
    if (status && !args.patch) {
      throw new Error("Status already exists");
    }

    if (!status && args.patch) {
      const status = await ctx.db.insert("status", {
        name: args.statusName,
        lead_id: args.lead_id,
        status: args.statusName,
      });
      return status;
    }

    return status;
  },
});
