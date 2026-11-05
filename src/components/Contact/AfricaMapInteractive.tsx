"use client";

import { useMemo, useState } from "react";
import Icon, { IconChip } from "@/components/ui/Icon";
import { MAP_HEIGHT, MAP_WIDTH, project } from "@/data/africaMap";
import { deployments, type Deployment } from "@/data/deployments";

type Group = { key: string; x: number; y: number; items: Deployment[] };

/** One marker per country, placed at the average position of that country's projects. */
function byCountry(items: Deployment[]): Group[] {
  const map = new Map<string, Deployment[]>();
  items.forEach((d) => map.set(d.country, [...(map.get(d.country) ?? []), d]));
  return Array.from(map.entries()).map(([iso, list]) => {
    const pts = list.map((d) => project(d.lon, d.lat));
    return {
      key: iso,
      x: pts.reduce((n, p) => n + p.x, 0) / pts.length,
      y: pts.reduce((n, p) => n + p.y, 0) / pts.length,
      items: list,
    };
  });
}

/** Marker radius grows gently with the number of projects. */
const radius = (n: number) => 6 + Math.min(n, 10) * 0.55;

export default function AfricaMapInteractive({
  countries,
  countryNames,
}: {
  /** Server-rendered <path> elements for every country. */
  countries: React.ReactNode;
  countryNames: Record<string, string>;
}) {
  const groups = useMemo(() => byCountry(deployments), []);
  const activeCountries = useMemo(() => new Set(deployments.map((d) => d.country)), []);
  const [selected, setSelected] = useState<{ label: string; items: Deployment[]; key: string } | null>(null);

  const selectGroup = (g: Group) =>
    setSelected({ key: g.key, label: countryNames[g.key] ?? g.key, items: g.items });

  // Clicking a highlighted country shows all of its deployments.
  const onMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const iso = (e.target as SVGElement).closest("path")?.getAttribute("data-iso");
    if (!iso || !activeCountries.has(iso)) return;
    const g = groups.find((x) => x.key === iso);
    if (g) selectGroup(g);
  };

  return (
    <div className="map-card reveal">
      <div className="map-wrap">
        <span className="map-badge">
          <Icon name="globe" /> Our footprint
        </span>
        <svg
          className="africa"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="Map of Africa showing where theParse software is deployed"
          onClick={onMapClick}
        >
          <g className="countries">
            {countries}
          </g>
          <g className="pins">
            {groups.map((g) => {
              const label = countryNames[g.key] ?? g.key;
              const isSel = selected?.key === g.key;
              return (
                <g
                  key={g.key}
                  className={`pin ${isSel ? "sel" : ""}`}
                  transform={`translate(${g.x} ${g.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${label}: ${g.items.length} project${g.items.length > 1 ? "s" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectGroup(g);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectGroup(g);
                    }
                  }}
                >
                  <circle className="hit" r="14" />
                  {(g.items.length >= 3 || isSel) && <circle className="pulse" r={radius(g.items.length)} />}
                  <circle className="dot" r={radius(g.items.length)} />
                  {g.items.length > 1 && (
                    <text className="count" dy="3.2">
                      {g.items.length}
                    </text>
                  )}
                  <g className="tag" transform={`translate(${radius(g.items.length) + 6} -12)`}>
                    <rect rx="7" height="24" width={label.length * 6.8 + 18} />
                    <text x="9" y="16">
                      {label}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="map-panel" aria-live="polite">
        {!selected ? (
          <div className="map-empty">
            <IconChip name="pin" />
            <h3>Explore our work across Africa</h3>
            <p>Click a location on the map to see the software solutions we&apos;ve deployed there.</p>
            <div className="map-stats">
              <div>
                <strong>{activeCountries.size}</strong>
                <span>Countries</span>
              </div>
              <div>
                <strong>{deployments.length}</strong>
                <span>Deployments</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="map-detail" key={selected.key}>
            <div className="map-detail-head">
              <div>
                <span className="eyebrow">
                  {selected.items.length} project{selected.items.length > 1 ? "s" : ""}
                </span>
                <h3>{selected.label}</h3>
              </div>
              <button className="theme-toggle" aria-label="Close details" onClick={() => setSelected(null)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="map-items">
              {selected.items.map((d) => (
                <article key={d.id} className="map-item">
                  <div className="map-item-top">
                    <span className="num">
                      {d.sector} · {d.year}
                    </span>
                  </div>
                  <h4>{d.title}</h4>
                  <p>{d.summary}</p>
                  <div className="map-item-meta">
                    <span>
                      <Icon name="pin" />
                      {d.city}, {countryNames[d.country] ?? d.country}
                    </span>
                    <span>
                      <Icon name="zap" />
                      {d.service}
                    </span>
                  </div>
                  <div className="tags">
                    {d.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
