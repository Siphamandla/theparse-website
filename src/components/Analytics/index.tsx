"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Google Analytics 4 with Google Consent Mode v2.
 *
 * Set NEXT_PUBLIC_GA_ID (e.g. "G-XXXXXXXXXX") to enable it. Without it, nothing
 * is loaded and no banner is shown.
 *
 * Analytics cookies are only set once the visitor accepts in the banner. Until
 * then, consent is "denied" and Google receives cookieless pings only. Ad
 * cookies are always denied (the site doesn't run ads).
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const STORAGE_KEY = "tp-cookie-consent";
const OPEN_EVENT = "tp:cookie-settings";

type Choice = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

/** Remove GA cookies (_ga, _ga_XXXX) when a visitor withdraws consent. */
function clearGaCookies() {
  const host = location.hostname;
  const domains = [
    "",
    host,
    `.${host}`,
    `.${host.split(".").slice(-3).join(".")}`,
    `.${host.split(".").slice(-2).join(".")}`,
  ];
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (!name.startsWith("_ga")) return;
    domains.forEach((d) => {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
    });
  });
}

/** Opens the consent banner again (used by the footer's "Cookie settings" link). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function Analytics() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    if (!readChoice()) setOpen(true);
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  if (!GA_ID) return null;

  const choose = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {}
    window.gtag?.("consent", "update", { analytics_storage: choice });
    if (choice === "denied") clearGaCookies();
    setOpen(false);
  };

  return (
    <>
      <Script id="ga-consent" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});}catch(e){}
gtag('consent','default',{analytics_storage:c==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {open && (
        <div
          className="cookie-bar"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie preferences"
        >
          <p>
            <b>We use cookies.</b> Analytics cookies help us understand how the
            site is used so we can improve it. They&apos;re only set if you
            accept. <Link href="/policies/cookie-policy">Cookie policy</Link>
          </p>
          <div className="cookie-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => choose("denied")}
            >
              Decline
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => choose("granted")}
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that reopens the banner. Hidden when analytics isn't configured. */
export function CookieSettingsLink() {
  if (!GA_ID) return null;
  return (
    <button type="button" className="cookie-link" onClick={openCookieSettings}>
      Cookie settings
    </button>
  );
}
