import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isMemberOfCompany } from "./lead_helper";

export const attachFormToLead = mutation({
  args: {
    form_name: v.string(),
    lead_id: v.id("lead"),
    company_id: v.id("company"),
    sendToNextStatus: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userID = await isMemberOfCompany(ctx, "ADMIN", args.company_id);
    if (!userID) {
      throw new Error("User is not a admin of the company");
    }

    //check if form already exists
    const existingForm = await ctx.db
      .query("qualification_form")
      .withIndex("by_valid_and_lead_id", (q) =>
        q.eq("valid", true).eq("lead_id", args.lead_id),
      )
      .collect();
    if (existingForm.length > 0 && existingForm[0].email_sent) {
      throw new Error(
        "Form already exists for this lead and email has been sent",
      );
    }

    if (existingForm.length > 0 && !existingForm[0].email_sent) {
      //update the form with the new form name
      await ctx.db.patch(existingForm[0]._id, {
        form_name: args.form_name,
      });

      //check if the status is ATTATCH_QUALIFIER
      const status = await ctx.db
        .query("status")
        .withIndex("by_lead_id", (q) => q.eq("lead_id", args.lead_id))
        .collect();

      if (
        !status.find((s) => s.status === "ATTATCH_QUALIFIER") &&
        args.sendToNextStatus
      ) {
        //create new status
        await ctx.db.insert("status", {
          name: "ATTATCH_QUALIFIER",
          lead_id: args.lead_id,
          status: "ATTATCH_QUALIFIER",
        });
      }

      if (
        args.sendToNextStatus &&
        !status.find((s) => s.status === "SEND_QUALIFIER")
      ) {
        //send to next status
        await ctx.db.insert("status", {
          name: "SEND_QUALIFIER",
          lead_id: args.lead_id,
          status: "SEND_QUALIFIER",
        });
      }

      return existingForm[0];
    }

    //attach form to lead
    const form = await ctx.db.insert("qualification_form", {
      form_name: args.form_name,
      lead_id: args.lead_id,
      response: {},
      edits: {},
      email_sent: false,
      response_received: false,
      valid: true,
    });

    //create new status
    await ctx.db.insert("status", {
      name: "ATTATCH_QUALIFIER",
      lead_id: args.lead_id,
      status: "ATTATCH_QUALIFIER",
    });

    if (args.sendToNextStatus) {
      //send to next status
      await ctx.db.insert("status", {
        name: "SEND_QUALIFIER",
        lead_id: args.lead_id,
        status: "SEND_QUALIFIER",
      });
    }

    return form;
  },
});

export const getForm = query({
  args: {
    form_id: v.id("qualification_form"),
  },

  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.form_id);
    if (!form) {
      throw new Error("Form not found");
    }

    //check if the form is valid
    if (!form.valid && !form.response_received) {
      throw new Error("Form is not valid");
    }

    return form;
  },
});

export const getFormByLeadIdAndCompanyId = query({
  args: {
    lead_id: v.id("lead"),
    company_id: v.id("company"),
  },
  handler: async (ctx, args) => {
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);
    return await ctx.db
      .query("qualification_form")
      .withIndex("by_lead_id", (q) => q.eq("lead_id", args.lead_id))
      .filter((q) => q.eq(q.field("valid"), true))
      .first();
  },
});

export const recordFormResponse = mutation({
  args: {
    form_id: v.id("qualification_form"),
    response: v.object({
      // Personal Details
      name: v.string(),
      phone: v.string(),
      role: v.string(),
      companyName: v.string(),

      // Project Details
      projectTitle: v.string(),
      location: v.string(),
      projectDescription: v.string(),

      // Project Type (exclude "PLEASE LIST DOWN THE PROJECT TYPE HERE")
      projectType: v.union(
        v.literal("houses"),
        v.literal("flats"),
        v.literal("mixed"),
        v.literal("mixed-commercial"),
        v.literal("commercial"),
      ),

      // Funding Security
      fundingSecured: v.union(
        v.literal("applied-for"),
        v.literal("indicative-terms-issued"),
        v.literal("approved"),
        v.literal("other"), // For freeform text
      ),
      lenderName: v.optional(v.string()),

      // Planning Permission
      planningGranted: v.union(v.literal("yes"), v.literal("no")),
      planningGrantedDate: v.optional(v.string()),
      approvalStatus: v.union(
        v.literal("pre-planning"),
        v.literal("application-submitted"),
        v.literal("planning-granted"),
        v.literal("conditions-discharged"),
      ),

      // Project Drawings
      architecturePlans: v.union(
        v.literal("none"),
        v.literal("planning-drawings"),
        v.literal("floor-plans-elevations"),
        v.literal("full-construction-drawings"),
      ),

      // Project Timeline
      timeline: v.union(
        v.literal("asap"),
        v.literal("1-3months"),
        v.literal("3-6months"),
        v.literal("6-12months"),
        v.literal("over-12months"),
        v.literal("flexible"),
      ),

      // Additional Info
      additionalInfo: v.optional(v.string()),

      // Services Required
      services: v.array(
        v.union(
          v.literal("panel-supply-install"),
          v.literal("project-management"),
          v.literal("main-contracting"),
          v.literal("funding"),
          v.literal("other"),
        ),
      ),

      services_other: v.optional(v.string()),

      // File Uploads (optional)
      files: v.optional(
        v.array(
          v.object({
            name: v.string(),
            link: v.string(),
            size: v.optional(v.number()),
            type: v.optional(v.string()),
          }),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.form_id);
    if (!form) {
      throw new Error("Form not found");
    }

    if (form.response_received) {
      throw new Error("Form already has a response");
    }

    try {
      const updatedForm = await ctx.db.patch(args.form_id, {
        response: args.response,
        response_received: true,
      });
      return {
        success: true,
        updatedForm,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: "Failed to record form response",
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const getFormByLeadId = query({
  args: {
    lead_id: v.id("lead"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("qualification_form")
      .withIndex("by_lead_id", (q) => q.eq("lead_id", args.lead_id))
      .first();
  },
});

//update lead with email sent
export const updateFormWithEmailSent = mutation({
  args: {
    form_id: v.id("qualification_form"),
    company_id: v.id("company"),
    is_email_sent: v.boolean(),
  },
  handler: async (ctx, args) => {
    //check if the user is member of the company
    await isMemberOfCompany(ctx, "MEMBER", args.company_id);

    //update form with email sent
    const updatedForm = await ctx.db.patch(args.form_id, {
      email_sent: args.is_email_sent,
    });

    return updatedForm;
  },
});
