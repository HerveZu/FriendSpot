import { Smartphone, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  const footerLinks = {
    Product: ["How it Works", "Features", "Pricing", "Download"],
    Company: ["About Us", "Careers", "Press", "Contact"],
    Support: ["Help Center", "Community", "Safety", "Terms"],
    Legal: [
      "Privacy Policy",
      "Terms of Service",
      "Cookie Policy",
      "Disclaimer",
    ],
  };

  return (
    <footer id="contact" className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-50">
                FriendSpot
              </span>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Revolutionizing urban parking through community-driven sharing.
              Join thousands of users making parking stress-free and social.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>hello@friendspot.app</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-slate-50 font-semibold mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-slate-300 hover:text-emerald-400 transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              © 2025 FriendSpot. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
