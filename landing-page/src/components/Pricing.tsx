import { useEffect, useRef } from "react";
import { Building, Check, Crown, Star } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    icon: Star,
    description: "Perfect for getting started with parking sharing",
    features: [
      "Unlimited parking group creation",
      "24-hour time limit per reservation",
      "Community support",
    ],
    buttonText: "Get Started Free",
    buttonClass: "bg-slate-700 hover:bg-slate-600 text-white",
    popular: false,
  },
  {
    name: "Premium",
    price: "€2",
    period: "/month",
    icon: Crown,
    description: "Unlock unlimited parking potential",
    features: [
      "Everything in Free",
      "Unlimited time per reservation",
      "Parking sharing requests",
    ],
    buttonText: "Start Premium",
    buttonClass:
      "bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-xl text-white",
    popular: true,
    oneTime: "Or €10 one-time payment",
  },
  {
    name: "Custom Group",
    price: "€5",
    period: "/month per user",
    icon: Building,
    description: "For larger neighbourhoods and communities",
    features: [
      "Unlimited group members",
      "Advanced group management",
      "Dedicated support",
    ],
    buttonText: "Contact Sales",
    buttonClass: "bg-slate-700 hover:bg-slate-600 text-white",
    popular: false,
  },
];

export const Pricing = () => {
  const ref = useRef<HTMLElement>(null);

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
            Simple, Fair Pricing
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Choose the plan that fits your parking needs. Start free and upgrade
            when you're ready for more features.
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
                    plan.popular
                      ? "ring-2 ring-emerald-500 ring-opacity-50"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                        plan.popular
                          ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                          : "bg-slate-700"
                      }`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-50 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-slate-300 mb-4">{plan.description}</p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-slate-50">
                        {plan.price}
                      </span>
                      <span className="text-slate-300">{plan.period}</span>
                    </div>
                    {plan.oneTime && (
                      <p className="text-sm text-emerald-400">{plan.oneTime}</p>
                    )}
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center space-x-3"
                        >
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${plan.buttonClass}`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-400">
            All plans include our core parking sharing features. No hidden fees,
            cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
