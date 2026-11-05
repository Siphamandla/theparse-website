import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { RevealObserver, Spotlight } from "@/components/ui/Effects";
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
    "theParse is a South African software innovation company delivering bespoke software, practical AI, cloud, mobile and web solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>
          <Spotlight />
          <Header />
          <main>{children}</main>
          <Footer />
          <RevealObserver />
        </Providers>
      </body>
    </html>
  );
}
