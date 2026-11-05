"use client";

import { useEffect } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";

export type ModalType = "success" | "error" | "duplicate";

interface SubmissionModalProps {
  isOpen: boolean;
  type: ModalType;
  userEmail?: string;
  submissionId?: string;
  onClose: () => void;
}

const content: Record<ModalType, { cls: string; icon: IconName; title: string; button: string; message: (email?: string) => string }> = {
  success: {
    cls: "ok",
    icon: "checkc",
    title: "Thank you! Your enquiry has been received",
    button: "Close",
    message: (email) =>
      `A confirmation email has been sent to ${email}. Our team will review your enquiry and get back to you as soon as possible.`,
  },
  duplicate: {
    cls: "dup",
    icon: "info",
    title: "We already have your enquiry",
    button: "Got it",
    message: (email) =>
      `We've already received an enquiry from ${email}. Our team will be in touch shortly. Please check your email for updates.`,
  },
  error: {
    cls: "bad",
    icon: "x",
    title: "Oops! Something went wrong",
    button: "Close",
    message: () => "We couldn't submit your form. Please try again later or email us directly at info@theparse.co.za.",
  },
};

export default function SubmissionModal({ isOpen, type, userEmail, submissionId, onClose }: SubmissionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const c = content[type];

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className={`modal ${c.cls}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="ic-box"><Icon name={c.icon} /></span>
        <h3 id="modal-title">{c.title}</h3>
        <p>{c.message(userEmail)}</p>
        {submissionId && (
          <div className="sid">
            Submission ID
            <br />
            {submissionId}
          </div>
        )}
        <button className="btn btn-primary" onClick={onClose} autoFocus>
          {c.button}
        </button>
      </div>
    </div>
  );
}
