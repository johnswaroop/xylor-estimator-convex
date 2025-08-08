"use client";
import Dashboard from "./funnel";
import React from "react";
import { useQueryState } from "nuqs";
import { Id } from "@/convex/_generated/dataModel";
import Loader from "@/components/Loader";

function Page() {
  const [companyId] = useQueryState("companyId");

  if (!companyId) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <Dashboard company_id={companyId as Id<"company">} />
    </div>
  );
}

export default Page;
