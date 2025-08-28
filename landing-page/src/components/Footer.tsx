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
  const isHomePage = location.pathname === "/";

  return (
    <footer id="contact" className="bg-slate-900">
      <div className="container mx-auto px-6 py-16">
        {isHomePage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Logo />
            <p className="text-slate-300 mb-6 leading-relaxed text-center md:text-left">
              {t("footer.description")}
            </p>
          </div>
        )}

        <div className="mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href={"mailto:contact@friendspot.app"}>
                {t("footer.contact")}
              </Link>
              <Link href="/terms">{t("footer.terms")}</Link>
              <Link href="/privacy">{t("footer.privacyPolicy")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
