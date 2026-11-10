/** Horizontal sequence of step cards (Map → Streamline → Automate → Enhance). */
export default function ProcessFlow({ steps }: { steps: { n: string; t: string; d: string }[] }) {
  return (
    <ol className="auto-flow">
      {steps.map((s, k) => (
        <li key={s.n} className={`card reveal ${k ? `d${k}` : ""} ${k === steps.length - 1 ? "last" : ""}`}>
          <span className="num">{s.n}</span>
          <h3>{s.t}</h3>
          <p>{s.d}</p>
        </li>
      ))}
    </ol>
  );
}
