import Link from "next/link";
import { Arrow } from "@/components/ui/Icon";

const before = ["Email request", "Print form", "Manager signs", "Scan", "Retype into system", "Chase approval", "Update spreadsheet"];
const after = ["Online form", "Auto-routed approval", "Synced to system"];

export default function AutomationSpotlight() {
  return (
    <section>
      <div className="wrap ai-split">
        <div className="reveal">
          <span className="eyebrow">Workflow automation</span>
          <h2>
            Sometimes the smartest upgrade is a <span className="grad-text">simpler process.</span>
          </h2>
          <p className="lead">
            Before adding AI, it often makes sense to streamline and automate how work flows today.
            Fewer steps, cleaner data and less retyping deliver quick wins on their own, and give any
            future AI a solid foundation to build on.
          </p>
          <div className="hero-ctas" style={{ marginTop: "2rem" }}>
            <Link href="/automation" className="btn btn-primary">
              Explore workflow automation <Arrow />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Book a process review
            </Link>
          </div>
        </div>

        <div className="card auto-demo reveal d1" aria-label="Example: a seven-step manual process streamlined to three automated steps">
          <div className="auto-row">
            <span className="num">Today · 7 steps</span>
            <div className="auto-chips">
              {before.map((s) => (
                <span key={s} className="chip manual">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="auto-arrow" aria-hidden="true">
            <Arrow dir="down" />
            Streamline &amp; automate
          </div>
          <div className="auto-row">
            <span className="num">Streamlined · 3 steps</span>
            <div className="auto-chips">
              {after.map((s) => (
                <span key={s} className="chip auto">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="auto-arrow" aria-hidden="true">
            <Arrow dir="down" />
            Then enhance
          </div>
          <Link href="/ai" className="auto-next">
            Add AI where it pays off <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
