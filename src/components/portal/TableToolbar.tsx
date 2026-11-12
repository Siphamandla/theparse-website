import Link from "next/link";

export type ToolbarTab = { key: string; label: string; count?: number; hot?: boolean };

/**
 * Filter tabs (with counts) and an optional search box, shown at the top of a
 * `.pt-dt` card. Tabs and search are plain links/GET forms, so filters live in the URL.
 */
export default function TableToolbar({
  basePath,
  tabs,
  current,
  defaultKey,
  q,
  searchLabel,
  label,
}: {
  basePath: string;
  tabs: ToolbarTab[];
  current: string;
  defaultKey: string;
  q?: string;
  /** Placeholder for the search box; omit to hide search. */
  searchLabel?: string;
  /** Accessible name for the tab list, e.g. "Filter invites". */
  label: string;
}) {
  const href = (key: string, query?: string) => {
    const p = new URLSearchParams();
    if (key !== defaultKey) p.set("status", key);
    if (query) p.set("q", query);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="pt-dt-bar">
      <nav className="pt-dt-tabs" aria-label={label}>
        {tabs.map((t) => (
          <Link key={t.key} href={href(t.key, q)} className={t.key === current ? "on" : undefined} aria-current={t.key === current ? "page" : undefined}>
            {t.label}
            {t.count !== undefined ? <span className={`n ${t.hot && t.count ? "hot" : ""}`}>{t.count}</span> : null}
          </Link>
        ))}
      </nav>
      {searchLabel ? (
        <form className="pt-dt-search" role="search" action={basePath}>
          {current !== defaultKey ? <input type="hidden" name="status" value={current} /> : null}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label className="pt-sr" htmlFor="dt-q">{searchLabel}</label>
          <input id="dt-q" name="q" type="search" defaultValue={q} placeholder={searchLabel} />
        </form>
      ) : null}
    </div>
  );
}
