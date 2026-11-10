import type { Metadata } from "next";
import Contact from "@/components/Contact";
import ServicesExplorer from "@/components/services/ServicesExplorer";
import PageHero from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web, mobile, eCommerce, workflow automation, AI, data, cloud and IoT services from theParse: bespoke software built to scale.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        crumb="services"
        title="Everything you need to"
        accent="build & scale."
        lead="Pick a focus area to see how we can help."
      />
      <section>
        <div className="wrap">
          <ServicesExplorer />
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <Contact />
      </section>
    </>
  );
}
