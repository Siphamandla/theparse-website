"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow, IconBox, type IconName } from "@/components/ui/Icon";
import { servicesExplorer } from "@/data/site";

/** Highlight card shown at the top of a tab that has its own dedicated page. */
const featured: Record<string, { href: string; icon: IconName; title: string; text: string; cta: string }> = {
  Automate: {
    href: "/automation",
    icon: "flow",
    title: "Workflow Automation",
    text: "Sometimes the smartest upgrade is a simpler process. We streamline and automate how work flows today, cutting steps, retyping and delays, so any AI you add later has a solid foundation.",
    cta: "Explore workflow automation",
  },
  AI: {
    href: "/ai",
    icon: "brain",
    title: "AI Services",
    text: "Practical AI for customer assistants, document capture and forecasting, plus bespoke AI solutions, added where it pays off. See all eight services with real examples.",
    cta: "Explore AI services",
  },
};

export default function ServicesExplorer() {
  const cats = Object.keys(servicesExplorer);
  const [cat, setCat] = useState(cats[0]);

  return (
    <>
      <div className="svc-tabs" role="tablist">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="svc-view" key={cat}>
        {featured[cat] && (
          <Link href={featured[cat].href} className="card offer feat" style={{ gridColumn: "1/-1" }}>
            <div className="top">
              <IconBox name={featured[cat].icon} />
              <span className="num">Featured / {cat}</span>
            </div>
            <h3>{featured[cat].title}</h3>
            <p style={{ maxWidth: "62ch" }}>{featured[cat].text}</p>
            <span className="btn btn-primary" style={{ marginTop: "1.4rem", alignSelf: "flex-start" }}>
              {featured[cat].cta} <Arrow />
            </span>
          </Link>
        )}
        {servicesExplorer[cat].map((s, i) => (
          <article key={s.title} className="card" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="num">
              0{i + 1} / {cat}
            </span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <Link href="/contact" className="btn btn-ghost" style={{ marginTop: "1.4rem" }}>
              Enquire <Arrow />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
