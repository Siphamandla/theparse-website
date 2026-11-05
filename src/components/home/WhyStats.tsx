"use client";

import { useEffect, useRef, useState } from "react";
import { IconBox, type IconName } from "@/components/ui/Icon";
import { prefersReducedMotion } from "@/components/ui/Effects";

const checks = [
  "Fullstack development",
  "E-commerce development",
  "Mobile app development",
  "AI assistants & automation",
  "Rich documentation",
  "Developer friendly",
];

const reasons: { icon: IconName; title: string; text: string }[] = [
  { icon: "cleancode", title: "Clean code", text: "Well-structured, readable code that reduces technical debt and simplifies future updates." },
  { icon: "zap", title: "Premium support", text: "Prompt, personalised help, from troubleshooting to performance optimisation." },
  { icon: "globe", title: "Real impact", text: "Secure, scalable platforms that help organisations across Africa innovate and compete globally." },
];

export function Why() {
  return (
    <section>
      <div className="wrap split">
        <div className="reveal">
          <span className="eyebrow">Why theParse</span>
          <h2>Crafted for startup, SaaS &amp; business.</h2>
          <p className="lead">
            Our team brings years of corporate experience designing, building, testing and deploying
            software, from home automation to enterprise-grade platforms for growing businesses.
          </p>
          <div className="checks">
            {checks.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
        </div>
        <div className="why-list">
          {reasons.map((r, k) => (
            <div key={r.title} className={`why reveal d${k + 1}`}>
              <IconBox name={r.icon} />
              <div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** theParse has been building software since 2013. */
export const FOUNDED_YEAR = 2013;

// Evaluated in the browser (this is a client component and the counter only animates
// client-side), so the value stays current even though pages are statically generated.
const yearsOfExperience = () => new Date().getFullYear() - FOUNDED_YEAR;

const stats = [
  { v: 50, suffix: "+", label: "Projects completed", grad: true },
  { v: 30, suffix: "+", label: "Happy clients" },
  { v: yearsOfExperience, suffix: "+", label: `Established in ${FOUNDED_YEAR}` },
  { v: 98, suffix: "%", label: "Success rate", grad: true },
];

/** `to` may be a function so date-based values are computed in the browser at view time. */
function Counter({ to: target, suffix, grad }: { to: number | (() => number); suffix: string; grad?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const to = typeof target === "function" ? target() : target;
    if (prefersReducedMotion()) {
      setVal(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const f = (t: number) => {
          const p = Math.min((t - t0) / 1600, 1);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(f);
        };
        raf = requestAnimationFrame(f);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return (
    <div ref={ref} className={`v ${grad ? "grad-text" : ""}`}>
      {val}
      {suffix}
    </div>
  );
}

export function Stats() {
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="stats reveal">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <Counter to={s.v} suffix={s.suffix} grad={s.grad} />
              <div className="l">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
