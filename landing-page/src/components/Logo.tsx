import { ImgHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

export function Logo({ alt = "Main logo", ...imgProps }: LogoProps) {
  const { t } = useTranslation();
  return (
    <a href={"/"} className="flex items-center gap-2">
      <img src="/logo.svg" width={40} alt={alt} {...imgProps} />
      <span className="text-xl font-bold">{t("header.logo")}</span>
    </a>
  );
}
