"use client";

import { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";

// Accordion component
const AccordionItem = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        className="flex justify-between w-full p-4 text-left text-lg font-medium text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <span>{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && (
        <div className="p-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
};

const CookiePolicy = () => {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="Cookie Policy"
        description="Learn how theParse uses cookies and tracking technologies to enhance your experience."
      />

      {/* Cookie Policy Section */}
      <section className="pb-16 pt-16">
        <div className="container">
          <h2 className="text-center text-4xl font-bold mb-12">Cookie Policy</h2>
          <p className="text-center text-lg mb-8">
            At <strong>theParse</strong>, we use cookies and similar technologies to improve your experience on our website. This Cookie Policy explains what cookies are, how we use them, and how you can manage your cookie preferences.
          </p>

          {/* Accordion for Cookie Policy */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Section 1: Introduction */}
            <AccordionItem title="1. What Are Cookies?">
              <p>
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your actions and preferences (such as login, language, and other display preferences) over a period of time.
              </p>
            </AccordionItem>

            {/* Section 2: Types of Cookies We Use */}
            <AccordionItem title="2. Types of Cookies We Use">
              <p>We use the following types of cookies on our website:</p>
              <ul className="list-disc pl-5">
                <li><strong>Strictly Necessary Cookies:</strong> These are essential for you to browse the website and use its features.</li>
                <li><strong>Performance Cookies:</strong> These cookies collect information about how you use our website (e.g., pages visited) to improve performance.</li>
                <li><strong>Functionality Cookies:</strong> These cookies allow the website to remember your preferences and provide enhanced functionality.</li>
                <li><strong>Targeting Cookies:</strong> These are used to deliver advertisements more relevant to you and your interests.</li>
              </ul>
            </AccordionItem>

            {/* Section 3: Why We Use Cookies */}
            <AccordionItem title="3. Why We Use Cookies">
              <p>
                We use cookies to:
              </p>
              <ul className="list-disc pl-5">
                <li>Improve website functionality and user experience</li>
                <li>Analyze website traffic and user behavior</li>
                <li>Remember your preferences and settings</li>
                <li>Provide personalized content and targeted advertisements</li>
              </ul>
              <p>These cookies help us enhance your experience and improve the performance of our services.</p>
            </AccordionItem>

            {/* Section 4: Managing Cookie Preferences */}
            <AccordionItem title="4. Managing Cookie Preferences">
              <p>
                You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, if you choose to block cookies, some features of our website may not function properly.
              </p>
              <ul className="list-disc pl-5">
                <li>Google Chrome: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Manage cookies</a></li>
                <li>Mozilla Firefox: <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Manage cookies</a></li>
                <li>Safari: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Manage cookies</a></li>
              </ul>
            </AccordionItem>

            {/* Section 5: Third-Party Cookies */}
            <AccordionItem title="5. Third-Party Cookies">
              <p>
                In addition to our own cookies, we use third-party cookies (such as from Google Analytics) to analyze website traffic and help us improve our services. These third-party services may also collect information about your browsing activity across other websites.
              </p>
              <p>We recommend reviewing the privacy policies of any third-party services to understand how they use your data.</p>
            </AccordionItem>

            {/* Section 6: Updates to This Cookie Policy */}
            <AccordionItem title="6. Changes to This Cookie Policy">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in technology or legal requirements. Any updates will be posted on this page, and we encourage you to check this page periodically for any changes.
              </p>
            </AccordionItem>

            {/* Section 7: Contact Us */}
            <AccordionItem title="7. Contact Us">
              <p>If you have any questions or concerns regarding our Cookie Policy, please contact us at:</p>
              <ul>
                <li>Email: info@theparse.co.za</li>
              </ul>
            </AccordionItem>
          </div>
        </div>
      </section>
    </>
  );
};

export default CookiePolicy;