import { ImgHTMLAttributes } from "react";

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

export function Logo({ alt = "Main logo", ...imgProps }: LogoProps) {
  return <img src="/logo.svg" width={40} alt={alt} {...imgProps} />;
}
