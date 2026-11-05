"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon, { IconChip } from "@/components/ui/Icon";
import { prefersReducedMotion } from "@/components/ui/Effects";

type Scene = "chat" | "doc" | "cast";
const tabs: { id: Scene; label: string }[] = [
  { id: "chat", label: "Customer assistant" },
  { id: "doc", label: "Document capture" },
  { id: "cast", label: "Forecasting" },
];

const conversation: { who: "u" | "b"; text: string }[] = [
  { who: "u", text: "Hi, do you deliver to Soweto? And can I still order today?" },
  { who: "b", text: "Yes! We deliver to Soweto, Mon–Sat. Orders placed before 3pm go out today." },
  { who: "u", text: "Great. Can you book a delivery for Saturday morning?" },
  { who: "b", text: "Done. Saturday, 8–11am. I've sent the confirmation to your WhatsApp." },
];

const invoiceFields = [
  ["Supplier", "Mzansi Supplies"],
  ["Invoice #", "INV-2031"],
  ["Date", "2026-11-04"],
  ["VAT", "R 1,087.50"],
  ["Total", "R 8,337.50"],
];

const history = [42, 55, 48, 61, 58, 70];
const forecast = [78, 86];
const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];

/** Auto-playing, clickable preview of three AI use cases. Illustrative data only. */
export default function AiDemo() {
  const [scene, setScene] = useState<Scene>("chat");
  // `step` drives each scene's staged animation.
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = useCallback((s: Scene) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setScene(s);
    setStep(0);
    const reduce = prefersReducedMotion();
    const total = s === "chat" ? 6 : s === "doc" ? invoiceFields.length + 1 : history.length + forecast.length + 1;
    const gap = s === "chat" ? 1100 : s === "doc" ? 450 : 130;
    for (let k = 1; k <= total; k++) {
      timers.current.push(setTimeout(() => setStep(k), reduce ? 0 : 300 + k * gap));
    }
  }, []);

  useEffect(() => {
    play("chat");
    const pending = timers;
    return () => pending.current.forEach(clearTimeout);
  }, [play]);

  // Auto-advance to the next scene every 9 seconds.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setTimeout(() => {
      const next = tabs[(tabs.findIndex((x) => x.id === scene) + 1) % tabs.length].id;
      play(next);
    }, 9000);
    return () => clearTimeout(t);
  }, [scene, play]);

  // Chat: steps 1..6 → messages appear with a typing indicator before each bot reply.
  const chatVisible = () => {
    const shown: React.ReactNode[] = [];
    const schedule = [
      { at: 1, msg: 0 },
      { at: 2, typing: true },
      { at: 3, msg: 1 },
      { at: 4, msg: 2 },
      { at: 5, typing: true },
      { at: 6, msg: 3 },
    ];
    let typing = false;
    schedule.forEach((ev) => {
      if (step < ev.at) return;
      if (ev.typing) typing = true;
      if (ev.msg !== undefined) {
        typing = false;
        const m = conversation[ev.msg];
        shown.push(
          <div key={ev.msg} className={`msg ${m.who}`}>
            {m.who === "b" && <small>theParse AI assistant</small>}
            {m.text}
          </div>,
        );
      }
    });
    if (typing && step < 6)
      shown.push(
        <div key="typing" className="msg b typing">
          <i /><i /><i />
        </div>,
      );
    return shown;
  };

  return (
    <div className="demo reveal d1">
      <div className="demo-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={scene === t.id} className={scene === t.id ? "on" : ""} onClick={() => play(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="demo-stage">
        {scene === "chat" && chatVisible()}

        {scene === "doc" && (
          <div className="doc-wrap">
            <div className="invoice">
              <div className="scan" />
              <h5>TAX INVOICE · INV-2031</h5>
              <div className="ln"><span>Supplier</span><span>Mzansi Supplies (Pty) Ltd</span></div>
              <div className="ln"><span>Date</span><span>04 Nov 2026</span></div>
              <div className="ln"><span>Office chairs × 4</span><span>R 6,800.00</span></div>
              <div className="ln"><span>Delivery</span><span>R 450.00</span></div>
              <div className="ln"><span>VAT 15%</span><span>R 1,087.50</span></div>
              <div className="ln" style={{ color: "var(--text)", fontWeight: 700, border: 0 }}>
                <span>Total</span><span>R 8,337.50</span>
              </div>
            </div>
            <div className="fields">
              {invoiceFields.map(([a, b], k) => (
                <div key={a} className={`field ${step > k ? "show" : ""}`}>
                  <span>{a}</span>
                  <b>{b}</b>
                </div>
              ))}
              <div className={`field ok ${step > invoiceFields.length ? "show" : ""}`}>
                <Icon name="checkc" /> Sent to accounting
              </div>
            </div>
          </div>
        )}

        {scene === "cast" && (
          <>
            <div className="legend">
              <span><i style={{ background: "color-mix(in srgb,var(--muted) 35%,transparent)" }} />Actual sales</span>
              <span><i style={{ background: "var(--primary)" }} />AI forecast</span>
            </div>
            <div className="chart">
              {[...history, ...forecast].map((v, k) => (
                <div key={k} className={`bar ${k >= history.length ? "f" : ""}`} style={{ height: step > k ? `${v}%` : 0 }}>
                  <em>{months[k]}</em>
                </div>
              ))}
            </div>
            <div className={`cast-note ${step > 0 ? "show" : ""}`}>
              <span style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
                <IconChip name="package" />
                <span>
                  Peak season ahead: order extra stock of top sellers by <b>15 Nov</b>
                </span>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="demo-foot">
        <span className="pulse-dot" /> Live demo preview · illustrative data
      </div>
    </div>
  );
}
