"use client";

import { useState } from "react";

/** Compact newsletter signup. Posts to the existing /api/subscribe route. */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 400) setStatus("You're already subscribed.");
      else if (res.ok) {
        setStatus("Subscribed! Check your inbox.");
        setEmail("");
      } else setStatus("Something went wrong. Please try again later.");
    } catch {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="news" onSubmit={onSubmit} noValidate>
        <input
          type="email"
          aria-label="Email address"
          placeholder="Get updates by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spin" /> : "Subscribe"}
        </button>
      </form>
      {status && <p className="news-msg" role="status">{status}</p>}
    </>
  );
}
