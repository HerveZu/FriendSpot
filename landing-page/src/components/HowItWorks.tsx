import { Car, Users, CreditCard, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Car,
    title: "Prêtez votre place",
    description: "Quand vous partez, libérez votre place et gagnez des points d'échange",
    color: "from-green-400 to-green-600"
  },
  {
    icon: Users,
    title: "Système d'échange équitable",
    description: "Plus vous aidez vos voisins, plus vous pouvez emprunter facilement",
    color: "from-[#046eda] to-[#7288d8]"
  },
  {
    icon: CreditCard,
    title: "Empruntez une place",
    description: "Besoin d'une place ? Utilisez vos points pour réserver celle d'un voisin",
    color: "from-purple-400 to-purple-600"
  },
  {
    icon: CheckCircle,
    title: "Priorité intelligente",
    description: "Besoin urgent ? Proposez plus de points pour avoir la priorité",
    color: "from-orange-400 to-orange-600"
  }
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comment ça
            <span className="bg-gradient-to-r from-[#046eda] to-[#7288d8] bg-clip-text text-transparent"> marche ?</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Un système simple de crédits pour un partage équitable entre voisins
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group text-center"
            >
              <div className="relative mb-6">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <step.icon size={32} className="text-white" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 -translate-x-4"></div>
                )}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#046eda] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#046eda]/10 to-[#7288d8]/10 dark:from-[#046eda]/20 dark:to-[#7288d8]/20 rounded-2xl p-8 border border-[#046eda]/20 dark:border-[#046eda]/30">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Système d'échange juste et transparent
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">+</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Je prête ma place</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Je prête ma place</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Je gagne des points</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">-</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">J'emprunte une place</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">J'emprunte une place</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Je dépense mes points</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-orange-600 font-bold">!</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Besoin urgent</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Besoin urgent</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Je propose plus de points</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
              Un système d'entraide où chacun contribue selon ses possibilités et bénéficie selon ses besoins.
              Plus vous aidez vos voisins, plus vous avez accès aux places disponibles !
            </p>
            <button className="bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-lg">
              Découvrir l'application
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
