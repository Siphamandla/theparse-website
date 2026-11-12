import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { collections, toObjectId } from "@/lib/portal/db";

/** The client for this route, loaded once per request (layout + page share it). */
export const getClient = cache(async (id: string) => {
  const _id = toObjectId(id);
  if (!_id) notFound();
  const org = await (await collections()).orgs.findOne({ _id });
  if (!org) notFound();
  return org;
});
