import { useEffect, useRef } from "react";
import { Shield, Zap, Heart, Globe, Calendar, Bell } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Verified users and secure payment processing ensure your safety and peace of mind.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Get real-time updates when spots become available or when someone requests yours.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Community First",
    description:
      "Built on the principle of helping neighbors and creating stronger communities.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Globe,
    title: "Growing Network",
    description:
      "Join thousands of users across multiple cities and expand your parking options.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description:
      "Schedule your spot availability in advance and plan your parking needs.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description:
      "Never forget to move your car with intelligent reminder notifications.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export const Features = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = ref.current?.querySelectorAll(".feature-card");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={ref} className="py-20 bg-slate-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 mb-4">
            Why Choose FriendSpot?
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            We've built more than just a parking app. We've created a
            community-driven platform that makes urban parking stress-free and
            social.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="feature-card opacity-0 transition-all duration-700 transform translate-y-8"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="bg-slate-700 rounded-2xl p-8 hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 group">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
