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

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", handleSmoothScroll);
    });

    return () => {
      links.forEach((link) =>
        link.removeEventListener("click", handleSmoothScroll),
      );
    };
  }, []);

  useEffect(() => {
    const scrollToHowItWorks = () => {
      const el = document.querySelector("#how-it-works");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY === 0 && e.deltaY > 0) {
        e.preventDefault();
        scrollToHowItWorks();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        e.preventDefault();
        scrollToHowItWorks();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        window.scrollY === 0 &&
        (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ")
      ) {
        e.preventDefault();
        scrollToHowItWorks();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel as EventListener);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("keydown", onKeyDown as EventListener);
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
