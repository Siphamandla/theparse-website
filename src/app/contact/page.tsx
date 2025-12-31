import Breadcrumb from "@/components/Common/Breadcrumb";
import Contact from "@/components/Contact";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Page | theParse",
  description: "Contact us today, to kick-start your software journey",
  // other metadata
};

const ContactPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Contact Page"
        description="We’d love to hear from you! Whether you have a question about our services, need a custom solution, or just want to get in touch, our team is here to help. Please fill out the form below, and we’ll get back to you as soon as possible."
      />

      <Contact />
    </>
  );
};

export default ContactPage;
