import Image from "next/image";
import Link from "next/link";
import { contactEmail } from "@/data/site";
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
              A South African software innovation company delivering intelligent, cloud-native,
              mobile and web solutions powered by AI, advanced analytics, IoT and edge computing.
            </p>
            <p style={{ marginTop: ".8rem" }}>
              <a href={`mailto:${contactEmail}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                {contactEmail}
              </a>
            </p>
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
          <span>© {new Date().getFullYear()} theParse. All rights reserved.</span>
          <span>
            Website by <b style={{ color: "var(--primary)" }}>theParse</b>
          </span>
        </div>
      </div>
    </footer>
  );
}
