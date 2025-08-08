import React from "react";
import NewLeadForm from "./NewLeadForm";

export default async function page({
  params,
}: {
  params: Promise<{ company_id: string }>;
}) {
  const { company_id } = await params;
  return <NewLeadForm company_id={company_id} />;
}
