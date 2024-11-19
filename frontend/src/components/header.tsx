import { Button } from "./ui/button";
import { Car } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <div className="flex justify-between items-center px-4 py-2">
      <Link to={"/"}>
        <Car />
      </Link>
      <div className="flex items-center gap-3">
        <p>32 crédits</p>
        <Separator orientation="vertical" className="w-[2px] h-[25px]" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant={"outline"}>Jimmy</Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <Link to={"/myspot"}>
              <DropdownMenuItem>Mon Spot</DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
