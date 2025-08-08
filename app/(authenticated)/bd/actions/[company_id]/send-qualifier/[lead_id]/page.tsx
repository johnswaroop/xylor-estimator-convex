import React from "react";
import SendQualifier from "./SendQualifier";

export default async function page({
  params,
}: {
  params: Promise<{ company_id: string; lead_id: string }>;
}) {
  const { company_id } = await params;
  const { lead_id } = await params;

  return (
    <SendQualifier
      sendgrid_from_email={process.env.SENDGRID_FROM_EMAIL || ""}
      company_id={company_id}
      lead_id={lead_id}
    />
  );
}
