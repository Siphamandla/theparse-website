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

const PrivacyPolicy = () => {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="Privacy Policy"
        description="Learn how we collect, use, and protect your personal information at theParse."
      />

      {/* Privacy Policy Section */}
      <section className="pb-16 pt-16">
        <div className="container">
          <h2 className="text-center text-4xl font-bold mb-12">Privacy Policy</h2>
          <p className="text-center text-lg mb-8">
            At <strong>theParse</strong>, your privacy is important to us. This Privacy Policy outlines how we collect, use, and protect your personal information in accordance with the Protection of Personal Information Act (POPIA).
          </p>

          {/* Accordion for Privacy Policy */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AccordionItem title="1. Introduction">
              <p>
                This Privacy Policy explains how <strong>theParse</strong> handles your personal information in compliance with the POPIA (Protection of Personal Information Act) in South Africa. By using our services, you consent to the practices outlined in this policy.
              </p>
            </AccordionItem>

            <AccordionItem title="2. What Data We Collect">
              <p>We collect the following personal data when you interact with our services:</p>
              <ul className="list-disc pl-5">
                <li>Your name and contact details (email, phone number)</li>
                <li>Payment and billing information</li>
                <li>Usage data (IP address, browser type, and activity on our website)</li>
              </ul>
              <p>We collect this information when you register, fill out a form, or make purchases on our platform.</p>
            </AccordionItem>

            <AccordionItem title="3. How We Use Your Data">
              <p>The personal data we collect is used for the following purposes:</p>
              <ul className="list-disc pl-5">
                <li>To provide and maintain our services</li>
                <li>To process transactions and send confirmations</li>
                <li>To communicate with you regarding service updates, offers, and promotions (with your consent)</li>
                <li>To comply with legal obligations, including those under South African law</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="4. Data Sharing and Third Parties">
              <p>We may share your personal data with trusted third parties, but only in the following cases:</p>
              <ul className="list-disc pl-5">
                <li>To comply with legal obligations</li>
                <li>With service providers (e.g., payment gateways, cloud storage) to facilitate our services</li>
                <li>In the event of a business transaction, such as a merger or acquisition</li>
              </ul>
              <p>We ensure that these third parties handle your information securely and in compliance with this Privacy Policy.</p>
            </AccordionItem>

            <AccordionItem title="5. How We Protect Your Data">
              <p>We take the security of your personal data seriously. Our security measures include:</p>
              <ul className="list-disc pl-5">
                <li>Data encryption during storage and transmission</li>
                <li>Regular security audits and system updates</li>
                <li>Strict access controls to sensitive data</li>
              </ul>
              <p>However, no method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
            </AccordionItem>

            <AccordionItem title="6. Your Rights Regarding Your Data">
              <p>In accordance with South African law, you have the right to:</p>
              <ul className="list-disc pl-5">
                <li>Request access to the personal data we hold about you</li>
                <li>Request corrections or updates to your data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw your consent to the processing of your data at any time</li>
              </ul>
              <p>To exercise these rights, contact us at info@theparse.co.za.</p>
            </AccordionItem>

            <AccordionItem title="7. Cookies and Tracking Technologies">
              <p>We use cookies and similar tracking technologies to enhance your browsing experience and collect analytics data. You can control cookie preferences through your browser settings.</p>
            </AccordionItem>

            <AccordionItem title="8. Changes to This Privacy Policy">
              <p>
                <strong>theParse</strong> reserves the right to update this Privacy Policy from time to time. Any changes will be posted on this page with a new "Last Updated" date.
              </p>
              <p>We encourage you to review this policy periodically to stay informed about how we protect your data.</p>
            </AccordionItem>

            <AccordionItem title="9. Contact Us">
              <p>If you have any questions or concerns regarding this Privacy Policy, please reach out to us:</p>
              <ul>
                <li>Email: info@theparse.co.za</li>
                <li>Phone: +27 (123) 456-7890</li>
              </ul>
            </AccordionItem>
          </div>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicy;
