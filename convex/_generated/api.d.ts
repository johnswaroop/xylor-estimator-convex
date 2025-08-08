/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as company_service from "../company_service.js";
import type * as form_service from "../form_service.js";
import type * as http from "../http.js";
import type * as lead_helper from "../lead_helper.js";
import type * as lead_service from "../lead_service.js";
import type * as note_service from "../note_service.js";
import type * as status_service from "../status_service.js";
import type * as team_service from "../team_service.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  company_service: typeof company_service;
  form_service: typeof form_service;
  http: typeof http;
  lead_helper: typeof lead_helper;
  lead_service: typeof lead_service;
  note_service: typeof note_service;
  status_service: typeof status_service;
  team_service: typeof team_service;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
