import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

// Metadata for the page
export const metadata: Metadata = {
  title: "Policies | Your Company",
  description: "Explore our company policies including Privacy Policy, Terms of Service, and more.",
};

// Mock data for policies
const policies = [
  {
    id: 1,
    title: "Privacy Policy",
    description: "Learn how we collect, use, and share your information.",
    icon: "/images/icons/privacy-policy.svg",
    link: "/policies/privacy-policy",
  },
  {
    id: 2,
    title: "Terms of Service",
    description: "Understand the rules and regulations for using our services.",
    icon: "/images/icons/terms-of-service.svg",
    link: "/policies/terms-of-service",
  },
  {
    id: 3,
    title: "Cookie Policy",
    description: "Details on how we use cookies and your preferences.",
    icon: "/images/icons/cookie-policy.svg",
    link: "/policies/cookie-policy",
  },
  {
    id: 4,
    title: "Data Retention Policy",
    description: "Information about refunds and returns for our services.",
    icon: "/images/icons/data-policy.svg",
    link: "/policies/data-policy",
  },
  // Add more policies as needed
];

const Policies = () => {
  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb
        pageName="Our Policies"
        description="Find important information about our policies. Click on any policy to learn more."
      />

      {/* Policies Section */}
      <section className="pb-[120px] pt-[120px]">
        <div className="container">
          <h2 className="text-center text-4xl font-bold mb-12">Explore Our Policies</h2>
          <p className="text-center text-lg mb-16">
            We are committed to transparency and ensuring you are informed. Select a policy below to learn more.
          </p>

          {/* Policies Grid */}
          <div className="-mx-4 flex flex-wrap justify-center">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="w-full px-4 md:w-1/2 lg:w-1/3 xl:w-1/4 mb-8"
              >
                <a href={policy.link} className="block text-center transition hover:shadow-lg p-6 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
                  <img
                    src={policy.icon}
                    alt={`${policy.title} Icon`}
                    className="mx-auto mb-4 h-12 w-12"
                  />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    {policy.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {policy.description}
                  </p>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Policies;