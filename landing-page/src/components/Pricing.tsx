import { useEffect, useRef } from "react";
import { Building, Check, Crown, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const plans = [
  {
    nameKey: "pricing.plans.free.name",
    priceKey: "pricing.plans.free.price",
    periodKey: "pricing.plans.free.period",
    icon: Star,
    descriptionKey: "pricing.plans.free.description",
    featuresKey: "pricing.plans.free.features",
    buttonTextKey: "pricing.plans.free.buttonText",
    buttonClass: "bg-slate-700 hover:bg-slate-600 text-white",
    popular: false,
    link: "https://api.friendspot.app/_open/",
  },
  {
    nameKey: "pricing.plans.premium.name",
    priceKey: "pricing.plans.premium.price",
    periodKey: "pricing.plans.premium.period",
    icon: Crown,
    descriptionKey: "pricing.plans.premium.description",
    featuresKey: "pricing.plans.premium.features",
    buttonTextKey: "pricing.plans.premium.buttonText",
    buttonClass:
      "bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white",
    popular: true,
    link: "https://api.friendspot.app/_open/friendspot-plus",
  },
  {
    nameKey: "pricing.plans.neighbourhood.name",
    priceKey: "pricing.plans.neighbourhood.price",
    periodKey: "pricing.plans.neighbourhood.period",
    icon: Building,
    descriptionKey: "pricing.plans.neighbourhood.description",
    featuresKey: "pricing.plans.neighbourhood.features",
    buttonTextKey: "pricing.plans.neighbourhood.buttonText",
    buttonClass: "bg-slate-700 hover:bg-slate-600 text-white",
    popular: false,
    link: "https://api.friendspot.app/_open/friendspot-plus",
  },
];

export const Pricing = () => {
  const ref = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = ref.current?.querySelectorAll(".pricing-card");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={ref} className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-50 mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            return (
              <div
                key={index}
                className={`pricing-card opacity-0 transition-all duration-700 transform translate-y-8 ${
                  plan.popular ? "lg:scale-105" : ""
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div
                  className={`relative bg-slate-800 rounded-2xl p-8 h-full flex flex-col ${
                    plan.popular ? "ring-2 ring-primary ring-opacity-50" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute left-0 -top-4 flex justify-center w-full">
                      <span className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-sm font-semibold">
                        {t("pricing.mostPopular")}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                        plan.popular
                          ? "bg-gradient-to-r from-primary to-secondary"
                          : "bg-slate-700"
                      }`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-50 mb-2">
                      {t(plan.nameKey)}
                    </h3>
                    <p className="text-slate-300 mb-4">
                      {t(plan.descriptionKey)}
                    </p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-slate-50">
                        {t(plan.priceKey)}
                      </span>
                      <span className="text-slate-300">
                        {t(plan.periodKey)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 mb-8">
                      {Array.isArray(
                        t(plan.featuresKey, { returnObjects: true }),
                      )
                        ? (
                            t(plan.featuresKey, {
                              returnObjects: true,
                            }) as string[]
                          ).map((feature: string, featureIndex: number) => (
                            <li
                              key={featureIndex}
                              className="flex items-center space-x-3"
                            >
                              <Check className="w-5 h-5 text-primary/80 flex-shrink-0" />
                              <span className="text-slate-300">{feature}</span>
                            </li>
                          ))
                        : null}
                    </ul>
                  </div>

                  <a href={plan.link}>
                    <button
                      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 capitalize transform hover:scale-105 ${plan.buttonClass}`}
                    >
                      {t(plan.buttonTextKey)}
                    </button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-400">{t("pricing.footer")}</p>
        </div>
      </div>
    </section>
  );
};
