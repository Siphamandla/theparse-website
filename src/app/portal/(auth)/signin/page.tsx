import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authProviders } from "@/auth";
import { currentUser } from "@/lib/portal/session";
import { signInWithGoogle } from "./actions";
import SentPanel from "./SentPanel";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  NoAccount: "There's no portal account for that address. The portal is invite-only, so ask your theParse contact for an invite.",
  AccessDenied: "There's no portal account for that address. The portal is invite-only, so ask your theParse contact for an invite.",
  NoOrganisation: "Your account isn't linked to a client organisation any more. Contact info@theparse.co.za for help.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  OAuthAccountNotLinked: "That Google account can't be used here. Sign in with an email link instead.",
};

const features = [
  {
    title: "Follow progress",
    text: "See milestones and what's next on every project.",
    icon: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  },
  {
    title: "Share documents securely",
    text: "Proposals, contracts and reports, private to your team.",
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </>
    ),
  },
  {
    title: "Log requests",
    text: "Raise a request and get updates from our engineers.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
];

function BrandPanel() {
  return (
    <section className="pt-auth-brand">
      <Link href="/" aria-label="theParse home" style={{ alignSelf: "flex-start" }}>
        <Image src="/images/logo/logo-2.png" alt="theParse: bespoke, innovative and scalable software" width={800} height={251} priority />
      </Link>
      <div className="pt-auth-pitch">
        <div>
          <div className="pt-eyebrow">Client portal</div>
          <h2>Your projects, documents and requests in one place.</h2>
        </div>
        <ul className="pt-feats" style={{ listStyle: "none" }}>
          {features.map((f) => (
            <li key={f.title} className="pt-feat">
              <span className="pt-feat-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {f.icon}
                </svg>
              </span>
              <div>
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="pt-auth-foot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Single-use sign-in links · Your data is handled under POPIA
      </p>
    </section>
  );
}

export default async function SignInPage({ searchParams }: { searchParams: { sent?: string; error?: string; next?: string } }) {
  const user = await currentUser();
  if (user && !searchParams.error) redirect(user.staff ? "/admin" : "/portal");

  const error = searchParams.error ? errors[searchParams.error] ?? "Sign-in didn't work. Please try again." : null;

  return (
    <div className="pt-auth">
      <BrandPanel />
      <main className="pt-auth-main">
        <div className="pt-auth-inner">
          {searchParams.sent ? (
            <SentPanel next={searchParams.next} />
          ) : (
            <>
              <div>
                <h1 className="pt-h1">Sign in</h1>
                <p className="pt-sub">We&apos;ll email you a secure link. There&apos;s no password to remember.</p>
              </div>
              {error ? <div className="pt-alert error" role="alert">{error}</div> : null}
              <SignInForm next={searchParams.next} />
              {authProviders.google ? (
                <>
                  <div className="pt-divider">or</div>
                  <form action={signInWithGoogle}>
                    <input type="hidden" name="next" value={searchParams.next ?? ""} />
                    <button className="pt-ghost">Continue with Google</button>
                  </form>
                </>
              ) : null}
              <p className="pt-auth-note">
                New to theParse? The portal is invite-only. <Link className="pt-link" href="/contact">Get in touch</Link> and we&apos;ll set you up.
              </p>
              <Link className="pt-auth-back" href="/">← Back to theparse.co.za</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
