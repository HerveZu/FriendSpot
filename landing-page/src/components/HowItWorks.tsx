import { useEffect, useRef } from "react";
import { Clock, MapPin, Repeat, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  {
    icon: UserPlus,
    titleKey: "howItWorks.steps.createOrJoin.title",
    descriptionKey: "howItWorks.steps.createOrJoin.description",
  },
  {
    icon: MapPin,
    titleKey: "howItWorks.steps.shareSpot.title",
    descriptionKey: "howItWorks.steps.shareSpot.description",
  },
  {
    icon: Clock,
    titleKey: "howItWorks.steps.earnCredits.title",
    descriptionKey: "howItWorks.steps.earnCredits.description",
  },
  {
    icon: Repeat,
    titleKey: "howItWorks.steps.useSpots.title",
    descriptionKey: "howItWorks.steps.useSpots.description",
  },
];

export const HowItWorks = () => {
  const ref = useRef<HTMLElement>(null);
  const { t } = useTranslation();

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
            {t("howItWorks.title")}
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
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
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-primary/80 to-secondary/80 mb-6`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-50 mb-4">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {t(step.descriptionKey)}
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
