import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const isMemberOfCompany = async (
  ctx: QueryCtx,
  role: "ADMIN" | "MEMBER",
  company_id: Id<"company">,
) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User_id_not_authenticated");
  }
  const isAdmin = await ctx.db
    .query("member")
    .withIndex("by_user_and_company", (q) =>
      q.eq("user_id", userId).eq("company_id", company_id),
    )
    .first();
  if (!isAdmin) {
    throw new Error("User_id_not_member_of_company");
  }
  if (role === "ADMIN" && isAdmin?.role !== "ADMIN") {
    throw new Error("User_id_not_admin_of_company");
  }
  return userId;
};
