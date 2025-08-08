import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

//get the list of companies the user is a member of
export const getUserCompaniesList = query({
  args: {
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const membership = await ctx.db
      .query("member")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    const companies = await Promise.all(
      membership.map(async (member) => {
        const company = await ctx.db.get(member.company_id);
        return {
          ...member,
          company: company,
        };
      }),
    );

    if (args.isAdmin) {
      return companies.filter((company) => company.role === "ADMIN");
    }

    return companies;
  },
});

// You can write data to the database via a mutation:
export const createCompany = mutation({
  // Validators for arguments.
  args: {
    name: v.string(),
    email: v.string(),
    logo: v.optional(v.string()),
  },
  // Mutation implementation.
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    // check if company already exists name and email
    const existingCompany = await ctx.db
      .query("company")
      .filter((q) => q.eq(q.field("name"), args.name))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existingCompany) {
      throw new Error("Company already exists");
    }
    // create company
    const company = await ctx.db.insert("company", {
      name: args.name,
      email: args.email,
      logo: args.logo,
    });
    // create member for the user as admin
    await ctx.db.insert("member", {
      user_id: userId,
      company_id: company,
      role: "ADMIN",
    });
    return company;
  },
});

export const addMemberToCompany = mutation({
  args: {
    company_id: v.id("company"),
    email: v.string(),
    role: v.union(v.literal("USER"), v.literal("ADMIN")),
  },
  returns: v.object({
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin of the SPECIFIC company
    const member = await ctx.db
      .query("member")
      .withIndex("by_company_and_role", (q) =>
        q.eq("company_id", args.company_id).eq("role", "ADMIN"),
      )
      .filter((q) => q.eq(q.field("user_id"), userId))
      .first();
    if (!member) {
      throw new Error("User is not an admin of this company");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Check if company exists
    const company = await ctx.db.get(args.company_id);
    if (!company) {
      throw new Error("Company not found");
    }

    // Check if user is already a member of the company
    const existingMember = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", user._id).eq("company_id", args.company_id),
      )
      .first();

    if (existingMember) {
      throw new Error(
        `User is already a member of the company with role ${existingMember.role}`,
      );
    }

    // Create member
    await ctx.db.insert("member", {
      user_id: user._id,
      company_id: args.company_id,
      role: args.role,
    });

    return {
      message: "Member added to the company",
    };
  },
});

// Get current user's company information and role
export const getUserCompanyByCompanyId = query({
  args: {
    company_id: v.id("company"),
  },
  returns: v.union(
    v.object({
      company: v.object({
        _id: v.id("company"),
        name: v.string(),
        email: v.string(),
        logo: v.optional(v.string()),
        _creationTime: v.number(),
      }),
      userRole: v.union(v.literal("USER"), v.literal("ADMIN")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get user's membership
    const member = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();

    if (!member) {
      return null; // User is not a member of any company
    }

    // Get company details
    const company = await ctx.db.get(member.company_id);
    if (!company) {
      throw new Error("Company not found");
    }

    return {
      company,
      userRole: member.role,
    };
  },
});

// Get all members of a company (only accessible by company members)
export const getCompanyMembersList = query({
  args: { company_id: v.id("company") },
  returns: v.array(
    v.object({
      _id: v.id("member"),
      role: v.union(v.literal("USER"), v.literal("ADMIN")),
      _creationTime: v.number(),
      user: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if user is a member of this company
    const userMember = await ctx.db
      .query("member")
      .withIndex("by_user_and_company", (q) =>
        q.eq("user_id", userId).eq("company_id", args.company_id),
      )
      .first();

    if (!userMember) {
      throw new Error("User is not a member of this company");
    }

    // Get all members of the company
    const members = await ctx.db
      .query("member")
      .withIndex("by_company_id", (q) => q.eq("company_id", args.company_id))
      .collect();

    // Get user details for each member
    const membersWithUserData = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.user_id);
        return {
          _id: member._id,
          role: member.role,
          _creationTime: member._creationTime,
          user: {
            _id: user?._id || member.user_id,
            name: user?.name,
            email: user?.email,
            image: user?.image,
          },
        };
      }),
    );

    return membersWithUserData;
  },
});
