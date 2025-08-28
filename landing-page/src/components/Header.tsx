import { useEffect, useState } from "react";
import { Menu, X, FlagIcon } from "lucide-react";
import { Logo } from "./Logo.tsx";
import { HERO_ID } from "./Hero.tsx";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [lastScroll, setLastScroll] = useState<"top" | "bottom">("top");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!i18n.language) {
      i18n.changeLanguage("fr");
    }
  }, [i18n]);

  useEffect(() => {
    const handleScroll = () => {
      setLastScrollPosition((lastScrollPosition) => {
        setLastScroll(
          lastScrollPosition - window.scrollY < 0 ? "bottom" : "top",
        );
        return window.scrollY;
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t("header.nav.howItWorks"), href: "#how-it-works" },
    { label: t("header.nav.pricing"), href: "#pricing" },
    { label: t("header.nav.contact"), href: "#contact" },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-slate-900/95 ${
        lastScroll === "bottom" &&
        // avoid scroll bouncing issues on mobile
        lastScrollPosition > 100 &&
        "opacity-0 hover:opacity-100"
      } ${lastScrollPosition === 0 && !isMenuOpen && "bg-transparent"}`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a href={`#${HERO_ID}`}>
            <div className="flex items-center space-x-2">
              <Logo />
              <span className="text-xl font-bold text-slate-50">
                {t("header.logo")}
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-slate-300 hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 text-slate-300 hover:text-primary transition-colors duration-200"
            >
              <FlagIcon className="w-5 h-5" />
              <span>{i18n.language === "en" ? "EN" : "FR"}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-800">
            <nav className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-slate-300 hover:text-primary transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center space-x-2 text-slate-300 hover:text-primary transition-colors duration-200"
              >
                <FlagIcon className="w-5 h-5" />
                <span>{i18n.language === "en" ? "EN" : "FR"}</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
