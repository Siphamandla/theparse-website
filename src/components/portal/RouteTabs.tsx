"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RouteTab = { href: string; label: string; count?: number; hot?: boolean; hint?: string };

/** Underlined tabs where each tab is its own route. */
export default function RouteTabs({ tabs, label }: { tabs: RouteTab[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav className="pt-tabs" aria-label={label}>
      {tabs.map((t) => {
        const on = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} title={t.hint}>
            {t.label}
            {t.count ? <span className={`pt-tab-n ${t.hot ? "hot" : ""}`}>{t.count}</span> : null}
            {t.hint ? <span className="pt-sr">({t.hint})</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
