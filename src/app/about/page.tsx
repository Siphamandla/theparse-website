import type { Metadata } from "next";
import Contact from "@/components/Contact";
import PageHero from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "theParse is a team with years of corporate experience designing, developing, testing and deploying software for small, medium and enterprise businesses.",
};

const focus = [
  { t: "Advanced analytics & AI", d: "Turning data into decisions with machine learning and predictive insight." },
  { t: "IoT & edge computing", d: "Connected devices and real-time telemetry, where the work happens." },
  { t: "Cloud-native platforms", d: "Secure, scalable infrastructure designed to grow with you." },
  { t: "Mobile & web", d: "Bespoke applications your users will actually enjoy using." },
];

const values = [
  { t: "Precision", d: "Every solution is engineered around your exact needs, not a template." },
  { t: "Craft", d: "Clean, documented, developer-friendly code that is easy to own long-term." },
  { t: "Partnership", d: "Premium, personalised support at every stage of the lifecycle." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumb="about"
        title="Corporate experience."
        accent="Startup energy."
        orbs={2}
        lead="We are a team with years of corporate experience designing, developing, testing and deploying a broad range of software, from home automation to enterprise-grade solutions for small and medium-sized businesses. Our people have worked on complex global projects for large organisations."
      />

      <section>
        <div className="wrap split">
          <div className="reveal">
            <span className="eyebrow">Our mission</span>
            <h2>Helping Africa&apos;s businesses innovate &amp; compete globally.</h2>
            <p className="lead">
              We pair deep engineering discipline with a bespoke, partner-first approach, so every
              solution fits the business it was built for.
            </p>
          </div>
          <div className="timeline reveal d1">
            {focus.map((f) => (
              <div className="tl" key={f.t}>
                <h4>{f.t}</h4>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="reveal" style={{ marginBottom: "2.5rem" }}>
            <span className="eyebrow">What we value</span>
            <h2>The way we build.</h2>
          </div>
          <div className="values">
            {values.map((v, k) => (
              <article className={`card reveal ${k ? `d${k}` : ""}`} key={v.t}>
                <span className="num">0{k + 1}</span>
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <Contact />
      </section>
    </>
  );
}
