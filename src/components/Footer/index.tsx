import Image from "next/image";
import Link from "next/link";
import { CookieSettingsLink } from "@/components/Analytics";
import { contactEmail, linkedinUrl } from "@/data/site";
import NewsletterForm from "./NewsletterForm";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Workflow automation", href: "/automation" },
      { label: "AI services", href: "/ai" },
      { label: "Cloud migration", href: "/services" },
      { label: "Mobile & web", href: "/services" },
      { label: "IoT, IIoT", href: "/services" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/policies/privacy-policy" },
      { label: "Data policy", href: "/policies/data-policy" },
      { label: "Cookie policy", href: "/policies/cookie-policy" },
      { label: "Terms of service", href: "/policies/terms-of-service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot">
          <div>
            <Link href="/" className="logo" aria-label="theParse home">
              <Image src="/images/logo/logo-2.png" alt="theParse" width={800} height={251} style={{ height: 54, width: "auto" }} />
            </Link>
            <p>
              A South African software engineering company delivering intelligent, cloud-native,
              mobile and web solutions powered by AI, advanced analytics, IoT and edge computing.
            </p>
            <p style={{ marginTop: ".8rem" }}>
              <a href={`mailto:${contactEmail}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                {contactEmail}
              </a>
            </p>
            <div className="socials">
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="theParse on LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
              </a>
            </div>
            <NewsletterForm />
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h5>{c.title}</h5>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="big-word" aria-hidden="true">theParse</div>
        <div className="foot-bottom">
          <span>
            © {new Date().getFullYear()} theParse. All rights reserved. <CookieSettingsLink />
          </span>
          <span>
            Website by <b style={{ color: "var(--primary)" }}>theParse</b>
          </span>
        </div>
      </div>
    </footer>
  );
}
