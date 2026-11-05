import type { IconName } from "@/components/ui/Icon";

export type AiOffering = {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  example: string;
  tags: string[];
  layout?: "feat" | "wide";
  cta?: { label: string };
};

export const aiOfferings: AiOffering[] = [
  {
    id: "assist",
    icon: "chat",
    title: "AI Customer Assistant",
    desc: "A smart assistant on your website or WhatsApp that answers customer questions 24/7, takes bookings and hands over to a person when needed.",
    example: "A clinic's assistant answers \"Are you open Saturday?\" and books the appointment, even at 11pm.",
    tags: ["Website", "WhatsApp", "Bookings"],
    layout: "feat",
  },
  {
    id: "docs",
    icon: "file",
    title: "Admin & Document Automation",
    desc: "Reads invoices, forms, IDs and contracts, captures the data and sends it to the right system.",
    example: "Supplier invoices from email go straight into your accounting software, with no retyping.",
    tags: ["Invoices", "Forms", "Accounting"],
  },
  {
    id: "know",
    icon: "book",
    title: "Company Knowledge Assistant",
    desc: "Ask questions in plain language and get answers from your own policies, manuals and documents.",
    example: "A new hire asks \"How do I log a leave request?\" and gets the answer with a link to the policy.",
    tags: ["Onboarding", "Policies", "Internal"],
  },
  {
    id: "cast",
    icon: "trend",
    title: "Forecasting & Business Insights",
    desc: "Predicts demand, stock levels and cash flow from your sales history, and explains the why.",
    example: "A retailer sees next month's top sellers early and orders the right stock ahead of peak season.",
    tags: ["Sales", "Stock", "Cash flow"],
  },
  {
    id: "flow",
    icon: "flow",
    title: "Workflow Automation & AI Agents",
    desc: "Hands repetitive back-office tasks like email triage, follow-ups, reports and scheduling to AI agents.",
    example: "Every Monday a sales report is compiled, summarised and emailed to the team automatically.",
    tags: ["Email", "Reports", "Scheduling"],
  },
  {
    id: "vision",
    icon: "camera",
    title: "Smart Cameras & IoT Monitoring",
    desc: "Computer vision and connected sensors that spot issues on-site, from safety risks to quality checks and stock counts.",
    example: "A forecourt camera flags spills or blocked bays and alerts the manager on their phone.",
    tags: ["IoT", "Safety", "Quality"],
  },
  {
    id: "strat",
    icon: "compass",
    title: "AI Strategy Session",
    desc: "Not sure where to start? We map your processes, find the quick wins and give you a clear, costed roadmap.",
    example: "In one session, a logistics firm identifies three tasks that AI could take on first.",
    tags: ["Roadmap", "Quick wins", "Training"],
    layout: "feat",
    cta: { label: "Book your free session" },
  },
  {
    id: "bespoke",
    icon: "cpu",
    title: "Bespoke AI Solutions",
    desc: "Got a problem none of the above quite covers? We design, train and build a custom AI solution around your data, your processes and your goals, from first prototype to production.",
    example: "A manufacturer gets a custom model that predicts machine faults from sensor data before breakdowns happen.",
    tags: ["Custom models", "Your data", "End-to-end"],
    layout: "wide",
    cta: { label: "Discuss your idea" },
  },
];

export const aiFinder: Record<string, { tasks: string[]; rec: string[] }> = {
  "Customer service": {
    tasks: ["Answering the same questions every day", "After-hours enquiries and bookings", "Routing complaints to the right person"],
    rec: ["assist", "know"],
  },
  "Finance & admin": {
    tasks: ["Capturing invoices and receipts", "Chasing payments and statements", "Month-end reporting"],
    rec: ["docs", "flow", "cast"],
  },
  "Sales & marketing": {
    tasks: ["Following up on leads quickly", "Knowing what will sell next month", "Writing product and campaign content"],
    rec: ["cast", "assist", "flow", "bespoke"],
  },
  Operations: {
    tasks: ["Monitoring sites, equipment and safety", "Stock counts and quality checks", "Planning staff and deliveries"],
    rec: ["vision", "cast", "bespoke"],
  },
  "HR & internal": {
    tasks: ["Answering policy and leave questions", "Onboarding new staff", "Finding information across documents"],
    rec: ["know", "docs", "strat"],
  },
};

export const aiFaq = [
  {
    q: "Do we need lots of data to get started?",
    a: "Usually not. Many useful tools, like customer assistants and document capture, work with the documents, FAQs and records you already have. We'll tell you honestly in the strategy session.",
  },
  {
    q: "Will AI replace my staff?",
    a: "Our focus is taking repetitive work off your team's plate, such as answering the same questions and retyping invoices, so people can spend time on customers and higher-value work.",
  },
  {
    q: "Is our customer data safe?",
    a: "Yes. We design with POPIA in mind, keep data access to a minimum and can host solutions in environments that meet your security requirements.",
  },
  {
    q: "Can it work with WhatsApp, email or our existing systems?",
    a: "That's the point. We connect AI into the channels and software you already use, so there's no new system for your team to learn.",
  },
  {
    q: "How much does it cost?",
    a: "It depends on scope. We start with a focused pilot so you can see value before committing to anything bigger. Book a strategy session for an estimate.",
  },
];
