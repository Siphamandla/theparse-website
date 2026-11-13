import type { IconName } from "@/components/ui/Icon";

export type AutomationOffering = {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  example: string;
  tags: string[];
  layout?: "feat" | "wide";
  cta?: { label: string; href?: string };
};

export const automationOfferings: AutomationOffering[] = [
  {
    id: "audit",
    icon: "compass",
    title: "Process Mapping & Audit",
    desc: "We sit with your team, map how work really flows today and pinpoint the handoffs, duplicate steps and bottlenecks that cost you time.",
    example: "A distributor finds that one order is captured in three different places before it is dispatched.",
    tags: ["Discovery", "Bottlenecks", "Roadmap"],
    layout: "feat",
    cta: { label: "Book a process review" },
  },
  {
    id: "approvals",
    icon: "usercheck",
    title: "Approvals & Handoffs",
    desc: "Digital approval flows with clear owners, reminders and an audit trail, so nothing waits in someone's inbox.",
    example: "Purchase requests route to the right manager, chase them automatically and log every decision.",
    tags: ["Approvals", "Reminders", "Audit trail"],
  },
  {
    id: "integrate",
    icon: "link",
    title: "System Integration",
    desc: "Connect the tools you already use, like accounting, CRM, email and spreadsheets, so data moves between them without retyping.",
    example: "A new sale in your CRM creates the invoice in your accounting package and notifies the warehouse.",
    tags: ["APIs", "CRM", "Accounting"],
  },
  {
    id: "forms",
    icon: "file",
    title: "Digital Forms & Data Capture",
    desc: "Replace paper and email back-and-forth with structured forms that validate data at the source and feed your systems directly.",
    example: "Field teams submit inspection checklists on their phones, complete with photos and GPS location.",
    tags: ["Forms", "Mobile", "Validation"],
  },
  {
    id: "notify",
    icon: "mail",
    title: "Notifications & Follow-ups",
    desc: "Rule-based emails, SMS and WhatsApp messages triggered by real events, such as overdue invoices, expiring contracts or low stock.",
    example: "Customers get a friendly payment reminder three days before the due date, and another if it slips.",
    tags: ["Email", "WhatsApp", "Triggers"],
  },
  {
    id: "reports",
    icon: "gauge",
    title: "Scheduled Reporting",
    desc: "Reports that build themselves from your live data and land in the right inboxes on time, every time.",
    example: "Every Monday at 7am, management receives last week's sales, stock and cash position.",
    tags: ["Dashboards", "Scheduling", "KPIs"],
  },
  {
    id: "enhance",
    icon: "brain",
    title: "Ready for AI, When It Makes Sense",
    desc: "Once a process is clean, consistent and automated, adding AI becomes faster, cheaper and far more reliable. We help you decide when that step is worth taking, and build it when it is.",
    example: "After streamlining invoice intake, a client adds AI to read supplier invoices, with clean data from day one.",
    tags: ["AI-ready", "Clean data", "Next step"],
    layout: "wide",
    cta: { label: "Explore AI services", href: "/ai" },
  },
];

/** Side-by-side comparison used to explain why we streamline before we enhance. */
export const automationCompare = {
  before: {
    title: "Enhancing a messy process",
    points: [
      "AI inherits the inconsistencies, so results are unpredictable",
      "Data is scattered, so models need expensive clean-up first",
      "Workarounds get baked in instead of removed",
      "Hard to measure what actually improved",
    ],
  },
  after: {
    title: "Streamline first, then enhance",
    points: [
      "Quick wins from simple automation, often within weeks",
      "Consistent, structured data that AI can trust",
      "Fewer steps, so there is less to build and maintain",
      "A clear baseline to measure every improvement against",
    ],
  },
};

export const automationFaq = [
  {
    q: "Why not go straight to AI?",
    a: "Sometimes that is the right call. But AI layered on a broken process usually automates the mess. Streamlining first often delivers most of the value on its own, and makes any later AI work cheaper and more reliable.",
  },
  {
    q: "Do we have to replace our existing systems?",
    a: "Rarely. Most automation connects the tools you already use. We only recommend replacing a system when it is genuinely holding the process back.",
  },
  {
    q: "How quickly will we see results?",
    a: "Simple automations, such as approvals, reminders and scheduled reports, are often live within a few weeks. Larger integrations are delivered in stages so you see value early.",
  },
  {
    q: "What if our process isn't documented?",
    a: "That is normal and exactly where we start. Our process mapping captures how work really happens today, not how it is written down.",
  },
  {
    q: "How much does it cost?",
    a: "It depends on scope. We start with a process review and a focused first automation, so you see the return before committing to anything bigger.",
  },
];
