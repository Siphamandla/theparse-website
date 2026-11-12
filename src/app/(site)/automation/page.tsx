import type { Metadata } from "next";
import Link from "next/link";
import Contact from "@/components/Contact";
import ProcessFlow from "@/components/automation/ProcessFlow";
import { Arrow, IconBox, IconChip, type IconName } from "@/components/ui/Icon";
import PageHero from "@/components/ui/PageHero";
import { automationCompare, automationFaq, automationOfferings } from "@/data/automation";

export const metadata: Metadata = {
  title: "Workflow Automation",
  description:
    "Workflow automation for South African businesses: process mapping, approvals, system integration, digital forms, notifications and scheduled reporting. Streamline first, then enhance with AI when it makes sense.",
};

const steps = [
  { n: "01 / Map", t: "See the real process", d: "We map how work actually flows today, including the workarounds, and agree on what good looks like." },
  { n: "02 / Streamline", t: "Remove before you add", d: "Cut duplicate steps, unnecessary handoffs and retyping. The simplest process is the cheapest one to automate." },
  { n: "03 / Automate", t: "Let systems do the routine", d: "Connect your tools and automate the predictable steps, with clear owners for the exceptions." },
  { n: "04 / Enhance", t: "Add AI where it pays", d: "With clean data and a stable process, AI can be added confidently, only where it adds real value." },
];

const principles: { icon: IconName; t: string; d: string }[] = [
  { icon: "zap", t: "Faster payback", d: "Simple automation often delivers most of the value on its own, at a fraction of the cost of AI." },
  { icon: "db", t: "Cleaner data", d: "Structured, consistent data is the foundation every future improvement, including AI, depends on." },
  { icon: "gauge", t: "A measurable baseline", d: "Once a process is stable, you can measure exactly what any enhancement adds." },
];

export default function AutomationPage() {
  return (
    <>
      <PageHero
        crumb="automation"
        orbs={2}
        title="Fix the process first."
        accent="Then make it smarter."
        lead="Sometimes the smartest move isn't adding AI. It's streamlining and automating how work flows today, so every enhancement that follows is faster, cheaper and actually sticks."
      >
        <div className="hero-ctas" style={{ marginTop: "2rem" }}>
          <a href="#auto-offers" className="btn btn-primary">
            See the services <Arrow dir="down" />
          </a>
          <Link href="/contact" className="btn btn-ghost">
            Book a free process review
          </Link>
        </div>
      </PageHero>

      <section>
        <div className="wrap split">
          <div className="reveal">
            <span className="eyebrow">Why streamline first</span>
            <h2>
              Don&apos;t automate the <span className="grad-text">mess.</span>
            </h2>
            <p className="lead">
              Adding AI to a process full of duplicate steps, scattered data and manual workarounds
              tends to amplify the problems instead of solving them. Streamlining and automating first
              often unlocks most of the value, and makes AI a far safer bet when you&apos;re ready.
            </p>
          </div>
          <div className="auto-compare reveal d1">
            {(["before", "after"] as const).map((k) => (
              <div key={k} className={`card auto-col ${k}`}>
                <h3>{automationCompare[k].title}</h3>
                <ul>
                  {automationCompare[k].points.map((p) => (
                    <li key={p}>
                      <IconChip name={k === "before" ? "x" : "check"} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="auto-offers" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="reveal">
              <span className="eyebrow">Automation services</span>
              <h2>
                Less busywork.
                <br />
                More <span className="grad-text">flow.</span>
              </h2>
            </div>
            <p className="lead reveal d1">
              Practical automation built around the tools and teams you already have.
            </p>
          </div>
          <div className="offers">
            {automationOfferings.map((o, i) => (
              <article key={o.id} id={`auto-${o.id}`} className={`card offer reveal ${o.layout ?? ""} d${i % 3}`}>
                <div className="top">
                  <IconBox name={o.icon} />
                  <span className="num">0{i + 1}</span>
                </div>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
                <div className="ex">
                  <b>For example</b>
                  {o.example}
                </div>
                <div className="tags">
                  {o.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                {o.cta && (
                  <Link
                    href={o.cta.href ?? "/contact"}
                    className="btn btn-primary"
                    style={{ marginTop: "1.2rem", alignSelf: "flex-start" }}
                  >
                    {o.cta.label} <Arrow />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lifecycle">
        <div className="wrap">
          <div className="sec-head">
            <div className="reveal">
              <span className="eyebrow">How we work</span>
              <h2>
                Map. Streamline. Automate. <span className="grad-text">Enhance.</span>
              </h2>
            </div>
            <p className="lead reveal d1">
              Each step earns the next. You only move on when the one before is delivering.
            </p>
          </div>
          <ProcessFlow steps={steps} />
        </div>
      </section>

      <section>
        <div className="wrap split">
          <div className="reveal">
            <span className="eyebrow">The payoff</span>
            <h2>A foundation that keeps paying back.</h2>
            <p className="lead">
              Streamlined, automated processes save time today and set you up for whatever comes next,
              whether that&apos;s AI, new systems or growth.
            </p>
          </div>
          <div className="why-list">
            {principles.map((p, k) => (
              <div className={`why reveal d${k + 1}`} key={p.t}>
                <IconBox name={p.icon} />
                <div>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="eyebrow">Automation FAQ</span>
            <h2>Common questions.</h2>
          </div>
          <div className="faq reveal">
            {automationFaq.map((f, k) => (
              <details key={f.q} open={k === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <Contact title="Let's streamline how you work." />
      </section>
    </>
  );
}
