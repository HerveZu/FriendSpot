import { Leaf, Heart, Zap, Shield, Smartphone, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: "Solution 100% digitale",
    description: "Pas de travaux, pas de modifications d'infrastructure. Installation en 2 minutes.",
    color: "from-yellow-400 to-orange-500"
  },
  {
    icon: Leaf,
    title: "Impact écologique",
    description: "Réduisez les recherches de places et les embouteillages locaux dans votre quartier.",
    color: "from-green-400 to-green-600"
  },
  {
    icon: Heart,
    title: "Lien social renforcé",
    description: "Favorise la solidarité locale et améliore la cohabitation entre voisins.",
    color: "from-pink-400 to-pink-600"
  },
  {
    icon: Shield,
    title: "Système équitable",
    description: "Système d'échange transparent qui garantit un partage juste pour tous les résidents.",
    color: "from-[#046eda] to-[#7288d8]"
  },
  {
    icon: Smartphone,
    title: "Simple d'utilisation",
    description: "Interface intuitive, notifications en temps réel, réservation en un clic.",
    color: "from-purple-400 to-purple-600"
  },
  {
    icon: TrendingUp,
    title: "Optimisation maximale",
    description: "Augmentez l'utilisation de vos places de parking sans investissement.",
    color: "from-indigo-400 to-indigo-600"
  }
];

export function Benefits() {
  return (
    <section id="avantages" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pourquoi choisir
            <span className="bg-gradient-to-r from-[#046eda] to-[#7288d8] bg-clip-text text-transparent"> FriendSpot ?</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            La première application dédiée au prêt de places entre voisins avec de nombreux avantages
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#046eda]/20 dark:hover:border-[#7288d8]/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${benefit.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <benefit.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Première application de ce type en France
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              FriendSpot est pionnier dans le partage de places de parking entre voisins.
              Rejoignez l'innovation et simplifiez le stationnement dans votre résidence.
            </p>
            <button className="bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-lg">
              Être parmi les premiers
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
