import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PolicyView from "@/components/policies/PolicyView";
import { getPolicy } from "@/data/policies";

const policy = getPolicy("privacy-policy");

export const metadata: Metadata = {
  title: policy?.name,
  description: policy?.desc,
};

export default function Page() {
  if (!policy) notFound();
  return <PolicyView policy={policy} />;
}
