import { ArrowDown, Clock, Gift, Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAndroid, faApple } from "@fortawesome/free-brands-svg-icons";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";

type DeviceOs = "Android" | "iOS" | "unknown";

function getMobileOperatingSystem(): DeviceOs {
  const userAgent = navigator.userAgent;

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "iOS";
  }

  return "unknown";
}

function DownloadButton(props: {
  downloadUrl: string;
  text: string;
  icon: ReactElement;
}) {
  return (
    <button className="w-full sm:w-fit border border-slate-700 hover:bg-gradient-to-r hover:from-primary/80 hover:to-secondary/80 text-slate-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-700 hover:text-white transition-all duration-300 transform hover:scale-105">
      <a href={props.downloadUrl}>
        <span
          className={"flex items-center gap-1 justify-center md:justify-start"}
        >
          {props.icon}
          {props.text}
        </span>
      </a>
    </button>
  );
}

export const HERO_ID = "hero";

export const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      id={HERO_ID}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Animation */}

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-50 mb-12 leading-tight w-full">
            {t("hero.title.part1")}
            <span className="ml-3 bg-gradient-to-r from-primary/80 to-secondary/80 bg-clip-text text-transparent">
              {t("hero.title.part2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-slate-300 mb-8 leading-relaxed">
            {t("hero.subtitle.line1")}
            <br />
            <strong className="text-primary/80">
              {t("hero.subtitle.line2")}
            </strong>
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 text-slate-300">
              <Users className="w-5 h-5 text-primary/80" />
              <span>{t("hero.features.communityDriven")}</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-5 h-5 text-secondary/80" />
              <span>{t("hero.features.timeBasedSharing")}</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Gift className="w-5 h-5 text-violet-400" />
              <span>{t("hero.features.completelyFree")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {(["unknown", "iOS"] as DeviceOs[]).includes(
              getMobileOperatingSystem(),
            ) && (
              <DownloadButton
                downloadUrl={
                  "https://apps.apple.com/us/app/friends-spot/id6742799884"
                }
                icon={
                  <FontAwesomeIcon
                    icon={faApple}
                    size={"xl"}
                    className={"-mt-1"}
                  />
                }
                text={t("hero.download.iOS")}
              />
            )}
            {(["unknown", "Android"] as DeviceOs[]).includes(
              getMobileOperatingSystem(),
            ) && (
              <DownloadButton
                downloadUrl={
                  "https://play.google.com/store/apps/details?id=com.friendspot"
                }
                icon={
                  <FontAwesomeIcon
                    icon={faAndroid}
                    size={"xl"}
                    className={"mr-1"}
                  />
                }
                text={t("hero.download.android")}
              />
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-slate-400" />
        </div>
      </div>
    </section>
  );
};
