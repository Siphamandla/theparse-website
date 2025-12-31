"use client";
import { useState } from "react";
import Multiselect from './MultiSelect';
import NewsLatterBox from "./NewsLatterBox";
import SubmissionModal from "./SubmissionModal";

const productList = [
  { value: "software_consulting", label: "Software Consulting" },
  { value: "website_development", label: "Website Development" },
  { value: "mobile_development", label: "Mobile Application Development" },
  { value: "iot_integration", label: "IoT, IIoT" },
  { value: "ai_integration", label: "AI Integration" },
  { value: "cloud_migration", label: "Cloud Migration Support" },
  { value: "ecommerce", label: "eCommerce Platform" }
];

interface Errors {
  name?: string;
  email?: string;
  message?: string;
  products?: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'duplicate';
  userEmail?: string;
  submissionId?: string;
}

const Contact = () => {
  // State for form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [formStatus, setFormStatus] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for the button
  const [errors, setErrors] = useState<Errors>({});// State to handle validation errors
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: 'success' });

  // Basic form validation
  const validateForm = () => {
    const newErrors: any = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!message.trim()) newErrors.message = "Message is required";
    if (products.length === 0) newErrors.products = "Please select at least one service";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearfields = () => {
    setName('');
    setEmail('');
    setMessage('');
    setProducts([]);
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form inputs before submission
    if (!validateForm()) {
      return;
    }
  
    setLoading(true); // Start the loading spinner
    const formData = { name, email, message, products };
  
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      const result = await res.json(); // Parse JSON response
  
      if (res.status === 400) {
        // Handle duplicate email error
        setModalState({
          isOpen: true,
          type: 'duplicate',
          userEmail: email,
        });
        clearfields();
      } else if (res.ok) {
        // Handle successful form submission
        setModalState({
          isOpen: true,
          type: 'success',
          userEmail: email,
          submissionId: result.result?.insertedId,
        });
        clearfields();
      } else {
        // Handle other types of errors (like 500 server errors)
        setModalState({
          isOpen: true,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setModalState({
        isOpen: true,
        type: 'error',
      });
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'success' });
  };

  return (
    <section id="contact" className="overflow-hidden py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
            <div
              className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
              data-wow-delay=".15s"
            >
              <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                In Need of Custom Software Solutions?
              </h2>
              <p className="mb-12 text-base font-medium text-body-color">
                Ready to get started? Tell us about your software needs in the form below. Our team will carefully review your inquiry and connect with you to explore the best solutions for your business.
              </p>

              {/* Handle form submission */}
              <form onSubmit={handleSubmit}>
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-8">
                      <label
                        htmlFor="name"
                        className="mb-3 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-8">
                      <label
                        htmlFor="email"
                        className="mb-3 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Email
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="w-full px-4 mb-4">
                    <label
                      htmlFor="products"
                      className="mb-3 block text-sm font-medium text-dark dark:text-white"
                    >
                      Select a Service Offering
                    </label>
                    <div className="form-group">
                      <Multiselect
                        required
                        options={productList}
                        selected={products}
                        setSelected={setProducts}
                        labelname=""    // Add the labelname prop
                        Iwidth="100%"                  // Add the Iwidth prop
                        placeholder="Choose services" 
                      />
                      {errors.products && <p className="text-red-600 text-sm">{errors.products}</p>}
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <div className="mb-8">
                      <label
                        htmlFor="message"
                        className="mb-3 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Message
                      </label>
                      <textarea
                        name="message"
                        rows={5}
                        placeholder="Enter your Message"
                        className="border-stroke w-full resize-none rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      ></textarea>
                      {errors.message && <p className="text-red-600 text-sm">{errors.message}</p>}
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <button
                      type="submit"
                      className={`rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark ${
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
                        'Submit Request'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Submission Modal */}
              <SubmissionModal 
                isOpen={modalState.isOpen}
                type={modalState.type}
                userEmail={modalState.userEmail}
                submissionId={modalState.submissionId}
                onClose={closeModal}
              />
            </div>
          </div>
          <div className="w-full px-4 lg:w-5/12 xl:w-4/12">
            <NewsLatterBox />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;