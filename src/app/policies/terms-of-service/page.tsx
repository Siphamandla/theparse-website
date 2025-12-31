"use client";
import { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";

// Accordion component
const AccordionItem = ({ title, children }) => {
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

const TermsOfService = () => {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="Terms of Service"
        description="Understand the rules and regulations for using our services."
      />

      {/* Terms of Service Section */}
      <section className="pb-16 pt-16">
        <div className="container">
          <h2 className="text-center text-4xl font-bold mb-12">Terms of Service</h2>
          <p className="text-center text-lg mb-8">
            By using our services, you agree to the following terms and conditions. Please read them carefully.
          </p>

          {/* Accordion for Terms of Service */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AccordionItem title="1. Introduction">
              <p>
                Welcome to <strong>theParse</strong>! These terms and conditions outline the rules and regulations for the use of our website and services.
              </p>
            </AccordionItem>

            <AccordionItem title="2. Acceptance of Terms">
              <p>
                By accessing or using our services, you agree to comply with and be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, you may not use our services.
              </p>
            </AccordionItem>

            <AccordionItem title="3. Modifications to the Terms">
              <p>
                <strong>theParse</strong> reserves the right to revise these terms at any time by posting updates on this page. Your continued use of the site after any changes constitutes acceptance of the new terms.
              </p>
            </AccordionItem>

            <AccordionItem title="4. Use of Services">
              <p>
                You are responsible for your use of the services and for any consequences thereof. Your use of the services must comply with all applicable laws and regulations.
              </p>
            </AccordionItem>

            <AccordionItem title="5. User Accounts">
              <p>
                In order to access certain features of our services, you may be required to create an account. You agree to provide accurate and complete information during registration and to keep your account information updated.
              </p>
            </AccordionItem>

            <AccordionItem title="6. Termination">
              <p>
                <strong>theParse</strong> reserves the right to terminate or suspend your account and access to our services at our sole discretion, without prior notice, for conduct that we believe violates these terms.
              </p>
            </AccordionItem>

            <AccordionItem title="7. Intellectual Property">
              <p>
                All content, trademarks, and other intellectual property on the <strong>theParse</strong> website are the property of <strong>theParse</strong> and/or its licensors. You may not use, copy, or distribute any content from the site without prior written permission.
              </p>
            </AccordionItem>

            <AccordionItem title="8. Limitation of Liability">
              <p>
                To the fullest extent permitted by law, <strong>theParse</strong> shall not be liable for any damages arising from your use of our services, including but not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </AccordionItem>

            <AccordionItem title="9. Governing Law">
              <p>
                These terms are governed by and construed in accordance with the laws of the <strong>Republic of South Africa</strong>. You agree to submit to the exclusive jurisdiction of the courts located in South Africa for the resolution of any disputes.
              </p>
            </AccordionItem>

            <AccordionItem title="10. Contact Us">
              <p>
                If you have any questions about these Terms of Service, please contact us at info@theparse.co.za
              </p>
            </AccordionItem>
          </div>
        </div>
      </section>
    </>
  );
};

export default TermsOfService;