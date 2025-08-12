import { defineTable } from "convex/server";
import { v } from "convex/values";

// House type enum for components workflow
export const houseTypeValidator = v.union(
  v.literal("TYPE_A"),
  v.literal("TYPE_B"),
  v.literal("TYPE_C"),
  v.literal("TYPE_D"),
  v.literal("TYPE_E"),
  v.literal("TYPE_F"),
  v.literal("TYPE_G"),
);

// Quality level enum
export const qualityValidator = v.union(
  v.literal("PREMIUM"),
  v.literal("STANDARD"),
  v.literal("BUDGET"),
);

// Estimation status enum
export const estimateStatusValidator = v.union(
  v.literal("DRAFT"),
  v.literal("IN_PROGRESS"),
  v.literal("SUBMITTED"),
  v.literal("APPROVED"),
  v.literal("REJECTED"),
);

// Workflow step enum for audit trail
export const workflowStepValidator = v.union(
  v.literal("COMPONENTS"),
  v.literal("INSTALLATION"),
  v.literal("COST_PLAN"),
  v.literal("FINAL"),
);

// Main estimation table - links to existing lead system
export const estimate = defineTable({
  lead_id: v.id("lead"),
  project_name: v.optional(v.string()),
  date_created: v.optional(v.number()),
  project_duration: v.optional(v.number()), // Calculated field
  status: v.optional(estimateStatusValidator),
  version: v.number(), // Default to 1, increment for new versions
  created_by: v.id("users"),
  company_id: v.id("company"),
  valid: v.boolean(),
  invalid_detail: v.optional(v.id("invalid_detail")),
})
  .index("by_lead_id", ["lead_id"])
  .index("by_company_id", ["company_id"])
  .index("by_valid_and_lead_id", ["valid", "lead_id"])
  .index("by_created_by", ["created_by"])
  .index("by_status", ["status"])
  .index("by_lead_and_version", ["lead_id", "version"]);

// Workflow 1: Components estimation
export const estimate_components = defineTable({
  estimate_id: v.id("estimate"),

  // House Type Selection (only 1 allowed)
  house_type: v.optional(houseTypeValidator),
  house_count: v.optional(v.number()),

  // Quality Selection
  quality: v.optional(qualityValidator),

  // Measurements/Totals - all optional for partial data entry
  gia: v.optional(v.number()), // Gross Internal Area
  external_walls: v.optional(v.number()),
  upper_gables: v.optional(v.number()),
  internal_bearing_walls: v.optional(v.number()),
  internal_partition_walls: v.optional(v.number()),
  floor_cassettes: v.optional(v.number()),
  roof_cassettes: v.optional(v.number()),
  ceiling_cassettes: v.optional(v.number()),
  stair_cases: v.optional(v.number()),
  windows_external_doors: v.optional(v.number()),
  internal_doors: v.optional(v.number()),

  // Cost calculations (user editable with validation)
  total_cost: v.optional(v.number()),
  total_per_m2: v.optional(v.number()),

  // Metadata
  last_updated: v.optional(v.number()),
  updated_by: v.optional(v.id("users")),
})
  .index("by_estimate_id", ["estimate_id"])
  .index("by_house_type", ["house_type"])
  .index("by_quality", ["quality"]);

// Workflow 2: Installation estimation
export const estimate_installation = defineTable({
  estimate_id: v.id("estimate"),

  // Team Configuration
  units_count: v.optional(v.number()),
  days_per_unit: v.optional(v.number()),
  total_days: v.optional(v.number()), // Calculated: units * days_per_unit

  // Staff Assignments
  site_supervisor_count: v.optional(v.number()),
  installer_sr_count: v.optional(v.number()),
  installer_jr_count: v.optional(v.number()),
  occasional_la_count: v.optional(v.number()),

  // Staff Total Days (calculated)
  site_supervisor_total_days: v.optional(v.number()),
  installer_sr_total_days: v.optional(v.number()),
  installer_jr_total_days: v.optional(v.number()),
  occasional_la_total_days: v.optional(v.number()),

  // Additional Costs
  accommodation_days: v.optional(v.number()), // Same as total_days
  travel_cost: v.optional(v.number()),
  contingency_percentage: v.optional(v.number()),
  contingency_amount: v.optional(v.number()), // Calculated

  // Team Total
  total_team_cost: v.optional(v.number()),
  team_cost_per_m2: v.optional(v.number()),

  // Delivery & Transport
  transport_miles: v.optional(v.number()),
  cost_per_mile: v.optional(v.number()),
  number_of_trucks: v.optional(v.number()), // ~25 sqm capacity per truck
  total_truck_cost: v.optional(v.number()), // miles * truck_count * cost_per_mile

  // Crane & Operator
  crane_days: v.optional(v.number()),
  crane_cost_per_day: v.optional(v.number()),
  total_crane_cost: v.optional(v.number()), // days * cost_per_day

  // Metadata
  last_updated: v.optional(v.number()),
  updated_by: v.optional(v.id("users")),
}).index("by_estimate_id", ["estimate_id"]);

// Workflow 3: Cost Plan Summary
export const estimate_cost_plan = defineTable({
  estimate_id: v.id("estimate"),

  // Components (from Workflow 1)
  components_subtotal: v.optional(v.number()),

  // Other Components
  other_components: v.optional(v.number()),

  // Risk & FX
  risk_fx_percentage: v.optional(v.number()),
  risk_fx_amount: v.optional(v.number()), // Calculated

  // Margin on Product
  margin_percentage: v.optional(v.number()),
  margin_amount: v.optional(v.number()), // Calculated

  // Components Total
  components_total: v.optional(v.number()), // subtotal + risk_fx + margin

  // Extras
  extras_stair_cases: v.optional(v.number()),
  extras_windows_doors: v.optional(v.number()),
  extras_internal_doors: v.optional(v.number()),
  site_management_rate: v.optional(v.number()),
  site_management_total: v.optional(v.number()), // rate * total_days
  transport_total: v.optional(v.number()), // From installation workflow

  // Sub Total Components
  sub_total_components: v.optional(v.number()),

  // Abnormals
  abnormals_percentage: v.optional(v.number()),
  abnormals_amount: v.optional(v.number()), // percentage * sub_total_components

  // Final Components Total
  final_components_total: v.optional(v.number()), // sub_total + abnormals

  // Installation & Delivery
  installation_total: v.optional(v.number()), // From installation workflow
  crane_operator_total: v.optional(v.number()), // From installation workflow

  // Super Structure Construction Costs
  super_structure_total: v.optional(v.number()), // Sum of all above

  // Metadata
  last_updated: v.optional(v.number()),
  updated_by: v.optional(v.id("users")),
}).index("by_estimate_id", ["estimate_id"]);

// Workflow 4: Final Estimate Sheet
export const estimate_final = defineTable({
  estimate_id: v.id("estimate"),

  // Building Components
  building_components_total: v.optional(v.number()), // From cost_plan

  // Additional Supplied Items
  additional_stairs: v.optional(v.number()),
  additional_windows: v.optional(v.number()),
  additional_internal_doors: v.optional(v.number()),
  additional_transport: v.optional(v.number()),
  additional_site_management: v.optional(v.number()),
  additional_abnormals: v.optional(v.number()),

  // Installation
  final_installation: v.optional(v.number()),
  final_crane_operator: v.optional(v.number()),

  // Project Fees
  project_design_fee_per_unit: v.optional(v.number()),
  project_design_fee_total: v.optional(v.number()), // fee_per_unit * units_count
  project_management_fee_monthly: v.optional(v.number()),

  // OHP (Overheads and Profit)
  ohp_percentage: v.optional(v.number()),
  ohp_amount: v.optional(v.number()), // percentage * totals

  // Grand Total
  grand_total: v.optional(v.number()),
  grand_total_per_m2: v.optional(v.number()),

  // Metadata
  last_updated: v.optional(v.number()),
  updated_by: v.optional(v.id("users")),
}).index("by_estimate_id", ["estimate_id"]);

// Calculation audit trail for tracking how values were computed
export const estimate_calculations = defineTable({
  estimate_id: v.id("estimate"),
  workflow_step: workflowStepValidator,
  field_name: v.string(),
  calculation_formula: v.string(),
  input_values: v.any(), // JSON object of input values used in calculation
  result_value: v.number(),
  calculated_at: v.number(),
  calculated_by: v.id("users"),
})
  .index("by_estimate_id", ["estimate_id"])
  .index("by_workflow_step", ["workflow_step"])
  .index("by_estimate_and_step", ["estimate_id", "workflow_step"])
  .index("by_field_name", ["field_name"]);

// Version history for tracking changes over time
export const estimate_override_edits = defineTable({
  estimate_id: v.id("estimate"),
  _v: v.number(),
  label: v.string(),
  old_value: v.string(),
  new_value: v.string(),
  edited_by: v.id("users"),
  edited_at: v.number(),
})
  .index("by_estimate_id", ["estimate_id"])
  .index("by_edited_by", ["edited_by"])
  .index("by_edited_at", ["edited_at"]);

// Cost lookup tables for standardized pricing
export const cost_lookup = defineTable({
  category: v.string(), // "house_type", "quality", "staff_rates", etc.
  key: v.string(), // "TYPE_A", "PREMIUM", "site_supervisor", etc.
  base_cost: v.number(),
  cost_per_unit: v.optional(v.number()), // For scalable costs
  currency: v.string(), // "GBP", "USD", etc.
  effective_date: v.number(),
  expires_date: v.optional(v.number()),
  company_id: v.optional(v.id("company")), // Company-specific pricing
  created_by: v.id("users"),
  valid: v.boolean(),
})
  .index("by_category", ["category"])
  .index("by_category_and_key", ["category", "key"])
  .index("by_company_id", ["company_id"])
  .index("by_valid", ["valid"])
  .index("by_effective_date", ["effective_date"]);
