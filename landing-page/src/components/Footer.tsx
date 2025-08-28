import { Logo } from "./Logo.tsx";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-slate-400 hover:text-primary/80 transition-colors duration-200"
    >
      {children}
    </a>
  );
}

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="bg-slate-900">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex justify-center md:justify-start items-center space-x-2 mb-4">
            <Logo />
            <span className="text-xl font-bold text-slate-50">
              {t("footer.logo")}
            </span>
          </div>
          <p className="text-slate-300 mb-6 leading-relaxed text-center md:text-left">
            {t("footer.description")}
          </p>
        </div>

        <div className="mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href={"mailto:contact@friendspot.app"}>
                {t("footer.contact")}
              </Link>

              <Link href="https://www.privacypolicies.com/live/8c803710-acfd-49a7-9468-ff2fcd870ba3">
                {t("footer.privacyPolicy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
