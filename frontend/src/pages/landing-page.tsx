import { CustomPopUp } from "@/components/custom-pop-up";

export function LandingPage() {
    return(
        <div className="flex flex-col mt-14 gap-5 text-lg px-8">
            <h1 className="text-xl">Bienvenue sur <span className="text-blue-400">FriendSpot</span> (bêta)</h1>
            <p className="text-base">12 places sont actuellement libres <br/>  dans votre parking</p>
            <div className="flex flex-col mt-5 gap-5">
                <CustomPopUp
                  buttonTitle="Réserver une place"
                  dialogTitle="Réserver une place"
                  details="3 places disponibles"
                  actionButton="Je réserve pour 4 crédits"
                />
                <CustomPopUp
                  buttonTitle="Je prête ma place"
                  dialogTitle="Je prête ma place"
                  details=""
                  actionButton="Prêter ma place et gagner 2 crédits"
                />
            </div>
            <div className="flex flex-col gap-5 mt-3">
                <h2>Mes <span className="text-[#60A5FA]">Réservations</span></h2>
                <div className="flex flex-col gap-1 border min-h-[50px] rounded-lg px-3 py-3">
                    <p className="text-base">Place no 123A</p>
                    <p className="text-xs">Jusqu'au 16 novembre à 20h</p>
                </div>
                <div className="flex flex-col justify-center gap-1 border min-h-[50px] rounded-md px-2.5 py-2">
                    <p className="text-xs">Jusqu'au 16 novembre à 20h</p>
                </div>
            </div>
        </div>
    )
}