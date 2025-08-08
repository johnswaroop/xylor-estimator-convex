import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await isAuthenticatedNextjs();

  if (!isAuthenticated) {
    redirect("/auth/signin");
    return <div>Not authenticated</div>;
  }
  return <div className="relative">{children}</div>;
}
