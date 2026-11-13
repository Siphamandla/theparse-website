import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "../styles/index.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "theParse | Bespoke Software, Exceptional Solutions",
    template: "%s | theParse",
  },
  description:
    "theParse is a South African software engineering company delivering bespoke software, practical AI, cloud, mobile and web solutions.",
};

/**
 * Root layout: shared by the marketing site, the client portal and the admin
 * area. Site chrome (header, footer, analytics) lives in app/(site)/layout.tsx
 * so it never loads on /portal or /admin.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
