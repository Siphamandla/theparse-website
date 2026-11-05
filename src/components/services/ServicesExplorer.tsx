"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow } from "@/components/ui/Icon";
import { servicesExplorer } from "@/data/site";

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
        {cat === "AI" && (
          <Link href="/ai" className="card ai-banner" style={{ gridColumn: "1/-1" }}>
            <span className="eyebrow">Dedicated page</span>
            <h3>
              See all eight AI services, with real examples <Arrow />
            </h3>
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
