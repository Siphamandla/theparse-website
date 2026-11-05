"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon, { Arrow } from "@/components/ui/Icon";
import { prefersReducedMotion } from "@/components/ui/Effects";

const words = ["AI", "the cloud", "IoT & edge", "mobile", "the web"];

// Each console line is a list of [className, text] tokens.
type Tok = [string, string];
const lines: Tok[][] = [
  [["c", "// your business brief, parsed"]],
  [["k", "const"], ["", " brief = "], ["s", '"Grow faster, smarter"'], ["", ";"]],
  [["k", "await"], ["", " theParse."], ["s", "strategy"], ["", "(brief);"]],
  [["k", "await"], ["", " theParse."], ["s", "design"], ["", "({ users: "], ["s", '"first"'], ["", " });"]],
  [["k", "await"], ["", " theParse."], ["s", "build"], ["", "(["], ["s", '"web"'], ["", ", "], ["s", '"mobile"'], ["", ", "], ["s", '"ai"'], ["", "]);"]],
  [["k", "await"], ["", " theParse."], ["s", "deploy"], ["", "({ scale: "], ["s", '"auto"'], ["", " });"]],
  [["ok", "✓ solution shipped"], ["c", " · optimising…"]],
];
const lineLen = lines.map((l) => l.reduce((n, [, t]) => n + t.length, 0));
const outputs = ["Mobile app", "AI forecasting", "Cloud platform", "IoT telemetry"];

function Rotator() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setN((x) => x + 1), 2400);
    return () => clearInterval(t);
  }, []);
  const i = n % words.length;
  const prev = n > 0 ? (n - 1) % words.length : null;
  return (
    <span className="rotator">
      {words.map((w, k) => (
        <span key={w} className={`grad-text ${k === i ? "in" : k === prev ? "out" : ""}`} aria-hidden={k !== i}>
          {w}
        </span>
      ))}
    </span>
  );
}

function ParseConsole() {
  // progress: [current line, characters typed in that line]
  // Start fully rendered (server HTML, no-JS and reduced motion), then loop the typing animation.
  const [line, setLine] = useState(lines.length);
  const [chars, setChars] = useState(0);
  const [done, setDone] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let l = 0;
    let c = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (l >= lines.length) {
        setDone(true);
        timer = setTimeout(() => {
          l = 0;
          c = 0;
          setDone(false);
          setLine(0);
          setChars(0);
          tick();
        }, 6500);
        return;
      }
      c++;
      if (c > lineLen[l]) {
        l++;
        c = 0;
        setLine(l);
        setChars(0);
        timer = setTimeout(tick, 260);
      } else {
        setChars(c);
        timer = setTimeout(tick, 18);
      }
    };
    // Show the finished console briefly, then start re-typing it.
    timer = setTimeout(() => {
      setDone(false);
      setLine(0);
      setChars(0);
      tick();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  };

  const renderLine = (toks: Tok[], limit: number) => {
    let left = limit;
    return toks.map(([cls, text], k) => {
      const shown = text.slice(0, Math.max(0, left));
      left -= text.length;
      return shown ? (
        <span key={k} className={cls || undefined}>
          {shown}
        </span>
      ) : null;
    });
  };

  return (
    <div
      className="reveal d2"
      style={{ position: "relative" }}
      onPointerMove={onMove}
      onPointerLeave={() => ref.current && (ref.current.style.transform = "")}
    >
      <div className="float-badge fb2">
        <span className="ic"><Icon name="zap" /></span>
        <div>
          Deployed<small>Cloud-native · auto-scaling</small>
        </div>
      </div>
      <div className="console" ref={ref}>
        <div className="console-top">
          <i /><i /><i />
          <span>theparse ~ brief.parse</span>
        </div>
        <div className="console-body" aria-label="Animated code example">
          {lines.map((toks, k) =>
            k < line ? (
              <div key={k}>{renderLine(toks, Infinity)}</div>
            ) : k === line && !done ? (
              <div key={k}>
                {renderLine(toks, chars)}
                <span className="caret" />
              </div>
            ) : null,
          )}
        </div>
        <div className="console-out">
          {outputs.map((o, k) => (
            <div key={o} className={`chip-out ${done ? "show" : ""}`} style={{ transitionDelay: `${k * 0.18}s` }}>
              <b />
              {o}
            </div>
          ))}
        </div>
      </div>
      <div className="float-badge fb1">
        <span className="ic"><Icon name="checkc" /></span>
        <div>
          Clean code<small>Low technical debt</small>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="grid-bg" />
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="wrap">
        <div>
          <div className="pill reveal">
            <i>ZA</i> South African Software Innovation Company <span className="pulse-dot" />
          </div>
          <h1 className="reveal d1">
            Bespoke software
            <br />
            for <Rotator />
            <br />
            built to scale.
          </h1>
          <p className="lead reveal d2">
            We craft software precisely tailored to your business, engineered for exceptional
            performance, scalability and innovation, from first strategy session to production and beyond.
          </p>
          <div className="hero-ctas reveal d3">
            <Link href="/contact" className="btn btn-primary">
              Get started today <Arrow />
            </Link>
            <Link href="/services" className="btn btn-ghost">
              Explore services
            </Link>
          </div>
          <div className="hero-meta reveal d4">
            <div><strong>Full lifecycle</strong>Strategy → optimisation</div>
            <div><strong>AI-first</strong>Analytics, ML &amp; automation</div>
            <div><strong>Africa → global</strong>Built to compete</div>
          </div>
        </div>
        <ParseConsole />
      </div>
    </section>
  );
}

export function Marquee() {
  const items = [
    "Advanced analytics", "Artificial intelligence", "IoT & IIoT", "Edge computing",
    "Cloud-native", "Mobile apps", "Web platforms", "eCommerce", "Digital transformation",
  ];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...items, ...items].map((t, k) => (
          <span key={k}>{t}</span>
        ))}
      </div>
    </div>
  );
}
