"use client";

import { useState } from "react";
import { IconChip } from "@/components/ui/Icon";
import { aiFinder, aiOfferings } from "@/data/ai";

/** "Where could AI help you?" picker. Recommendations jump to the matching offering card. */
export default function AiFinder() {
  const areas = Object.keys(aiFinder);
  const [area, setArea] = useState(areas[0]);
  const f = aiFinder[area];

  const jump = (id: string) => {
    const el = document.getElementById(`off-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelectorAll(".offer.hl").forEach((x) => x.classList.remove("hl"));
    el.classList.add("hl");
    setTimeout(() => el.classList.remove("hl"), 2500);
  };

  return (
    <>
      <div className="svc-tabs reveal" role="tablist" style={{ justifyContent: "center" }}>
        {areas.map((a) => (
          <button key={a} role="tab" aria-selected={a === area} className={a === area ? "on" : ""} onClick={() => setArea(a)}>
            {a}
          </button>
        ))}
      </div>
      <div className="finder reveal" key={area}>
        <div className="card">
          <span className="num">Tasks AI can take on</span>
          <h3>{area}</h3>
          <ul>
            {f.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ animationDelay: ".1s" }}>
          <span className="num">Recommended for you</span>
          {f.rec.map((id) => {
            const o = aiOfferings.find((x) => x.id === id)!;
            return (
              <button type="button" className="rec" key={id} onClick={() => jump(id)}>
                <IconChip name={o.icon} />
                <div>
                  <strong>{o.title}</strong>
                  <span>{o.tags.join(" · ")}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
