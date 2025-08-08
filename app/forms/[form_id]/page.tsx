import React from "react";
import ClientForm from "./ClientForm";

export default async function page({
  params,
}: {
  params: Promise<{ form_id: string }>;
}) {
  const { form_id } = await params;
  //check if the form is submitted
  return <ClientForm form_id={form_id} />;
}
