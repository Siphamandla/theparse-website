import Link from "next/link";
import Icon, { Arrow, IconBox, IconChip } from "@/components/ui/Icon";
import PageHero from "@/components/ui/PageHero";
import { contactEmail } from "@/data/site";
import { policies, type Policy } from "@/data/policies";
import PolicyToc, { PrintButton } from "./PolicyToc";

const readingMinutes = (p: Policy) => {
  const words = [p.intro, ...p.sections.map((s) => s.html)].join(" ").replace(/<[^>]+>/g, " ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

export function PolicyCards({ current }: { current?: string }) {
  return (
    <div className="pol-cards">
      {policies.map((p) => (
        <Link key={p.slug} href={`/policies/${p.slug}#policy`} className={`pol-card ${current === p.slug ? "on" : ""}`}>
          <IconChip name={p.icon} />
          <h4>{p.name}</h4>
          <p>{p.desc}</p>
          <small>{p.sections.length} sections</small>
        </Link>
      ))}
    </div>
  );
}

export function PoliciesHero({ current }: { current?: string }) {
  return (
    <PageHero
      crumb={current ? `policies / ${current}` : "policies"}
      title="Transparent by"
      accent="default."
      style={{ paddingBottom: "4rem" }}
      lead="We are committed to transparency and to keeping you informed. Choose a policy to read it in full."
    >
      <PolicyCards current={current} />
    </PageHero>
  );
}

export default function PolicyView({ policy }: { policy: Policy }) {
  return (
    <>
      <PoliciesHero current={policy.slug} />
      <section style={{ paddingTop: "4rem" }} id="policy">
        <div className="wrap policy-grid">
          <aside className="policy-side">
            <nav className="policy-nav" aria-label="Policies">
              {policies.map((p) => (
                <Link key={p.slug} href={`/policies/${p.slug}#policy`} className={p.slug === policy.slug ? "on" : ""}>
                  <Icon name={p.icon} />
                  {p.name}
                </Link>
              ))}
            </nav>
            <div className="toc">
              <div className="toc-h">
                <Icon name="list" /> On this page
              </div>
              <PolicyToc titles={policy.sections.map((s) => s.title)} />
            </div>
          </aside>

          <article className="policy-doc">
            <div className="doc-head">
              <div>
                <IconBox name={policy.icon} />
                <h2 className="doc-title">{policy.name}</h2>
                <div className="doc-meta">
                  <span>
                    <Icon name="list" />
                    {policy.sections.length} sections
                  </span>
                  <span>
                    <Icon name="clock" />
                    {readingMinutes(policy)} min read
                  </span>
                </div>
              </div>
              <PrintButton>
                <Icon name="print" />
                Print
              </PrintButton>
            </div>

            <p className="doc-intro" dangerouslySetInnerHTML={{ __html: policy.intro }} />

            {policy.sections.map((s, i) => (
              <section className="doc-sec" id={`sec-${i + 1}`} data-idx={i} key={s.title}>
                <h3>
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  {s.title}
                </h3>
                <div className="doc-body" dangerouslySetInnerHTML={{ __html: s.html }} />
              </section>
            ))}

            <div className="doc-contact">
              <div>
                <IconChip name="mail" />
                <div>
                  <strong>Questions about this policy?</strong>
                  <span>We&apos;re happy to help: {contactEmail}</span>
                </div>
              </div>
              <a className="btn btn-primary" href={`mailto:${contactEmail}`}>
                Email us <Arrow />
              </a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
