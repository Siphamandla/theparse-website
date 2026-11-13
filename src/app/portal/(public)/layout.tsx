import Logo from "@/components/portal/Logo";

/** Sign-in and invite pages: logo bar only, no portal navigation. */
export default function PublicPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-public">
      <header className="pt-topbar">
        <div className="pt-topbar-in">
          <Logo />
          <span className="pt-muted" style={{ fontSize: 14 }}>Client portal</span>
        </div>
      </header>
      {children}
    </div>
  );
}
