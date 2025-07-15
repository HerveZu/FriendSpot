import { ArrowRight, MapPin } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-[#7288d8]/10 dark:from-gray-900 dark:via-gray-800 dark:to-[#7288d8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            {/* Badge innovation */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#046eda]/10 to-[#7288d8]/10 px-4 py-2 rounded-full border border-[#046eda]/20 mb-8">
              <div className="w-2 h-2 bg-[#046eda] rounded-full animate-pulse"></div>
              <span className="text-sm text-[#046eda] dark:text-[#7288d8] font-medium">Première app de partage de parking entre voisins</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Partagez vos
              <span className="bg-gradient-to-r from-[#046eda] to-[#7288d8] bg-clip-text text-transparent"> places</span>
              <br />entre voisins
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
              FriendSpot révolutionne le stationnement résidentiel. Prêtez votre place quand vous partez, empruntez celle d'un voisin quand vous en avez besoin.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
              <button className="group bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-2">
                <span>Rejoindre les quartiers pilotes</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-4">
                <div className="flex items-center space-x-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gratuit pendant la phase pilote</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Accompagnement personnalisé</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#046eda]">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mobile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#046eda]">0€</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Coût d'installation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#046eda]">2min</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pour commencer</div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            {/* iPhone Container with Discord-style tilt */}
            <div className="relative transform rotate-12 hover:rotate-6 transition-transform duration-700 ease-out">
              {/* iPhone Frame */}
              <div className="relative w-80 h-[640px] bg-black rounded-[3rem] p-2 shadow-2xl">
                {/* iPhone Screen */}
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="bg-white dark:bg-gray-800 px-6 py-3 flex justify-between items-center text-black dark:text-white text-sm font-medium">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 border border-black dark:border-white rounded-sm">
                        <div className="w-3 h-1 bg-black dark:bg-white rounded-sm m-0.5"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="bg-gradient-to-r from-[#046eda] to-[#7288d8] px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <MapPin size={16} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Ma Résidence</h3>
                          <p className="text-xs text-blue-100">3 places disponibles</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Mes points</div>
                        <div className="text-lg font-bold">12</div>
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900 h-full">
                    {/* Available Spots */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">Place A12</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Marie D. • Libre 2h</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-medium text-sm">2 pts</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Disponible</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">Place B07</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Thomas L. • Libre 4h</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-medium text-sm">3 pts</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Disponible</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">Place C15</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Sophie M. • Libre 1h</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-600 font-medium text-sm">1 pt</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Disponible</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-3">
                      <button className="w-full bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white py-3 rounded-xl font-medium text-sm">
                        Réserver une place
                      </button>
                      <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-sm">
                        Prêter ma place
                      </button>
                    </div>
                  </div>
                </div>

                {/* iPhone Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#7288d8]/20 to-[#046eda]/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-[#046eda]/20 to-[#7288d8]/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

            {/* Notification Badges */}
            <div className="absolute -top-4 left-8 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium animate-bounce">
              Nouvelle place disponible !
            </div>
            <div className="absolute top-1/2 -right-6 bg-[#046eda] text-white text-xs px-3 py-1 rounded-full font-medium animate-pulse">
              +2 points gagnés
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
