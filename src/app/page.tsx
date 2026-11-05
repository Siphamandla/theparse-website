import type { Metadata } from "next";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import AiSpotlight from "@/components/home/AiSpotlight";
import Hero, { Marquee } from "@/components/home/Hero";
import Lifecycle from "@/components/home/Lifecycle";
import ServicesBento from "@/components/home/ServicesBento";
import { Stats, Why } from "@/components/home/WhyStats";

export const metadata: Metadata = {
  title: { absolute: "theParse | Bespoke Software, Exceptional Solutions" },
  description:
    "theParse delivers bespoke software solutions tailored to your business, ensuring exceptional performance and innovation.",
};

export default function Home() {
  return (
    <>
      <ScrollUp />
      <Hero />
      <Marquee />
      <ServicesBento />
      <AiSpotlight />
      <Lifecycle />
      <Why />
      <Stats />
      <section style={{ paddingTop: 0 }}>
        <Contact />
      </section>
    </>
  );
}
