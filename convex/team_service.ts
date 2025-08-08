import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { userTypeValidator } from "./schema";
//team assignment
export const createTeamAssignment = mutation({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
    user_id: v.id("users"),
    type: userTypeValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User_id_not_authenticated");
    }
    //check if the user is admin of the company
    const isAdmin = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();
    if (!isAdmin) {
      throw new Error("User_id_not_member_of_company");
    }
    if (isAdmin?.role !== "ADMIN") {
      throw new Error("User_id_not_admin_of_company");
    }

    const result = await ctx.db.insert("team_assignment", {
      lead_id: args.lead_id,
      user_id: args.user_id,
      type: args.type,
      assigned_by: userId,
      valid: true,
    });
    if (!result) {
      throw new Error("Failed to create team assignment");
    }
    return result;
  },
});

//get lead team members
export const getLeadTeamMembers = query({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User_id_not_authenticated");
    }
    //check if the user is admin of the company
    const isAdmin = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();
    if (!isAdmin) {
      throw new Error("User_id_not_member_of_company");
    }

    const teamMembers = await ctx.db
      .query("team_assignment")
      .withIndex("by_lead_id_and_valid", (q) =>
        q.eq("lead_id", args.lead_id).eq("valid", true),
      )
      .collect();

    const teamMembersWithUserDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const userDetails = await ctx.db
          .query("users")
          .withIndex("by_id", (q) => q.eq("_id", member.user_id))
          .first();
        return { ...member, user: userDetails };
      }),
    );
    return teamMembersWithUserDetails;
  },
});

//remove team member
export const removeTeamMember = mutation({
  args: {
    team_assignment_id: v.id("team_assignment"),
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User_id_not_authenticated");
    }
    //check if the user is admin of the company
    const isAdmin = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();
    if (!isAdmin) {
      throw new Error("User_id_not_member_of_company");
    }
    if (isAdmin?.role !== "ADMIN") {
      throw new Error("User_id_not_admin_of_company");
    }
    await ctx.db.patch(args.team_assignment_id, {
      valid: false,
    });
    return true;
  },
});

//update status to attach qualifier after team is assigned
export const updateStatusToAttachQualifier = mutation({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User_id_not_authenticated");
    }
    //check if the user is admin of the company
    const isAdmin = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();
    if (!isAdmin) {
      throw new Error("User_id_not_member_of_company");
    }
    const result = await ctx.db.insert("status", {
      lead_id: args.lead_id,
      status: "ATTATCH_QUALIFIER",
      name: "ATTATCH_QUALIFIER",
    });
    if (!result) {
      throw new Error("Failed to update status to attach qualifier");
    }
    return result;
  },
});
