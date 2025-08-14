import { ArrowDown, Clock, Gift, Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAndroid, faApple } from "@fortawesome/free-brands-svg-icons";
import { ReactElement } from "react";

function DownloadButton(props: {
  downloadUrl: string;
  text: string;
  icon: ReactElement;
}) {
  return (
    <a href={props.downloadUrl}>
      <button className="bg-slate-800 border border-slate-700 hover:bg-gradient-to-r hover:from-emerald-400 hover:to-blue-400 text-slate-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-700 hover:text-white transition-all duration-300 transform hover:scale-105">
        <span className={"flex items-center gap-1"}>
          {props.icon}
          {props.text}
        </span>
      </button>
    </a>
  );
}

export const Hero = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-50 mb-6 leading-tight">
            Share Parking,
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              {" "}
              Save Money
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
            Create parking groups with friends and share spots for free.
            <br />
            <strong className="text-emerald-400">
              1 hour shared = 1 hour earned
            </strong>
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 text-slate-300">
              <Users className="w-5 h-5 text-emerald-400" />

              <span>Community-driven</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-5 h-5 text-blue-400" />

              <span>Time-based sharing</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Gift className="w-5 h-5 text-violet-400" />

              <span>Completely free</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
              text={"Download for iOS"}
            />
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
              text={"Download for Android"}
            />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-slate-400" />
        </div>
      </div>
    </section>
  );
};
