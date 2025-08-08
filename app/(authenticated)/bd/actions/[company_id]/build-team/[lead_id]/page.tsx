import React from "react";
import TeamAssigner from "./TeamAssigner";

export default async function page({
  params,
}: {
  params: Promise<{ company_id: string; lead_id: string }>;
}) {
  const { company_id } = await params;
  const { lead_id } = await params;
  return <TeamAssigner company_id={company_id} lead_id={lead_id} />;
}
