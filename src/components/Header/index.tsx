"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { navLinks } from "@/data/site";
import Icon, { Arrow } from "@/components/ui/Icon";

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
                className={`${isActive(pathname, l.path) ? "active" : ""} ${l.badge ? "ai-link" : ""}`}
              >
                {l.title}
                {l.badge && <i>{l.badge}</i>}
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
          <Link key={l.path} href={l.path} className={isActive(pathname, l.path) ? "active" : ""}>
            {l.title}
          </Link>
        ))}
        <Link href="/contact" className="btn btn-primary">
          Start a project <Arrow />
        </Link>
      </div>
    </>
  );
}
