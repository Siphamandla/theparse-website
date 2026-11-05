import type { Metadata } from "next";
import Contact from "@/components/Contact";
import { PoliciesHero } from "@/components/policies/PolicyView";

export const metadata: Metadata = {
  title: "Policies",
  description: "Read theParse's privacy, data, cookie and terms of service policies.",
};

export default function PoliciesPage() {
  return (
    <>
      <PoliciesHero />
      <section>
        <Contact title="Questions about our policies?" />
      </section>
    </>
  );
}
