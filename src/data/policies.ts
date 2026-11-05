import type { IconName } from "@/components/ui/Icon";

// Policy content migrated verbatim from the previous accordion pages.
// Section bodies are trusted, static HTML authored by theParse.
export type Policy = {
  id: string;
  slug: string;
  icon: IconName;
  name: string;
  desc: string;
  intro: string;
  sections: { title: string; html: string }[];
};

export const policies: Policy[] = [
  {
    "id": "privacy",
    "slug": "privacy-policy",
    "icon": "shield",
    "name": "Privacy Policy",
    "desc": "Learn how we collect, use, and protect your personal information at theParse.",
    "intro": "At <strong>theParse</strong>, your privacy is important to us. This Privacy Policy outlines how we collect, use, and protect your personal information in accordance with the Protection of Personal Information Act (POPIA).",
    "sections": [
      {
        "title": "Introduction",
        "html": "<p> This Privacy Policy explains how <strong>theParse</strong> handles your personal information in compliance with the POPIA (Protection of Personal Information Act) in South Africa. By using our services, you consent to the practices outlined in this policy. </p>"
      },
      {
        "title": "What Data We Collect",
        "html": "<p>We collect the following personal data when you interact with our services:</p> <ul> <li>Your name and contact details (email, phone number)</li> <li>Payment and billing information</li> <li>Usage data (IP address, browser type, and activity on our website)</li> </ul> <p>We collect this information when you register, fill out a form, or make purchases on our platform.</p>"
      },
      {
        "title": "How We Use Your Data",
        "html": "<p>The personal data we collect is used for the following purposes:</p> <ul> <li>To provide and maintain our services</li> <li>To process transactions and send confirmations</li> <li>To communicate with you regarding service updates, offers, and promotions (with your consent)</li> <li>To comply with legal obligations, including those under South African law</li> </ul>"
      },
      {
        "title": "Data Sharing and Third Parties",
        "html": "<p>We may share your personal data with trusted third parties, but only in the following cases:</p> <ul> <li>To comply with legal obligations</li> <li>With service providers (e.g., payment gateways, cloud storage) to facilitate our services</li> <li>In the event of a business transaction, such as a merger or acquisition</li> </ul> <p>We ensure that these third parties handle your information securely and in compliance with this Privacy Policy.</p>"
      },
      {
        "title": "How We Protect Your Data",
        "html": "<p>We take the security of your personal data seriously. Our security measures include:</p> <ul> <li>Data encryption during storage and transmission</li> <li>Regular security audits and system updates</li> <li>Strict access controls to sensitive data</li> </ul> <p>However, no method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>"
      },
      {
        "title": "Your Rights Regarding Your Data",
        "html": "<p>In accordance with South African law, you have the right to:</p> <ul> <li>Request access to the personal data we hold about you</li> <li>Request corrections or updates to your data</li> <li>Request deletion of your data</li> <li>Withdraw your consent to the processing of your data at any time</li> </ul> <p>To exercise these rights, contact us at info@theparse.co.za.</p>"
      },
      {
        "title": "Cookies and Tracking Technologies",
        "html": "<p>We use cookies and similar tracking technologies to enhance your browsing experience and collect analytics data. You can control cookie preferences through your browser settings.</p>"
      },
      {
        "title": "Changes to This Privacy Policy",
        "html": "<p> <strong>theParse</strong> reserves the right to update this Privacy Policy from time to time. Any changes will be posted on this page with a new \"Last Updated\" date. </p> <p>We encourage you to review this policy periodically to stay informed about how we protect your data.</p>"
      },
      {
        "title": "Contact Us",
        "html": "<p>If you have any questions or concerns regarding this Privacy Policy, please reach out to us:</p> <ul> <li>Email: info@theparse.co.za</li> <li>Phone: +27 (123) 456-7890</li> </ul>"
      }
    ]
  },
  {
    "id": "data",
    "slug": "data-policy",
    "icon": "db",
    "name": "Data Policy",
    "desc": "Understand how we handle, use, and protect your data at theParse.",
    "intro": "At <strong>theParse</strong>, we are committed to the responsible management of data. This Data Policy explains how we collect, use, store, and share data in compliance with applicable regulations.",
    "sections": [
      {
        "title": "Introduction",
        "html": "<p> This Data Policy outlines how <strong>theParse</strong> manages data, including personal and non-personal data, that is collected through our services and websites. By using our services, you agree to the practices described in this policy. </p>"
      },
      {
        "title": "Types of Data We Collect",
        "html": "<p>We collect various types of data, including but not limited to:</p> <ul> <li>Personal information such as name, email address, and phone number</li> <li>Transaction data including payment details and purchase history</li> <li>Technical data such as IP addresses, browser types, and usage information</li> <li>Cookies and tracking data to enhance user experience and for analytics</li> </ul>"
      },
      {
        "title": "How We Use Your Data",
        "html": "<p>The data we collect is used for the following purposes:</p> <ul> <li>To provide, operate, and improve our services</li> <li>To process payments and manage subscriptions</li> <li>To analyze usage patterns and improve user experience</li> <li>To comply with legal obligations, including data retention and reporting</li> </ul>"
      },
      {
        "title": "Data Sharing and Third-Party Services",
        "html": "<p>We may share data with third parties under specific conditions, such as:</p> <ul> <li>With service providers that assist us in delivering services (e.g., payment processors, cloud services)</li> <li>To comply with legal obligations, regulatory requests, or in response to legal processes</li> <li>During business transactions such as mergers or acquisitions, where data may be transferred as part of the business assets</li> </ul> <p>We ensure that any third party handling data does so in compliance with this policy and applicable laws.</p>"
      },
      {
        "title": "Data Security",
        "html": "<p>We prioritize the security of your data and employ industry-standard measures, including:</p> <ul> <li>Encryption of sensitive data both in transit and at rest</li> <li>Regular security audits and updates to mitigate risks</li> <li>Strict access controls to ensure that only authorized personnel can access certain data</li> </ul> <p>Despite our best efforts, no system can be completely secure, and we cannot guarantee the absolute security of your data.</p>"
      },
      {
        "title": "Your Data Rights",
        "html": "<p>You have the following rights with respect to your data, in accordance with applicable laws:</p> <ul> <li>Right to access the data we hold about you</li> <li>Right to request the correction or deletion of your data</li> <li>Right to withdraw consent for data processing where consent is required</li> <li>Right to object to or restrict the processing of your data</li> </ul> <p>To exercise these rights, please contact us at info@theparse.co.za.</p>"
      },
      {
        "title": "Data Retention Policy",
        "html": "<p>We retain your data only for as long as necessary to fulfill the purposes for which it was collected, including:</p> <ul> <li>As required by law (e.g., for tax or accounting purposes)</li> <li>To comply with legal obligations or resolve disputes</li> </ul> <p>Once data is no longer required, we take steps to securely delete or anonymize it.</p>"
      },
      {
        "title": "Cookies and Tracking Technologies",
        "html": "<p>We use cookies and similar tracking technologies to collect and store information when you use our services. These cookies are used to improve user experience and track analytics. You can manage your cookie preferences through your browser settings.</p>"
      },
      {
        "title": "Changes to This Data Policy",
        "html": "<p> <strong>theParse</strong> reserves the right to update this Data Policy as needed. We will notify you of any significant changes by updating the \"Last Updated\" date at the top of the policy. Please review this policy periodically to stay informed about how we handle your data. </p>"
      },
      {
        "title": "Contact Us",
        "html": "<p>If you have any questions or concerns about this Data Policy, feel free to reach out to us:</p> <ul> <li>Email: info@theparse.co.za</li> </ul>"
      }
    ]
  },
  {
    "id": "cookie",
    "slug": "cookie-policy",
    "icon": "cookie",
    "name": "Cookie Policy",
    "desc": "Learn how theParse uses cookies and tracking technologies to enhance your experience.",
    "intro": "At <strong>theParse</strong>, we use cookies and similar technologies to improve your experience on our website. This Cookie Policy explains what cookies are, how we use them, and how you can manage your cookie preferences.",
    "sections": [
      {
        "title": "What Are Cookies?",
        "html": "<p> Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your actions and preferences (such as login, language, and other display preferences) over a period of time. </p>"
      },
      {
        "title": "Types of Cookies We Use",
        "html": "<p>We use the following types of cookies on our website:</p> <ul> <li><strong>Strictly Necessary Cookies:</strong> These are essential for you to browse the website and use its features.</li> <li><strong>Performance Cookies:</strong> These cookies collect information about how you use our website (e.g., pages visited) to improve performance.</li> <li><strong>Functionality Cookies:</strong> These cookies allow the website to remember your preferences and provide enhanced functionality.</li> <li><strong>Targeting Cookies:</strong> These are used to deliver advertisements more relevant to you and your interests.</li> </ul>"
      },
      {
        "title": "Why We Use Cookies",
        "html": "<p> We use cookies to: </p> <ul> <li>Improve website functionality and user experience</li> <li>Analyze website traffic and user behavior</li> <li>Remember your preferences and settings</li> <li>Provide personalized content and targeted advertisements</li> </ul> <p>These cookies help us enhance your experience and improve the performance of our services.</p>"
      },
      {
        "title": "Managing Cookie Preferences",
        "html": "<p> You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, if you choose to block cookies, some features of our website may not function properly. </p> <ul> <li>Google Chrome: <a href=\"https://support.google.com/chrome/answer/95647\" target=\"_blank\" rel=\"noopener noreferrer\">Manage cookies</a></li> <li>Mozilla Firefox: <a href=\"https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer\" target=\"_blank\" rel=\"noopener noreferrer\">Manage cookies</a></li> <li>Safari: <a href=\"https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac\" target=\"_blank\" rel=\"noopener noreferrer\">Manage cookies</a></li> </ul>"
      },
      {
        "title": "Third-Party Cookies",
        "html": "<p> In addition to our own cookies, we use third-party cookies (such as from Google Analytics) to analyze website traffic and help us improve our services. These third-party services may also collect information about your browsing activity across other websites. </p> <p>We recommend reviewing the privacy policies of any third-party services to understand how they use your data.</p>"
      },
      {
        "title": "Changes to This Cookie Policy",
        "html": "<p> We may update this Cookie Policy from time to time to reflect changes in technology or legal requirements. Any updates will be posted on this page, and we encourage you to check this page periodically for any changes. </p>"
      },
      {
        "title": "Contact Us",
        "html": "<p>If you have any questions or concerns regarding our Cookie Policy, please contact us at:</p> <ul> <li>Email: info@theparse.co.za</li> </ul>"
      }
    ]
  },
  {
    "id": "terms",
    "slug": "terms-of-service",
    "icon": "scale",
    "name": "Terms of Service",
    "desc": "Understand the rules and regulations for using our services.",
    "intro": "By using our services, you agree to the following terms and conditions. Please read them carefully.",
    "sections": [
      {
        "title": "Introduction",
        "html": "<p> Welcome to <strong>theParse</strong>! These terms and conditions outline the rules and regulations for the use of our website and services. </p>"
      },
      {
        "title": "Acceptance of Terms",
        "html": "<p> By accessing or using our services, you agree to comply with and be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, you may not use our services. </p>"
      },
      {
        "title": "Modifications to the Terms",
        "html": "<p> <strong>theParse</strong> reserves the right to revise these terms at any time by posting updates on this page. Your continued use of the site after any changes constitutes acceptance of the new terms. </p>"
      },
      {
        "title": "Use of Services",
        "html": "<p> You are responsible for your use of the services and for any consequences thereof. Your use of the services must comply with all applicable laws and regulations. </p>"
      },
      {
        "title": "User Accounts",
        "html": "<p> In order to access certain features of our services, you may be required to create an account. You agree to provide accurate and complete information during registration and to keep your account information updated. </p>"
      },
      {
        "title": "Termination",
        "html": "<p> <strong>theParse</strong> reserves the right to terminate or suspend your account and access to our services at our sole discretion, without prior notice, for conduct that we believe violates these terms. </p>"
      },
      {
        "title": "Intellectual Property",
        "html": "<p> All content, trademarks, and other intellectual property on the <strong>theParse</strong> website are the property of <strong>theParse</strong> and/or its licensors. You may not use, copy, or distribute any content from the site without prior written permission. </p>"
      },
      {
        "title": "Limitation of Liability",
        "html": "<p> To the fullest extent permitted by law, <strong>theParse</strong> shall not be liable for any damages arising from your use of our services, including but not limited to direct, indirect, incidental, or consequential damages. </p>"
      },
      {
        "title": "Governing Law",
        "html": "<p> These terms are governed by and construed in accordance with the laws of the <strong>Republic of South Africa</strong>. You agree to submit to the exclusive jurisdiction of the courts located in South Africa for the resolution of any disputes. </p>"
      },
      {
        "title": "Contact Us",
        "html": "<p> If you have any questions about these Terms of Service, please contact us at info@theparse.co.za </p>"
      }
    ]
  }
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
