import { redirect } from "next/navigation";

/** The portal is invite-only: people without an invite start with the contact form. */
export default function SignupPage() {
  redirect("/contact");
}
