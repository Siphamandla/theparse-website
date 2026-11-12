"use client";

import { useFormStatus } from "react-dom";

/** A submit button that disables itself while its form's server action runs. */
export default function SubmitButton({
  children,
  pendingLabel,
  className = "pt-btn",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || rest.disabled} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
