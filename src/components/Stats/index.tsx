"use client";

import { useEffect, useState } from "react";

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({
    projects: 0,
    clients: 0,
    experience: 0,
    success: 0,
  });

  const stats = [
    { 
      label: "Projects Completed", 
      value: 50, 
      symbol: "+",
      icon: "🚀",
      color: "from-blue-500 to-blue-600"
    },
    { 
      label: "Happy Clients", 
      value: 30, 
      symbol: "+",
      icon: "😊",
      color: "from-green-500 to-green-600"
    },
    { 
      label: "Years of Experience", 
      value: 8, 
      symbol: "",
      icon: "⭐",
      color: "from-purple-500 to-purple-600"
    },
    { 
      label: "Success Rate", 
      value: 98, 
      symbol: "%",
      icon: "📈",
      color: "from-orange-500 to-orange-600"
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById("stats-section");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCounts({
        projects: Math.floor(50 * progress),
        clients: Math.floor(30 * progress),
        experience: Math.floor(8 * progress),
        success: Math.floor(98 * progress),
      });

      if (progress < 1) {
        requestAnimationFrame(animateCounter);
      }
    };

    animateCounter();
  }, [isVisible]);

  return (
    <section
      id="stats-section"
      className="relative py-20 md:py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden"
    >
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .stat-card {
          animation: slideInUp 0.6s ease-out forwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        .stat-icon {
          animation: float 3s ease-in-out infinite;
        }

        .stat-card:nth-child(1) .stat-icon { animation-delay: 0s; }
        .stat-card:nth-child(2) .stat-icon { animation-delay: 0.5s; }
        .stat-card:nth-child(3) .stat-icon { animation-delay: 1s; }
        .stat-card:nth-child(4) .stat-icon { animation-delay: 1.5s; }
      `}</style>

      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card group relative"
            >
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 h-full overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="stat-icon text-5xl mb-4 inline-block">
                    {stat.icon}
                  </div>
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                    {index === 0
                      ? counts.projects
                      : index === 1
                      ? counts.clients
                      : index === 2
                      ? counts.experience
                      : counts.success}
                    <span className="ml-2 text-3xl">{stat.symbol}</span>
                  </div>
                  <p className="text-gray-300 text-sm md:text-base mt-4">
                    {stat.label}
                  </p>
                </div>

                {/* Border animation on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-transparent group-hover:border-white/20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative animated background elements */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30"></div>
    </section>
  );
};

export default Stats;
