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

const DataPolicy = () => {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="Data Policy"
        description="Understand how we handle, use, and protect your data at theParse."
      />

      {/* Data Policy Section */}
      <section className="pb-16 pt-16">
        <div className="container">
          <h2 className="text-center text-4xl font-bold mb-12">Data Policy</h2>
          <p className="text-center text-lg mb-8">
            At <strong>theParse</strong>, we are committed to the responsible management of data. This Data Policy explains how we collect, use, store, and share data in compliance with applicable regulations.
          </p>

          {/* Accordion for Data Policy */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AccordionItem title="1. Introduction">
              <p>
                This Data Policy outlines how <strong>theParse</strong> manages data, including personal and non-personal data, that is collected through our services and websites. By using our services, you agree to the practices described in this policy.
              </p>
            </AccordionItem>

            <AccordionItem title="2. Types of Data We Collect">
              <p>We collect various types of data, including but not limited to:</p>
              <ul className="list-disc pl-5">
                <li>Personal information such as name, email address, and phone number</li>
                <li>Transaction data including payment details and purchase history</li>
                <li>Technical data such as IP addresses, browser types, and usage information</li>
                <li>Cookies and tracking data to enhance user experience and for analytics</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="3. How We Use Your Data">
              <p>The data we collect is used for the following purposes:</p>
              <ul className="list-disc pl-5">
                <li>To provide, operate, and improve our services</li>
                <li>To process payments and manage subscriptions</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To comply with legal obligations, including data retention and reporting</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="4. Data Sharing and Third-Party Services">
              <p>We may share data with third parties under specific conditions, such as:</p>
              <ul className="list-disc pl-5">
                <li>With service providers that assist us in delivering services (e.g., payment processors, cloud services)</li>
                <li>To comply with legal obligations, regulatory requests, or in response to legal processes</li>
                <li>During business transactions such as mergers or acquisitions, where data may be transferred as part of the business assets</li>
              </ul>
              <p>We ensure that any third party handling data does so in compliance with this policy and applicable laws.</p>
            </AccordionItem>

            <AccordionItem title="5. Data Security">
              <p>We prioritize the security of your data and employ industry-standard measures, including:</p>
              <ul className="list-disc pl-5">
                <li>Encryption of sensitive data both in transit and at rest</li>
                <li>Regular security audits and updates to mitigate risks</li>
                <li>Strict access controls to ensure that only authorized personnel can access certain data</li>
              </ul>
              <p>Despite our best efforts, no system can be completely secure, and we cannot guarantee the absolute security of your data.</p>
            </AccordionItem>

            <AccordionItem title="6. Your Data Rights">
              <p>You have the following rights with respect to your data, in accordance with applicable laws:</p>
              <ul className="list-disc pl-5">
                <li>Right to access the data we hold about you</li>
                <li>Right to request the correction or deletion of your data</li>
                <li>Right to withdraw consent for data processing where consent is required</li>
                <li>Right to object to or restrict the processing of your data</li>
              </ul>
              <p>To exercise these rights, please contact us at info@theparse.co.za.</p>
            </AccordionItem>

            <AccordionItem title="7. Data Retention Policy">
              <p>We retain your data only for as long as necessary to fulfill the purposes for which it was collected, including:</p>
              <ul className="list-disc pl-5">
                <li>As required by law (e.g., for tax or accounting purposes)</li>
                <li>To comply with legal obligations or resolve disputes</li>
              </ul>
              <p>Once data is no longer required, we take steps to securely delete or anonymize it.</p>
            </AccordionItem>

            <AccordionItem title="8. Cookies and Tracking Technologies">
              <p>We use cookies and similar tracking technologies to collect and store information when you use our services. These cookies are used to improve user experience and track analytics. You can manage your cookie preferences through your browser settings.</p>
            </AccordionItem>

            <AccordionItem title="9. Changes to This Data Policy">
              <p>
                <strong>theParse</strong> reserves the right to update this Data Policy as needed. We will notify you of any significant changes by updating the "Last Updated" date at the top of the policy. Please review this policy periodically to stay informed about how we handle your data.
              </p>
            </AccordionItem>

            <AccordionItem title="10. Contact Us">
              <p>If you have any questions or concerns about this Data Policy, feel free to reach out to us:</p>
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

export default DataPolicy;
