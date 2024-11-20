import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Input } from "./ui/input";

interface ActionBouton {
    
    buttonTitle: string, 
    dialogTitle: string,
    details: string
    actionButton: string
}

export function CustomPopUp({buttonTitle, dialogTitle, details, actionButton}: ActionBouton) {
    return(
        <Dialog>
        <DialogTrigger asChild><Button variant={"outline"} className="w-full text-blue-400 h-14">{buttonTitle}</Button></DialogTrigger>
        <DialogContent className="flex flex-col items-center w-10/12 rounded-md">
            <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
                <p className="text-sm">{details}</p>
            <DialogDescription className="flex flex-col gap-4 pt-5 pb-3">
                <div className="flex items-center gap-2">
                    <p>Du</p>
                    <Input type="date"></Input>
                </div>
                <div className="flex items-center gap-2">
                    <p>Au</p>
                    <Input type="date"></Input>
                </div>       
            </DialogDescription>
            </DialogHeader>
            <Button>{actionButton}</Button>
        </DialogContent>
        </Dialog>
    )
}