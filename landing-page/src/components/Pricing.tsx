import { Check, ArrowRight, Zap } from 'lucide-react';

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "Gratuit",
    description: "Parfait pour commencer",
    features: [
      "5 projets",
      "2 membres d'équipe",
      "10 GB de stockage",
      "Support par email"
    ],
    cta: "Commencer Gratuitement",
    popular: false
  },
  {
    name: "Pro",
    price: "29",
    period: "/mois",
    description: "Pour les équipes en croissance",
    features: [
      "Projets illimités",
      "10 membres d'équipe",
      "100 GB de stockage",
      "Support prioritaire",
      "Analytics avancés",
      "Intégrations personnalisées"
    ],
    cta: "Essai Gratuit 14 jours",
    popular: true
  },
  {
    name: "Enterprise",
    price: "99",
    period: "/mois",
    description: "Pour les grandes organisations",
    features: [
      "Tout du plan Pro",
      "Membres illimités",
      "Stockage illimité",
      "Support dédié 24/7",
      "SSO et sécurité avancée",
      "Formation personnalisée"
    ],
    cta: "Contactez-nous",
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tarifs
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> transparents</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choisissez le plan qui correspond à vos besoins
          </p>

          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <Zap size={16} className="mr-2" />
            Économisez 20% avec l'abonnement annuel
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                plan.popular 
                  ? 'border-blue-500 shadow-xl bg-gradient-to-b from-blue-50 to-white' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Plus populaire
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check size={20} className="text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Besoin d'une solution sur mesure ?
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-semibold">
            Parlons de vos besoins →
          </button>
        </div>
      </div>
    </section>
  );
}
