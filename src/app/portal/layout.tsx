import type { Metadata } from "next";
import "@/styles/portal.css";

export const metadata: Metadata = {
  title: { default: "Client portal", template: "%s | theParse portal" },
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="pt-body">{children}</div>;
}
