import type { Metadata } from "next";
import Link from "next/link";
import AiFinder from "@/components/ai/AiFinder";
import Contact from "@/components/Contact";
import { Arrow, IconBox, type IconName } from "@/components/ui/Icon";
import NetworkViz from "@/components/ui/NetworkViz";
import PageHero from "@/components/ui/PageHero";
import { aiFaq, aiOfferings } from "@/data/ai";

export const metadata: Metadata = {
  title: "AI Services",
  description:
    "Practical AI for South African businesses: customer assistants, document automation, forecasting, AI agents, smart cameras, strategy sessions and bespoke AI solutions.",
};

const steps = [
  { n: "01 / Discover", t: "Find the quick wins", d: "A strategy session to map where time and money are lost, and which AI ideas are worth doing first." },
  { n: "02 / Pilot", t: "Build a working pilot", d: "One focused use case, built on your real data and tested with your team and customers." },
  { n: "03 / Scale", t: "Roll out & improve", d: "Connect it to your systems, train your people and keep improving it with premium support." },
];

const principles: { icon: IconName; t: string; d: string }[] = [
  { icon: "lock", t: "POPIA-aware data handling", d: "Personal information is minimised, protected and only used for its agreed purpose." },
  { icon: "usercheck", t: "Humans stay in control", d: "AI drafts, suggests and flags. Your team approves anything that matters." },
  { icon: "gauge", t: "Measured outcomes", d: "We agree on success measures upfront, such as hours saved or response times, and report against them." },
];

export default function AiPage() {
  return (
    <>
      <PageHero
        crumb="ai"
        className="ai-hero"
        orbs={2}
        backdrop={
          <NetworkViz className="ai-hero-viz" width={600} height={500} nodes={34} linkDistance={110} preserveAspectRatio="xMidYMid slice" />
        }
        title="AI that fits how your business"
        accent="actually works."
        lead="Eight practical AI services in plain business terms, plus fully bespoke AI when you need something unique. Start small with one problem, prove the value, then grow."
      >
        <div className="hero-ctas" style={{ marginTop: "2rem" }}>
          <a href="#ai-offers" className="btn btn-primary">
            See the services <Arrow dir="down" />
          </a>
          <Link href="/contact" className="btn btn-ghost">
            Book a free AI strategy session
          </Link>
        </div>
      </PageHero>

      <section id="ai-offers">
        <div className="wrap">
          <div className="sec-head">
            <div className="reveal">
              <span className="eyebrow">AI services</span>
              <h2>
                Pick the problem.
                <br />
                We&apos;ll build the <span className="grad-text">AI.</span>
              </h2>
            </div>
            <p className="lead reveal d1">
              Each service is described by what it does for you, not by the technology behind it.
            </p>
          </div>
          <div className="offers">
            {aiOfferings.map((o, i) => (
              <article key={o.id} id={`off-${o.id}`} className={`card offer reveal ${o.layout ?? ""} d${i % 3}`}>
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
                  <Link href="/contact" className="btn btn-primary" style={{ marginTop: "1.2rem", alignSelf: "flex-start" }}>
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
          <div className="reveal" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 2.5rem" }}>
            <span className="eyebrow">Where could AI help you?</span>
            <h2>Choose a part of your business.</h2>
            <p className="lead" style={{ marginInline: "auto" }}>
              We&apos;ll show the AI services that fit and the kind of tasks they take off your plate.
            </p>
          </div>
          <AiFinder />
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="sec-head">
            <div className="reveal">
              <span className="eyebrow">How we deliver AI</span>
              <h2>
                Start small. <span className="grad-text">Prove it.</span> Scale.
              </h2>
            </div>
            <p className="lead reveal d1">
              No big-bang projects. You see working results early and decide what comes next.
            </p>
          </div>
          <div className="values">
            {steps.map((s, k) => (
              <article className={`card reveal ${k ? `d${k}` : ""}`} key={s.n}>
                <span className="num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <div className="reveal">
            <span className="eyebrow">Responsible by design</span>
            <h2>Your data. Your rules.</h2>
            <p className="lead">
              Every AI solution we build is designed around privacy, security and human oversight,
              with POPIA in mind from day one.
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
            <span className="eyebrow">AI FAQ</span>
            <h2>Common questions.</h2>
          </div>
          <div className="faq reveal">
            {aiFaq.map((f, k) => (
              <details key={f.q} open={k === 0}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <Contact title="Let's find your first AI win." />
      </section>
    </>
  );
}
