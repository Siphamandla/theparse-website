"use client";

import { useEffect, useState } from "react";

/** "On this page" list that highlights the section currently being read. */
export default function PolicyToc({ titles }: { titles: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        }),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    document.querySelectorAll<HTMLElement>(".doc-sec").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [titles]);

  return (
    <div id="polToc">
      {titles.map((t, i) => (
        <button
          key={t}
          className={i === active ? "on" : ""}
          onClick={() => document.getElementById(`sec-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="print-btn" onClick={() => window.print()}>
      {children}
    </button>
  );
}
