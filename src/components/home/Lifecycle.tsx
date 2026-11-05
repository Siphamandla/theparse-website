"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/components/ui/Effects";

const stages = [
  { t: "Strategy", d: "We get to know your business, your users and your goals, then turn them into a clear, prioritised roadmap.", l: ["Discovery workshops", "Technical feasibility", "Roadmap & estimates"] },
  { t: "Design", d: "Intuitive, visually engaging experiences that blend form and function, validated with real users.", l: ["UX research & flows", "UI design systems", "Interactive prototypes"] },
  { t: "Development", d: "Fullstack engineering with clean, well-structured code that reduces technical debt from day one.", l: ["Web, mobile & APIs", "AI & data integration", "Automated testing"] },
  { t: "Deployment", d: "Secure, cloud-native releases built to scale with demand, with no big-bang surprises.", l: ["Cloud migration", "CI/CD pipelines", "Security hardening"] },
  { t: "Optimisation", d: "Premium support and continuous improvement, so your platform keeps getting better after launch.", l: ["Performance tuning", "Analytics & insights", "Ongoing support"] },
];

export default function Lifecycle() {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
    const t = setInterval(() => setCur((c) => (c + 1) % stages.length), 5000);
    return () => clearInterval(t);
  }, [paused, cur]);

  const s = stages[cur];

  return (
    <section className="lifecycle">
      <div className="wrap">
        <div className="sec-head">
          <div className="reveal">
            <span className="eyebrow">How we work</span>
            <h2>
              One partner for the
              <br />
              <span className="grad-text">full lifecycle.</span>
            </h2>
          </div>
          <p className="lead reveal d1">
            Click through each stage, or let it play. We stay with you from the first idea to
            continuous optimisation.
          </p>
        </div>

        <div className="steps reveal" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="progress" style={{ width: `${(80 * cur) / (stages.length - 1)}%` }} />
          {stages.map((st, i) => (
            <button
              key={st.t}
              className={`step ${i === cur ? "active" : ""} ${i < cur ? "done" : ""}`}
              onClick={() => setCur(i)}
              aria-current={i === cur ? "step" : undefined}
            >
              <div className="dot">0{i + 1}</div>
              <h4>{st.t}</h4>
            </button>
          ))}
        </div>

        <div className="step-panel" key={cur}>
          <div className="fade">
            <span className="eyebrow">Stage 0{cur + 1}</span>
            <h3 style={{ marginTop: ".8rem" }}>{s.t}</h3>
            <p>{s.d}</p>
          </div>
          <ul>
            {s.l.map((x, k) => (
              <li key={x} style={{ animationDelay: `${k * 0.1}s` }}>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
