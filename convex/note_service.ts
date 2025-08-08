import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { isMemberOfCompany } from "./lead_helper";
import { getAuthUserId } from "@convex-dev/auth/server";

//create new note
export const createNewNote = mutation({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
    artifact_id: v.string(),
    artifact_type: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    //check if the user is admin of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User_id_not_authenticated");
    }
    const note = await ctx.db.insert("note", {
      lead_id: args.lead_id,
      artifact_id: args.artifact_id,
      artifact_type: args.artifact_type,
      note: args.note,
      created_by: userId,
    });
    return note;
  },
});
