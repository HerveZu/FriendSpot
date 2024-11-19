import { BookPlaceBtn } from "@/components/book-place-btn";
import { Button } from "@/components/ui/button";

export function LandingPage() {
    return(
        <div className="flex flex-col mt-14 gap-5 text-lg px-8 h-[calc(100vh-56px)]">
            <p>12 places sont actuellement libres
            dans votre parking</p>
            <div className="flex flex-col mt-5 gap-5">
                <BookPlaceBtn/>
                <Button variant={"outline"} className="text-blue-400 h-14">Prêter ma place</Button>
            </div>
            <div className="flex flex-col gap-3 mt-5">
                <h2>Mes Réservation</h2>
                <div className="flex flex-col gap-1 border min-h-[50px] rounded-lg px-2.5 py-2">
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