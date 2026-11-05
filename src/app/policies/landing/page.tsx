import { redirect } from "next/navigation";

// The policies hub moved to /policies.
export default function LegacyPoliciesLanding() {
  redirect("/policies");
}
