import type { Metadata } from "next";
import Contact from "@/components/Contact";
import PageHero from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact theParse today to kick-start your software journey.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumb="contact"
        title="Let's build something"
        accent="exceptional."
        style={{ paddingBottom: "3rem", borderBottom: 0 }}
        lead="Whether you have a question about our services, need a custom solution or just want to get in touch, our team is here to help."
      />
      <section style={{ paddingTop: 0 }}>
        <Contact />
      </section>
    </>
  );
}
