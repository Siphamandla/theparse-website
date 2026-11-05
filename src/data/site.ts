export const navLinks = [
  { title: "Home", path: "/" },
  { title: "Services", path: "/services" },
  { title: "AI", path: "/ai", badge: "New" },
  { title: "About", path: "/about" },
  { title: "Policies", path: "/policies" },
  { title: "Contact", path: "/contact" },
];

export const contactEmail = "info@theparse.co.za";

/**
 * Services offered in the contact form. `value` is stored in MongoDB and
 * `label` is used in the notification emails (see /api/contact).
 */
export const serviceOptions = [
  { value: "software_consulting", label: "Software Consulting" },
  { value: "website_development", label: "Website Development" },
  { value: "mobile_development", label: "Mobile Application Development" },
  { value: "iot_integration", label: "IoT, IIoT" },
  { value: "ai_customer_assistant", label: "AI Customer Assistant" },
  { value: "ai_document_automation", label: "AI Admin & Document Automation" },
  { value: "ai_forecasting", label: "AI Forecasting & Insights" },
  { value: "ai_strategy", label: "AI Strategy Session" },
  { value: "ai_bespoke", label: "Bespoke AI Solutions" },
  { value: "cloud_migration", label: "Cloud Migration Support" },
  { value: "ecommerce", label: "eCommerce Platform" },
];

export type ServiceOption = (typeof serviceOptions)[number];

export const servicesExplorer: Record<string, { title: string; desc: string }[]> = {
  Build: [
    { title: "Website Development", desc: "Fast, accessible web platforms and web apps built with modern frameworks." },
    { title: "Mobile Application Development", desc: "Bespoke iOS and Android apps with seamless, responsive interfaces." },
    { title: "eCommerce Platform", desc: "Online stores and commerce flows tailored to how you sell." },
    { title: "Fullstack Development", desc: "End-to-end systems that run efficiently behind the scenes." },
  ],
  AI: [
    { title: "AI Customer Assistants", desc: "Chat assistants on your website or WhatsApp that answer questions, take bookings and hand over to your team." },
    { title: "Admin & Document Automation", desc: "Read invoices, forms and contracts, capture the data and route it automatically." },
    { title: "Forecasting & Insights", desc: "Predict demand, stock and cash flow from the data you already have." },
    { title: "AI Strategy Session", desc: "Find the AI opportunities worth doing first, in plain language." },
    { title: "Bespoke AI Solutions", desc: "Custom AI designed and built around your data, processes and goals." },
  ],
  Data: [
    { title: "Advanced Analytics", desc: "Turn your data into decisions with dashboards and insight." },
    { title: "Reporting Automation", desc: "Live dashboards and scheduled reports, with no more spreadsheet wrangling." },
  ],
  Infrastructure: [
    { title: "Cloud Migration Support", desc: "Move and modernise with confidence, and scale infrastructure on demand." },
    { title: "IoT, IIoT & Edge", desc: "Connected devices, industrial telemetry and edge computing." },
  ],
  Advisory: [
    { title: "Software Consulting", desc: "Strategy, architecture and technical guidance from experienced engineers." },
    { title: "Digital Transformation", desc: "Modernise legacy systems and streamline processes end-to-end." },
  ],
};
