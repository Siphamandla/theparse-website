import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="w-full">
      <style>{`
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

        .feature-card {
          animation: fadeInUp 0.6s ease-out forwards;
          transition: all 0.3s ease-in-out;
        }

        .feature-card:hover {
          transform: translateY(-8px);
        }

        .feature-icon {
          transition: all 0.3s ease-in-out;
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.1) rotate(5deg);
          background: linear-gradient(135deg, rgb(74, 108, 247) 0%, rgb(101, 129, 255) 100%);
          color: white;
        }

        .feature-card:hover h3 {
          color: rgb(74, 108, 247);
        }
      `}</style>
      
      <div className="feature-card wow fadeInUp rounded-lg p-6 bg-white dark:bg-gray-dark shadow-md hover:shadow-xl h-full flex flex-col" data-wow-delay=".15s">
        <div className="feature-icon mb-6 flex h-[70px] w-[70px] items-center justify-center rounded-md bg-primary bg-opacity-10 text-primary">
          {icon}
        </div>
        <h3 className="mb-4 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl transition-colors duration-300">
          {title}
        </h3>
        <p className="pr-[10px] text-base font-medium leading-relaxed text-body-color dark:text-body-color-dark flex-grow">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
