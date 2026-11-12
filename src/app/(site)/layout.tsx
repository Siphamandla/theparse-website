import Analytics from "@/components/Analytics";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { RevealObserver, Spotlight } from "@/components/ui/Effects";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <noscript>
        <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <Spotlight />
      <Header />
      <main>{children}</main>
      <Footer />
      <RevealObserver />
      <Analytics />
    </>
  );
}
