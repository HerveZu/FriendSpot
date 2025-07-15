import { Mail, MessageCircle, ArrowRight, CheckCircle, Clock, Users } from 'lucide-react';

export function Contact() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-[#046eda]/5 to-[#7288d8]/5 dark:from-[#046eda]/10 dark:to-[#7288d8]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Rejoignez les
            <span className="bg-gradient-to-r from-[#046eda] to-[#7288d8] bg-clip-text text-transparent"> quartiers pilotes</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Envie de simplifier le stationnement dans votre résidence ?
            Testez FriendSpot et bénéficiez d'un accompagnement personnalisé.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Avantages des quartiers pilotes
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Application gratuite pendant toute la phase pilote</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="text-[#046eda]" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Accompagnement personnalisé de notre équipe</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="text-purple-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Mise en place rapide (moins de 48h)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="text-orange-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-300">Support prioritaire et formation incluse</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#046eda]/10 to-[#7288d8]/10 dark:from-[#046eda]/20 dark:to-[#7288d8]/20 rounded-xl p-4 border border-[#046eda]/20 dark:border-[#046eda]/30">
                <p className="text-sm text-[#046eda] dark:text-[#7288d8] font-medium">
                  🎯 Places limitées pour garantir la qualité de l'accompagnement
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Contactez-nous directement
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Notre équipe vous répond sous 24h pour étudier votre projet
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:friendspot.app@gmail.com"
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white rounded-xl hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Mail size={20} />
                    <span className="font-medium">friendspot.app@gmail.com</span>
                  </div>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>

                <button className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium">
                  <div className="flex items-center space-x-3">
                    <MessageCircle size={20} />
                    <span>Échanger avec notre équipe</span>
                  </div>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <h4 className="font-bold mb-2">🚀 Lancement imminent</h4>
              <p className="text-green-100 dark:text-green-200 text-sm">
                Les premiers quartiers pilotes démarrent ce mois-ci.
                Ne ratez pas l'opportunité d'être parmi les pionniers !
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Prêt à révolutionner le stationnement dans votre résidence ?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Rejoignez les quartiers pilotes et découvrez comment FriendSpot peut transformer
              la gestion du stationnement chez vous.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:friendspot.app@gmail.com"
                className="group bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-8 py-4 rounded-xl font-semibold hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>Candidater maintenant</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Réponse sous 24h • Mise en place rapide • Accompagnement inclus
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
