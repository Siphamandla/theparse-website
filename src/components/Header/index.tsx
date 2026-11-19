"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { navLinks } from "@/data/site";
import Icon, { Arrow } from "@/components/ui/Icon";

/** The sparkle on featured menu links (AI). Decorative: the link text says where it goes. */
const Sparkle = () => (
  <svg className="spark" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
  </svg>
);

const isActive = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname.startsWith(path);

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap">
          <Link href="/" className="logo" aria-label="theParse home">
            <Image
              src="/images/logo/logo-2.png"
              alt="theParse: bespoke, innovative and scalable software"
              width={800}
              height={251}
              style={{ height: 44, width: "auto" }}
              priority
            />
          </Link>

          <nav className="nav-links" aria-label="Main">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                href={l.path}
                className={`${isActive(pathname, l.path) ? "active" : ""} ${l.featured ? "nav-featured" : ""}`}
              >
                {l.featured ? (
                  <>
                    <Sparkle />
                    <span className="t">{l.title}</span>
                  </>
                ) : (
                  l.title
                )}
              </Link>
            ))}
          </nav>

          <div className="nav-right">
            <button
              className="theme-toggle"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <span className="i-sun"><Icon name="sun" /></span>
              <span className="i-moon"><Icon name="moon" /></span>
            </button>
            <Link href="/portal/signin" className="nav-login">
              Client login
            </Link>
            <Link href="/contact" className="btn btn-primary">
              Start a project <Arrow />
            </Link>
            <button
              className="theme-toggle burger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${open ? "open" : ""}`} aria-hidden={!open}>
        {navLinks.map((l) => (
          <Link key={l.path} href={l.path} className={`${isActive(pathname, l.path) ? "active" : ""} ${l.featured ? "nav-featured" : ""}`}>
            {l.featured ? <Sparkle /> : null}
            <span className="t">{l.title}</span>
          </Link>
        ))}
        <Link href="/portal/signin">Client login</Link>
        <Link href="/contact" className="btn btn-primary">
          Start a project <Arrow />
        </Link>
      </div>
    </>
  );
}
