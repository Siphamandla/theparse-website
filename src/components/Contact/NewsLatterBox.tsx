"use client";
import { useState } from "react";
import { useTheme } from "next-themes";

const NewsLatterBox = () => {
  const { theme } = useTheme();

  // State variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false); // Loading spinner state
  const [formStatus, setFormStatus] = useState(''); // Success or error message
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({}); // Validation errors

  // Form validation
  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = "Valid email is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setFormStatus(''); // Reset status message

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const result = await res.json();

      if (res.status === 400) {
        setFormStatus('Email already exists. Please try another one.');
      } else if (res.ok) {
        setFormStatus('Subscribed successfully!');
        setName('');
        setEmail('');
      } else {
        setFormStatus('Error submitting form. Please try again later.');
      }
    } catch (error) {
      console.error('Error:', error);
      setFormStatus('Error submitting form. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 rounded-sm bg-white p-8 shadow-three dark:bg-gray-dark sm:p-11 lg:p-8 xl:p-11">
      <h3 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white">
        Subscribe to receive future updates
      </h3>
      <p className="mb-11 border-b border-body-color border-opacity-25 pb-11 text-base leading-relaxed text-body-color dark:border-white dark:border-opacity-25">
        Subscribe to our newsletter to stay informed about our latest updates, services, and special offers.
      </p>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-stroke mb-4 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-stroke mb-4 w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

          <button
            type="submit"
            className={`mb-5 flex w-full cursor-pointer items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white inline-block"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              'Subscribe'
            )}
          </button>

          {formStatus && <p className="mt-4 text-center text-sm text-green-600">{formStatus}</p>}
        </form>
      </div>
    </div>
  );
};

export default NewsLatterBox;