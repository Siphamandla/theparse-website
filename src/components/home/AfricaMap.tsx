import { africaCountries } from "@/data/africaMap";
import { deployments } from "@/data/deployments";
import AfricaMapInteractive from "./AfricaMapInteractive";

/**
 * "Our footprint" section. Country shapes are rendered on the server (keeping the
 * ~29 KB of map paths out of the client bundle); pins and the details panel are
 * handled by the client component.
 */
export default function AfricaMap() {
  const active = new Set(deployments.map((d) => d.country));
  const countryNames = Object.fromEntries(
    africaCountries.map((c) => [c.iso, c.name]),
  );

  const countries = africaCountries.map((c) => (
    <path
      key={c.iso + c.name}
      d={c.d}
      data-iso={c.iso}
      className={active.has(c.iso) ? "on" : undefined}
    >
      <title>{c.name}</title>
    </path>
  ));

  return (
    <section id="footprint" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head">
          <div className="reveal">
            <span className="eyebrow">Our footprint</span>
            <h2>
              Built in Africa,
              <br />
              <span className="grad-text">running across Africa.</span>
            </h2>
          </div>
          <p className="lead reveal d1">
            Our software solutions are deployed across the continent. Click a
            location to explore the work.
          </p>
        </div>
        <AfricaMapInteractive
          countries={countries}
          countryNames={countryNames}
        />
      </div>
    </section>
  );
}
