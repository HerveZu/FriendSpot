import { useEffect } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks.tsx";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

function App() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    };

    // Add custom CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-fade-in {
        animation: fade-in 0.7s ease-out forwards;
      }
      
      .animate-slide-up {
        animation: slide-up 0.7s ease-out forwards;
      }
      
      .animate-fade-in-up {
        animation: fade-in-up 0.7s ease-out forwards;
      }
      
      html {
        scroll-behavior: smooth;
      }
      
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #1e293b;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #10b981;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #059669;
      }
    `;
    document.head.appendChild(style);

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", handleSmoothScroll);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", handleSmoothScroll);
      });
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Header />
      <Hero />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

export default App;
