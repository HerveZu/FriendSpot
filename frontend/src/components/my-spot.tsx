import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function MySpot() {
  return (
    <Card className=" flex flex-col mx-auto mt-20 w-[80%]">
      <CardHeader>
        <CardTitle>Mon Spot</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="text" placeholder="Chercher un parking" />
      </CardContent>
      <CardContent>
        <p>Mon Parking</p>
      </CardContent>
      <Separator />
      <CardFooter className="mt-5">
        <p>Place numéro 122</p>
      </CardFooter>
    </Card>
  );
}
