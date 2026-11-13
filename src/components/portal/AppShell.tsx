"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";
import Icon, { type IconName } from "./icons";

export type SubLink = { label: string; href: string; count?: number; hot?: boolean };
/** `when` is a regex source matched against the pathname; the group only shows when it matches. */
export type SubGroup = { title?: string; items: SubLink[]; when?: string };
export type RailSection = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  count?: number;
  groups: SubGroup[];
};
export type ShellUser = { name: string; email: string; initials: string; detail: string };

type Props = {
  label: string;
  homeHref: string;
  context: string;
  contextStatus?: { label: string; tone: "ok" | "warn" | "neutral" };
  tag?: string;
  sections: RailSection[];
  user: ShellUser;
  signOut: () => Promise<void>;
  panelFooter?: React.ReactNode;
  children: React.ReactNode;
};

const inSection = (s: RailSection, path: string) =>
  s.exact ? path === s.href : path === s.href || path.startsWith(`${s.href}/`);

export default function AppShell(p: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [hash, setHash] = useState("");

  // Next.js doesn't fire `hashchange` for <Link> navigations, so links also set this on click.
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const active = p.sections.find((s) => inSection(s, pathname)) ?? p.sections[0];
  const groups = active.groups.filter((g) => !g.when || new RegExp(g.when).test(pathname));
  const links = groups.flatMap((g) => g.items);

  const resolve = (href: string) => new URL(href, `http://x${pathname}`);
  const anchorHit = links.some((l) => {
    const u = resolve(l.href);
    return u.hash && u.pathname === pathname && u.hash === hash;
  });
  // Only compare ?status= when this section's links are status filters.
  const filters = links.some((l) => resolve(l.href).searchParams.has("status"));
  const isOn = (href: string) => {
    const u = resolve(href);
    if (u.pathname !== pathname) return false;
    if (u.hash) return u.hash === hash;
    if (anchorHit) return false;
    return !filters || (u.searchParams.get("status") ?? "") === (params.get("status") ?? "");
  };

  return (
    <div className="pt-app">
      <aside className="pt-rail">
        <Link href={p.homeHref} className="pt-rail-mark" aria-label="theParse home">
          <Image src="/images/logo/logo-2.png" alt="" width={800} height={251} priority />
        </Link>
        {p.tag ? <span className="pt-rail-tag">{p.tag}</span> : null}

        <nav aria-label={p.label} className="pt-rail-nav">
          {p.sections.map((s) => {
            const on = s === active;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`pt-rail-item ${on ? "on" : ""}`}
                aria-current={on ? "page" : undefined}
                aria-label={s.count ? `${s.label}, ${s.count} need attention` : s.label}
              >
                <Icon name={s.icon} />
                {s.count ? <span className="pt-rail-badge" aria-hidden="true">{s.count > 99 ? "99+" : s.count}</span> : null}
                <span className="pt-tip" aria-hidden="true">{s.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-rail-foot">
          <ThemeButton />
          <AccountMenu user={p.user} signOut={p.signOut} />
        </div>
      </aside>

      <aside className="pt-panel" aria-label={`${active.label} sections`}>
        <div className="pt-panel-head">
          <div className="pt-panel-ctx">
            <span>{p.context}</span>
            {p.contextStatus ? (
              <span className={`pt-panel-status ${p.contextStatus.tone}`}>{p.contextStatus.label}</span>
            ) : null}
          </div>
          <div className="pt-panel-title">{active.label}</div>
        </div>

        {groups.map((g, gi) => (
          <div key={g.title ?? gi} className="pt-panel-group">
            {g.title ? <div className="pt-panel-sec">{g.title}</div> : null}
            {g.items.map((l) => {
              const on = isOn(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`pt-subnav ${on ? "on" : ""}`}
                  aria-current={on ? "location" : undefined}
                  onClick={() => setHash(resolve(l.href).hash)}
                >
                  {l.label}
                  {l.count ? <span className={`pt-sub-count ${l.hot ? "hot" : ""}`}>{l.count}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}

        {p.panelFooter ? <div className="pt-panel-foot">{p.panelFooter}</div> : null}
      </aside>

      <main className="pt-main">{p.children}</main>
    </div>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme === "dark";
  const next = dark ? "light" : "dark";
  return (
    <button type="button" className="pt-rail-item" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`}>
      <Icon name={dark ? "sun" : "moon"} />
      <span className="pt-tip" aria-hidden="true">{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

function AccountMenu({ user, signOut }: { user: ShellUser; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pt-acct" ref={ref}>
      <button
        type="button"
        className="pt-acct-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account: ${user.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        {user.initials}
      </button>
      {open ? (
        <div className="pt-acct-menu" id={menuId}>
          <div className="pt-acct-who">
            <b>{user.name}</b>
            <span>{user.email}</span>
            <span>{user.detail}</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="pt-acct-out">
              <Icon name="signout" size={16} />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
