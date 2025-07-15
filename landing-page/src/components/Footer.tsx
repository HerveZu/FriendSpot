import { Car, Mail, MapPin, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white transition-colors">
      {/* CTA Final */}
      <div className="bg-gradient-to-r from-[#046eda] to-[#7288d8] py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">
            Transformez le stationnement de votre résidence
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez les quartiers pilotes et découvrez une nouvelle façon de partager entre voisins
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:friendspot.app@gmail.com"
              className="group bg-white text-[#046eda] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center space-x-2"
            >
              <span>Rejoindre les pilotes</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-blue-100 dark:text-blue-200 text-sm">
              Gratuit • Sans engagement • Accompagnement personnalisé
            </p>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="py-16 bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#046eda] to-[#7288d8] rounded-xl flex items-center justify-center">
                  <Car className="text-white" size={20} />
                </div>
                <span className="ml-3 text-2xl font-bold">FriendSpot</span>
              </div>
              <p className="text-gray-400 dark:text-gray-500 mb-6 max-w-md">
                La première application mobile qui révolutionne le stationnement résidentiel
                en permettant aux voisins de s'échanger leurs places de parking de manière équitable.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-gray-400 dark:text-gray-500">
                  <Mail size={16} className="mr-2" />
                  <a href="mailto:friendspot.app@gmail.com" className="hover:text-white dark:hover:text-gray-300 transition-colors">
                    friendspot.app@gmail.com
                  </a>
                </div>
                <div className="flex items-center text-gray-400 dark:text-gray-500">
                  <MapPin size={16} className="mr-2" />
                  <span>France</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><a href="#comment-ca-marche" className="hover:text-white dark:hover:text-gray-300 transition-colors">Comment ça marche</a></li>
                <li><a href="#avantages" className="hover:text-white dark:hover:text-gray-300 transition-colors">Avantages</a></li>
                <li><a href="#pour-qui" className="hover:text-white dark:hover:text-gray-300 transition-colors">Pour qui</a></li>
                <li><a href="#contact" className="hover:text-white dark:hover:text-gray-300 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              © 2025 FriendSpot. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors text-sm">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors text-sm">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
