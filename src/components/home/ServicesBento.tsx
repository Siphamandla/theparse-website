import Link from "next/link";
import { Arrow, IconBox } from "@/components/ui/Icon";
import NetworkViz from "@/components/ui/NetworkViz";

const small = [
  { n: "02", icon: "rocket", title: "Crafted for startups", text: "Agile, scalable solutions designed to grow with your business.", cls: "b-b d1" },
  { n: "03", icon: "code", title: "Fullstack development", text: "High-performance applications that work flawlessly across every platform.", cls: "b-c" },
  { n: "04", icon: "pen", title: "High-quality design", text: "Intuitive interfaces where form and function create a lasting impact.", cls: "b-d d1" },
  { n: "05", icon: "grid", title: "Fully customisable", text: "Unique features, tailored integrations and workflows aligned to how you work.", cls: "b-e d2" },
] as const;

const transform = [
  { from: "Legacy systems", to: "cloud", w: "92%" },
  { from: "Manual workflows", to: "auto", w: "78%" },
  { from: "Siloed data", to: "AI", w: "85%" },
  { from: "Single channel", to: "omni", w: "70%" },
];

export default function ServicesBento() {
  return (
    <section>
      <div className="wrap">
        <div className="sec-head">
          <div className="reveal">
            <span className="eyebrow">What we do</span>
            <h2>
              Software that fits
              <br />
              your business, <span className="grad-text">exactly.</span>
            </h2>
          </div>
          <p className="lead reveal d1">
            From startups finding their footing to established businesses reinventing how they work.
            Every engagement is bespoke.
          </p>
        </div>

        <div className="bento">
          <article className="card b-a reveal">
            <span className="num">01 / AI</span>
            <IconBox name="brain" style={{ marginTop: "1rem" }} />
            <h3>Practical AI that does real work for your business.</h3>
            <p style={{ maxWidth: "44ch" }}>
              Assistants that answer customers, automation that clears admin and forecasts that help
              you plan, each built around how you already work.
            </p>
            <Link href="/ai" className="btn btn-ghost" style={{ marginTop: "1.4rem", position: "relative", zIndex: 2 }}>
              Explore AI services <Arrow />
            </Link>
            <NetworkViz className="ai-viz" width={300} height={240} nodes={18} linkDistance={85} />
          </article>

          {small.map((c) => (
            <article key={c.n} className={`card ${c.cls} reveal`}>
              <span className="num">{c.n}</span>
              <IconBox name={c.icon} style={{ marginTop: "1rem" }} />
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </article>
          ))}

          <article className="card b-f reveal">
            <div>
              <span className="num">06 / Transformation</span>
              <h3 style={{ fontSize: "1.9rem" }}>Digital transformation, end-to-end.</h3>
              <p>
                Modernise legacy systems, streamline processes and stay competitive in a rapidly
                evolving digital landscape.
              </p>
            </div>
            <div className="transform-bar">
              {transform.map((t, k) => (
                <div className="tb-row" key={t.from}>
                  {t.from}
                  <div className="tb-track">
                    <div
                      className="tb-fill"
                      style={{ ["--w" as string]: t.w, transitionDelay: `${k * 0.15}s` } as React.CSSProperties}
                    />
                  </div>
                  <span className="tb-to">
                    <Arrow />
                    {t.to}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
