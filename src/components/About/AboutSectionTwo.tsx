import Image from "next/image";

const AboutSectionTwo = () => {
  return (
    <section className="py-16 md:py-20 lg:py-28">
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="container">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4 lg:w-1/2" style={{ animation: 'slideInFromLeft 0.8s ease-out' }}>
            <div
              className="relative mx-auto mb-12 aspect-[25/24] max-w-[500px] text-center lg:m-0"
              data-wow-delay=".15s"
            >
              <Image
                src="/images/about/about-image-2.svg"
                alt="about image"
                fill
                className="drop-shadow-three dark:hidden dark:drop-shadow-none"
              />
              <Image
                src="/images/about/about-image-2-dark.svg"
                alt="about image"
                fill
                className="hidden drop-shadow-three dark:block dark:drop-shadow-none"
              />
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2" style={{ animation: 'slideInFromRight 0.8s ease-out' }}>
            <div className="max-w-[470px]">
              <div 
                className="mb-9 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 transform transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.1s backwards' }}
              >
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  Clean code
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Our development practices focus on creating well-structured, 
                  readable code that reduces technical debt and simplifies future updates. 
                </p>
              </div>
              <div 
                className="mb-9 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 transform transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.2s backwards' }}
              >
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  Premium support
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Our dedicated support team is available to provide prompt, 
                  personalised assistance whenever you need it. 
                  From troubleshooting technical issues to optimising performance, 
                  we&apos;re here to ensure that your systems operate at their best. 
                </p>
              </div>
              <div 
                className="mb-1 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 transform transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.3s backwards' }}
              >
                <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </span>
                  Form follows Function
                </h3>
                <p className="text-base font-medium leading-relaxed text-body-color sm:text-lg sm:leading-relaxed">
                  Our approach prioritises creating intuitive, functional software that solves real problems while maintaining a clean, aesthetically pleasing design. Every element we build is crafted with the user experience in mind, ensuring that the functionality drives the design, resulting in solutions that are both highly effective and visually engaging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionTwo;
