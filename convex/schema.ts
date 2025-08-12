import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  estimate,
  estimate_components,
  estimate_installation,
  estimate_cost_plan,
  estimate_final,
  estimate_calculations,
  estimate_override_edits,
  cost_lookup,
} from "./schema/estimation_schema";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.

const company = defineTable({
  name: v.string(),
  email: v.string(),
  logo: v.optional(v.string()), // optional
})
  // Quickly look up a company by its unique email address.
  .index("by_email", ["email"]);

const roleValidator = v.union(v.literal("USER"), v.literal("ADMIN"));

// --------------------------------------------------------------------------------------------

const member = defineTable({
  user_id: v.id("users"),
  company_id: v.id("company"),
  role: roleValidator,
})
  .index("by_user_id", ["user_id"])
  .index("by_company_id", ["company_id"])
  .index("by_user_and_company", ["user_id", "company_id"])
  .index("by_company_and_role", ["company_id", "role"]);

const lead = defineTable({
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  valid: v.boolean(),
  lead_source_id: v.optional(v.id("lead_source")),
  company_id: v.id("company"),
  invalid_detail: v.optional(v.id("invalid_detail")), // optional
})
  // Fetch all leads that belong to a specific company.
  .index("by_company_id", ["company_id"])
  // Find a lead by its email address.
  .index("by_email", ["email"])
  // Common pattern: query valid leads for a company.
  .index("by_valid_and_company_id", ["valid", "company_id"]);

// --------------------------------------------------------------------------------------------

export const userTypeValidator = v.union(
  v.literal("BD"),
  v.literal("ESTIMATOR"),
  v.literal("SUPERVISOR"),
);

const team_assignment = defineTable({
  lead_id: v.id("lead"),
  user_id: v.id("users"),
  type: userTypeValidator,
  assigned_by: v.id("users"),
  valid: v.boolean(),
  invalid_detail: v.optional(v.id("invalid_detail")), // optional
})
  // All assignments for a given lead.
  .index("by_lead_id_and_valid", ["lead_id", "valid"])
  // All assignments for a given user (assignee).
  .index("by_user_id", ["user_id"])
  // All assignments created by a particular user.
  .index("by_assigned_by", ["assigned_by"])
  // Quickly filter valid assignments within a lead.
  .index("by_valid_and_lead_id", ["valid", "lead_id"]);

// --------------------------------------------------------------------------------------------

const lead_source = defineTable({
  name: v.string(),
  description: v.string(),
  valid: v.boolean(),
  company_id: v.id("company"),
})
  // Enable filtering lead sources by validity (e.g., active lists).
  .index("by_valid", ["valid"])
  .index("by_company_id_and_valid", ["company_id", "valid"]);

// --------------------------------------------------------------------------------------------

export const statusTypeValidator = v.union(
  v.literal("CREATE_LEAD"),
  v.literal("BUILD_TEAM"),
  v.literal("ATTATCH_QUALIFIER"),
  v.literal("SEND_QUALIFIER"),
  v.literal("AWAIT_RESPONSE"),
  v.literal("QUALIFIER_RECEIVED"),
  v.literal("QUALIFIER_IN_REVIEW"),
  v.literal("QUALIFIER_APPROVED"),
  v.literal("QUALIFIER_REJECTED"),
  v.literal("SENT_FOR_ESTIMATE"),
  v.literal("ESTIMATE_RECEIVED"),
  v.literal("ESTIMATE_IN_REVIEW"),
  v.literal("ESTIMATE_APPROVED"),
  v.literal("ESTIMATE_REJECTED"),
  v.literal("SEND_ESTIMATE"),
  v.literal("AWAIT_ESTIMATE_RESPONSE"),
  v.literal("ESTIMATE_RESPONSE_RECEIVED"),
  v.literal("ESTIMATE_RESPONSE_IN_REVIEW"),
  v.literal("ESTIMATE_RESPONSE_APPROVED"),
  v.literal("ESTIMATE_RESPONSE_REJECTED"),
);

const status = defineTable({
  name: v.string(),
  lead_id: v.id("lead"),
  status: statusTypeValidator,
  invalid_detail: v.optional(v.id("invalid_detail")), // optional
})
  // Retrieve status rows for a lead.
  .index("by_lead_id", ["lead_id"])
  // Query by status name within a lead (compound index).
  .index("by_status_and_lead_id", ["status", "lead_id"]);

// --------------------------------------------------------------------------------------------

const qualification_form = defineTable({
  form_name: v.string(),
  lead_id: v.id("lead"),
  response: v.union(
    v.object({
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
    v.object({}),
  ),

  edits: v.union(
    v.array(
      v.object({
        _v: v.number(),
        label: v.string(),
        old_value: v.string(),
        new_value: v.string(),
        edited_by: v.id("users"),
        edited_at: v.number(),
      }),
    ),
    v.object({}),
  ),
  email_sent: v.boolean(),
  response_received: v.boolean(),
  valid: v.boolean(),
  invalid_detail: v.optional(v.id("invalid_detail")), // optional
})
  // Retrieve qualification forms for a specific lead.
  .index("by_lead_id", ["lead_id"])
  // Filter valid forms per lead.
  .index("by_valid_and_lead_id", ["valid", "lead_id"]);

// --------------------------------------------------------------------------------------------

const invalid_detail = defineTable({
  invalidated_by: v.id("users"),
  invalidated_note: v.string(), // optional
});

// --------------------------------------------------------------------------------------------

const note = defineTable({
  lead_id: v.id("lead"),
  artifact_id: v.string(),
  artifact_type: v.string(),
  note: v.string(),
  created_by: v.id("users"),
})
  // Fetch all notes for a given artifact (lead, etc.).
  .index("by_artifact_id", ["artifact_id"])
  // Allow filtering notes by (type, id) compound key.
  .index("by_artifact_type_and_id", ["artifact_type", "artifact_id"]);

// --------------------------------------------------------------------------------------------

export default defineSchema({
  ...authTables,
  invalid_detail,
  company,
  member,
  lead,
  team_assignment,
  lead_source,
  status,
  qualification_form,
  note,
  // Estimation system tables
  estimate,
  estimate_components,
  estimate_installation,
  estimate_cost_plan,
  estimate_final,
  estimate_calculations,
  estimate_override_edits,
  cost_lookup,
});
