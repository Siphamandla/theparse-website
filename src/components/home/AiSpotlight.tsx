import Link from "next/link";
import { Arrow, IconChip, type IconName } from "@/components/ui/Icon";
import AiDemo from "./AiDemo";

const highlights: { icon: IconName; title: string; text: string }[] = [
  { icon: "chat", title: "Customer assistants", text: "24/7 answers on web & WhatsApp" },
  { icon: "file", title: "Document automation", text: "Invoices & forms captured for you" },
  { icon: "trend", title: "Forecasting", text: "Plan stock, demand & cash flow" },
  { icon: "cpu", title: "Bespoke AI solutions", text: "Custom AI built around your data & goals" },
];

export default function AiSpotlight() {
  return (
    <section className="ai-sec">
      <div className="orb o1" style={{ left: -160, right: "auto", top: "10%" }} />
      <div className="wrap ai-split">
        <div className="reveal">
          <span className="eyebrow">theParse AI</span>
          <h2>
            AI that saves time, wins customers &amp; <span className="grad-text">cuts admin.</span>
          </h2>
          <p className="lead">
            No hype, no jargon. We build practical AI tools for South African businesses, then connect
            them to the systems and channels you already use.
          </p>
          <div className="ai-mini">
            {highlights.map((h) => (
              <div key={h.title}>
                <IconChip name={h.icon} />
                <span>
                  <strong>{h.title}</strong>
                  {h.text}
                </span>
              </div>
            ))}
          </div>
          <div className="hero-ctas" style={{ marginTop: "2rem" }}>
            <Link href="/ai" className="btn btn-primary">
              Explore AI services <Arrow />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Book an AI strategy session
            </Link>
          </div>
        </div>
        <AiDemo />
      </div>
    </section>
  );
}
