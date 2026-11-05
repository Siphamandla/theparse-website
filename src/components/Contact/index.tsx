"use client";

import { useState } from "react";
import Icon, { Arrow } from "@/components/ui/Icon";
import { contactEmail, serviceOptions, type ServiceOption } from "@/data/site";
import SubmissionModal, { type ModalType } from "./SubmissionModal";

interface Errors {
  name?: string;
  email?: string;
  message?: string;
  products?: string;
}

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  userEmail?: string;
  submissionId?: string;
}

/** "Start a project" card with the contact form. Submits to /api/contact. */
export default function Contact({
  title = "Tell us what you're building.",
  preselect = [],
}: {
  title?: string;
  /** Service values to pre-select, e.g. from an AI page CTA. */
  preselect?: string[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<ServiceOption[]>(
    serviceOptions.filter((o) => preselect.includes(o.value)),
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: "success" });

  const toggle = (opt: ServiceOption) =>
    setProducts((cur) =>
      cur.some((p) => p.value === opt.value) ? cur.filter((p) => p.value !== opt.value) : [...cur, opt],
    );

  const validate = () => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Please enter a valid email";
    if (!message.trim()) e.message = "Message is required";
    if (products.length === 0) e.products = "Please select at least one service";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clear = () => {
    setName("");
    setEmail("");
    setMessage("");
    setProducts([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, products }),
      });
      const result = await res.json();
      if (res.status === 400) {
        setModal({ isOpen: true, type: "duplicate", userEmail: email });
        clear();
      } else if (res.ok) {
        setModal({
          isOpen: true,
          type: "success",
          userEmail: email,
          submissionId: result.result?.insertedId,
        });
        clear();
      } else {
        setModal({ isOpen: true, type: "error" });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setModal({ isOpen: true, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap" id="contact">
      <div className="cta-card reveal">
        <div>
          <span className="eyebrow">Start a project</span>
          <h2>{title}</h2>
          <p className="lead">
            Tell us about your software needs and choose the services you&apos;re interested in.
            Our team will review your enquiry and get back to you.
          </p>
          <div className="contact-lines">
            <a href={`mailto:${contactEmail}`}>
              <span className="ic"><Icon name="mail" /></span>
              {contactEmail}
            </a>
            <a href="https://theparse.co.za">
              <span className="ic"><Icon name="link" /></span>
              theparse.co.za
            </a>
            <span className="contact-line">
              <span className="ic"><Icon name="pin" /></span>
              South Africa · working globally
            </span>
          </div>
        </div>

        <form className="f" onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div>
              <label htmlFor="c-name">Name</label>
              <input id="c-name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="err">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="c-email">Email</label>
              <input
                id="c-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="err">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label id="c-services">Services</label>
            <div className="chips" role="group" aria-labelledby="c-services">
              {serviceOptions.map((o) => {
                const on = products.some((p) => p.value === o.value);
                return (
                  <button type="button" key={o.value} className={on ? "on" : ""} aria-pressed={on} onClick={() => toggle(o)}>
                    {o.label}
                  </button>
                );
              })}
            </div>
            {errors.products && <p className="err">{errors.products}</p>}
          </div>
          <div>
            <label htmlFor="c-msg">Message</label>
            <textarea
              id="c-msg"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {errors.message && <p className="err">{errors.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spin" /> Submitting…
              </>
            ) : (
              <>
                Send message <Arrow />
              </>
            )}
          </button>
        </form>
      </div>

      <SubmissionModal
        isOpen={modal.isOpen}
        type={modal.type}
        userEmail={modal.userEmail}
        submissionId={modal.submissionId}
        onClose={() => setModal({ isOpen: false, type: "success" })}
      />
    </div>
  );
}
