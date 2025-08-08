import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { isMemberOfCompany } from "./lead_helper";

//create new lead
export const createNewLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    company_id: v.id("company"),
    lead_source_id: v.optional(v.id("lead_source")),
    build_team: v.boolean(),
  },
  handler: async (ctx, args) => {
    //check if the user is admin of the company
    await isMemberOfCompany(ctx, "ADMIN", args.company_id);

    const lead = await ctx.db.insert("lead", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company_id: args.company_id,
      lead_source_id: args.lead_source_id,
      valid: true,
    });

    //create new status
    await ctx.db.insert("status", {
      name: "CREATE_LEAD",
      lead_id: lead,
      status: "CREATE_LEAD",
    });

    if (args.build_team) {
      //create new status
      await ctx.db.insert("status", {
        name: "BUILD_TEAM",
        lead_id: lead,
        status: "BUILD_TEAM",
      });
    }

    return lead;
  },
});

export const createNewLeadSource = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    //check if the user is member of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);

    //create new lead source
    const leadSource = await ctx.db.insert("lead_source", {
      name: args.name,
      description: args.description,
      company_id: args.company_id,
      valid: true,
    });
    return leadSource;
  },
});

export const getLeadSources = query({
  args: {
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    //check if the user is member of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);

    const leadSources = await ctx.db
      .query("lead_source")
      .withIndex("by_company_id_and_valid", (q) =>
        q.eq("company_id", args.company_id).eq("valid", true),
      )
      .collect();
    return leadSources;
  },
});

//get lead by id
export const getLeadById = query({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
    with_status_history: v.optional(v.boolean()),
    with_team: v.optional(v.boolean()),
    with_source: v.optional(v.boolean()),
    with_notes: v.optional(v.boolean()),
  },
  returns: v.object({
    lead: v.object({
      _id: v.id("lead"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      valid: v.boolean(),
      lead_source_id: v.optional(v.id("lead_source")),
      company_id: v.id("company"),
      invalid_detail: v.optional(v.id("invalid_detail")),
    }),
    status_history: v.optional(v.array(v.any())),
    team: v.optional(v.array(v.any())),
    source: v.optional(v.array(v.any())),
    notes: v.optional(
      v.array(
        v.object({
          _id: v.id("note"),
          _creationTime: v.number(),
          lead_id: v.id("lead"),
          artifact_id: v.string(),
          artifact_type: v.string(),
          note: v.string(),
          created_by: v.id("users"),
          author: v.object({
            name: v.string(),
            role: v.string(),
            _id: v.id("users"),
          }),
        }),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    //check if the user is member of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);
    let status_history = undefined;
    let team = undefined;
    let source = undefined;
    let notes = undefined;
    //get lead by id
    const lead = await ctx.db.get(args.lead_id);
    if (!lead) {
      throw new Error("Lead_not_found");
    }
    if (lead.company_id !== args.company_id) {
      throw new Error("Lead_not_belongs_to_company");
    }
    if (args.with_status_history) {
      const statusHistory = await ctx.db
        .query("status")
        .withIndex("by_lead_id", (q) => q.eq("lead_id", args.lead_id))
        .order("desc")
        .collect();
      status_history = statusHistory;
    }
    if (args.with_team) {
      team = await ctx.db
        .query("team_assignment")
        .withIndex("by_valid_and_lead_id", (q) =>
          q.eq("valid", true).eq("lead_id", args.lead_id),
        )
        .collect();
    }
    if (args.with_source) {
      source = await ctx.db
        .query("lead_source")
        .withIndex("by_company_id_and_valid", (q) =>
          q.eq("company_id", args.company_id).eq("valid", true),
        )
        .collect();
    }
    if (args.with_notes) {
      const rawNotes = await ctx.db
        .query("note")
        .withIndex("by_artifact_type_and_id", (q) =>
          q.eq("artifact_type", "lead").eq("artifact_id", args.lead_id),
        )
        .collect();

      // Fetch user details for each note author
      notes = await Promise.all(
        rawNotes.map(async (note) => {
          const author = await ctx.db.get(note.created_by);
          // Get user's role in this company from team_assignment
          const teamAssignment = await ctx.db
            .query("team_assignment")
            .withIndex("by_user_id", (q) => q.eq("user_id", note.created_by))
            .filter((q) => q.eq(q.field("valid"), true))
            .first();

          return {
            ...note,
            author: {
              name: author?.name || "Unknown User",
              role: teamAssignment?.type || "USER",
              _id: note.created_by,
            },
          };
        }),
      );
    }
    return {
      lead,
      status_history:
        status_history || (args.with_status_history ? [] : undefined),
      team: team || (args.with_team ? [] : undefined),
      source: source || (args.with_source ? [] : undefined),
      notes: notes || (args.with_notes ? [] : undefined),
    };
  },
});

//get all leads for a company with latest status
export const getLeadsByCompany = query({
  args: {
    company_id: v.id("company"),
    with_status: v.optional(v.boolean()),
    with_source: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("lead"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      valid: v.boolean(),
      lead_source_name: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    //check if the user is member of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);

    //get all valid leads for the company
    const leads = await ctx.db
      .query("lead")
      .withIndex("by_valid_and_company_id", (q) =>
        q.eq("valid", true).eq("company_id", args.company_id),
      )
      .collect();

    //get lead source information for each lead
    const leadsWithSourcesStatus = await Promise.all(
      leads.map(async (lead) => {
        let lead_source_name = undefined;
        let status = undefined;

        if (lead.lead_source_id && args.with_source) {
          const leadSource = await ctx.db.get(lead.lead_source_id);
          lead_source_name = leadSource?.name;
        }

        //get latest status for the lead
        if (args.with_status) {
          const latestStatus = await ctx.db
            .query("status")
            .withIndex("by_lead_id", (q) => q.eq("lead_id", lead._id))
            .order("desc")
            .first();
          status = latestStatus?.status;
        }

        return {
          _id: lead._id,
          _creationTime: lead._creationTime,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          valid: lead.valid,
          lead_source_name,
          status,
        };
      }),
    );

    return leadsWithSourcesStatus;
  },
});
