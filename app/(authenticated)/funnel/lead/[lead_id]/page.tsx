import React from "react";
import LeadView from "./LeadView";

export default async function page({
  params,
  searchParams,
}: {
  params: Promise<{ company_id: string; lead_id: string }>;
  searchParams: Promise<{
    companyId: string;
  }>;
}) {
  const { companyId } = await searchParams;
  const { lead_id } = await params;

  console.log({ companyId, lead_id });

  return <LeadView company_id={companyId} lead_id={lead_id} />;
}
