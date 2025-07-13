
import { Menu, X, Car } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export function Header({ isMenuOpen, setIsMenuOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#046eda] to-[#7288d8] rounded-xl flex items-center justify-center">
              <Car className="text-white" size={20} />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">FriendSpot</span>
            <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">FriendSpot</span>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#comment-ca-marche" className="text-gray-600 dark:text-gray-300 hover:text-[#046eda] dark:hover:text-[#7288d8] transition-colors font-medium">Comment ça marche</a>
            <a href="#avantages" className="text-gray-600 dark:text-gray-300 hover:text-[#046eda] dark:hover:text-[#7288d8] transition-colors font-medium">Avantages</a>
            <a href="#pour-qui" className="text-gray-600 dark:text-gray-300 hover:text-[#046eda] dark:hover:text-[#7288d8] transition-colors font-medium">Pour qui</a>
            <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-[#046eda] dark:hover:text-[#7288d8] transition-colors font-medium">Contact</a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <button className="bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-6 py-2.5 rounded-lg hover:from-[#035bb8] hover:to-[#6177c4] transition-all duration-300 transform hover:scale-105 shadow-lg font-medium">
              Rejoindre le pilote
            </button>
          </div>

          <button
            className="md:hidden text-gray-900 dark:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            <a href="#comment-ca-marche" className="block text-gray-600 dark:text-gray-300 font-medium">Comment ça marche</a>
            <a href="#avantages" className="block text-gray-600 dark:text-gray-300 font-medium">Avantages</a>
            <a href="#pour-qui" className="block text-gray-600 dark:text-gray-300 font-medium">Pour qui</a>
            <a href="#contact" className="block text-gray-600 dark:text-gray-300 font-medium">Contact</a>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Mode sombre</span>
              <ThemeToggle />
            </div>
            <div className="pt-2">
              <button className="block w-full bg-gradient-to-r from-[#046eda] to-[#7288d8] text-white px-4 py-2.5 rounded-lg font-medium">
                Rejoindre le pilote
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}