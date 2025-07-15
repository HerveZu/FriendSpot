import { Building, Users, Home, MapPin } from 'lucide-react';

const audiences = [
  {
    icon: Home,
    title: "Résidents",
    description: "Propriétaires et locataires qui veulent optimiser l'usage de leur place de parking",
    features: ["Gagnez des crédits", "Trouvez une place facilement", "Améliorez la vie de quartier"]
  },
  {
    icon: Building,
    title: "Syndics & Gestionnaires",
    description: "Professionnels qui gèrent des copropriétés et veulent réduire les conflits de stationnement",
    features: ["Réduisez les conflits", "Solution clé en main", "Pas d'investissement"]
  },
  {
    icon: Users,
    title: "Bailleurs Sociaux",
    description: "Organismes qui souhaitent améliorer la qualité de vie dans leurs résidences",
    features: ["Optimisez vos espaces", "Favorisez le lien social", "Solution digitale moderne"]
  },
  {
    icon: MapPin,
    title: "Collectivités",
    description: "Communes et écoquartiers qui veulent fluidifier le stationnement résidentiel",
    features: ["Réduisez la congestion", "Solution écologique", "Accompagnement dédié"]
  }
];

export function TargetAudience() {
  return (
    <section id="pour-qui" className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pour
            <span className="bg-gradient-to-r from-[#046eda] to-[#7288d8] bg-clip-text text-transparent"> qui ?</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            FriendSpot s'adapte à tous les acteurs du logement et de l'urbanisme
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="group p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#046eda]/20 dark:hover:border-[#7288d8]/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#046eda] to-[#7288d8] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <audience.icon size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{audience.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{audience.description}</p>
                  <ul className="space-y-2">
                    {audience.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-[#046eda] rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#046eda] to-[#7288d8] rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold text-white mb-4">
              Votre profil ne correspond pas exactement ?
            </h3>
            <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl mx-auto">
              Contactez-nous pour discuter de votre situation spécifique.
              Nous adaptons FriendSpot à vos besoins particuliers.
            </p>
            <button className="bg-white text-[#046eda] px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Discuter de mon cas
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
