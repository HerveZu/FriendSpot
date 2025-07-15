import { Zap, Shield, Users, Smartphone, BarChart3, Clock } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "Performance Ultra-Rapide",
    description: "Une vitesse d'exécution jusqu'à 10x plus rapide que la concurrence",
    color: "from-yellow-400 to-orange-500"
  },
  {
    icon: Shield,
    title: "Sécurité Enterprise",
    description: "Chiffrement de niveau bancaire et conformité RGPD garantie",
    color: "from-green-400 to-green-600"
  },
  {
    icon: Users,
    title: "Collaboration Temps Réel",
    description: "Travaillez en équipe sans friction avec la synchronisation instantanée",
    color: "from-blue-400 to-blue-600"
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "Application native sur tous vos appareils avec synchronisation complète",
    color: "from-purple-400 to-purple-600"
  },
  {
    icon: BarChart3,
    title: "Analytics Avancés",
    description: "Tableaux de bord intelligents avec insights automatiques",
    color: "from-indigo-400 to-indigo-600"
  },
  {
    icon: Clock,
    title: "Automatisation Smart",
    description: "IA intégrée qui automatise vos tâches répétitives",
    color: "from-pink-400 to-pink-600"
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin pour
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> réussir</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Des fonctionnalités pensées pour maximiser votre productivité et celle de votre équipe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Découvrir toutes les fonctionnalités
          </button>
        </div>
      </div>
    </section>
  );
}
