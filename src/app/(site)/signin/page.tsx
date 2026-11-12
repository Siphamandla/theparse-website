import { redirect } from "next/navigation";

/** The client portal has its own sign-in page. */
export default function SigninPage() {
  redirect("/portal/signin");
}
