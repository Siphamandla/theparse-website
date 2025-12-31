import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Breadcrumb from "@/components/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Page | About theParse",
  description: "theParse about page",
  // other metadata
};

const AboutPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="About Page"
        description="We are a team of individuals with years of coporate experience designing, developing, testing and deploying a broad range of software solutions from home automation to enteprise standard solutions for small and medium sized business. Our team comprises of indivuals who have worked on complex global projects for huge organisations."
      />
      <AboutSectionOne />
      <AboutSectionTwo />
    </>
  );
};

export default AboutPage;
