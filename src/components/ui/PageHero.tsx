/** Hero banner used at the top of every sub-page. */
export default function PageHero({
  crumb,
  title,
  accent,
  lead,
  children,
  className = "",
  orbs = 1,
  style,
  backdrop,
}: {
  crumb: string;
  title: React.ReactNode;
  /** Gradient-highlighted ending of the title. */
  accent?: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  orbs?: 0 | 1 | 2;
  style?: React.CSSProperties;
  /** Decorative layer rendered behind the content. */
  backdrop?: React.ReactNode;
}) {
  return (
    <section className={`page-hero ${className}`} style={style}>
      <div className="grid-bg" />
      {orbs > 0 && <div className="orb o1" />}
      {orbs > 1 && <div className="orb o2" />}
      {backdrop}
      <div className="wrap" style={{ position: "relative" }}>
        <div className="crumbs">
          theparse / <b>{crumb}</b>
        </div>
        <h1>
          {title} {accent && <span className="grad-text">{accent}</span>}
        </h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
