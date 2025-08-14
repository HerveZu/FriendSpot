import { useEffect, useRef } from "react";
import { Clock, MapPin, Repeat, UserPlus } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create or Join Groups",
    description:
      "Start by creating a parking group with friends, family, or neighbors. Or join existing groups in your area.",
    color: "emerald",
  },
  {
    icon: MapPin,
    title: "Share Your Spot",
    description:
      "When you're not using your parking spot, make it available to your group members.",
    color: "blue",
  },
  {
    icon: Clock,
    title: "Earn Time Credits",
    description:
      "For every hour you share your spot, you earn 1 hour of parking credit to use elsewhere.",
    color: "violet",
  },
  {
    icon: Repeat,
    title: "Use Others' Spots",
    description:
      "Spend your earned credits to park in other members' spots when you need them.",
    color: "orange",
  },
];

export const HowItWorks = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = ref.current?.querySelectorAll(".step-card");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={ref} className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Simple, fair, and completely free. Join the parking revolution in 4
            easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="step-card opacity-0 transition-all duration-700 transform translate-y-8"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-400 mb-6`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {step.description}
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
