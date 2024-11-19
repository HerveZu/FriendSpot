import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';

export function MySpotPage() {
	return (
		<Card className=" flex flex-col mx-auto mt-20 w-[80%]">
			<CardHeader>
				<CardTitle>Mon Spot</CardTitle>
			</CardHeader>
			<CardContent>
			<div className="relative">
			<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-60"/>
			<Input
				type="text"
				placeholder="Chercher un parking"
				className="pl-10"
			/>
    </div>
			</CardContent>
			<CardContent>
				<div className='flex flex-col gap-1 rounded-md border px-4 py-2'>
					<p>Mon Parking</p>
					<p className='text-sm'>Description</p>
				</div>
			</CardContent>
			<Separator />
			<CardFooter className="flex w-full justify-between mt-5">
				<p>Place numéro</p>
				<p className='flex justify-center w-24 border py-2 rounded-md'>122</p>
			</CardFooter>
		</Card>
	);
}
