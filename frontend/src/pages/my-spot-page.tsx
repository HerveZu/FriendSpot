import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';

export function MySpotPage() {
	const baseUrl = import.meta.env.VITE__AUTH0__BASE__URL;

	const { apiRequest } = useApiRequest();

	const [searchParking, setSearchParking] = useState<string>('');
	const [dataSearchParking, setDataSearchParking] = useState([]);
	const [debounceValue] = useDebounce(searchParking, 500);

	// Fetch parkings match with my parking
	useEffect(() => {
		async function fetchSearchParking() {
			const response = await apiRequest(`${baseUrl}/parking?search=${debounceValue}`, 'GET');
			const data = await response.json();
			setDataSearchParking(data);
		}
		fetchSearchParking();
	}, [debounceValue]);

	const filterSearchParking = dataSearchParking.filter((parking) =>
		parking.name.toLowerCase().includes(debounceValue.toLowerCase())
	);

	return (
		<Card className=" flex flex-col mx-auto mt-20 w-[80%]">
			<CardHeader>
				<CardTitle>Mon Spot</CardTitle>
			</CardHeader>
			<CardContent className="relative z-0">
				<Search className="absolute top-[8px] left-[31px] w-6 h-6 opacity-60" />
				<Input
					type="text"
					value={searchParking}
					onChange={(e) => setSearchParking(e.target.value)}
					placeholder="Rechercher votre parking"
					className="pl-10 min-h-[40px]"
				/>
				<div
					className={`flex flex-col gap-2 w-full ${filterSearchParking.length > 0 ? 'flex flex-col gap-3 mt-[-30px] h-auto border bg-[#04060d] pt-12 pb-6 px-2 z-[-10] rounded-lg relative' : ''}`}>
					{filterSearchParking.length > 0 &&
						filterSearchParking.map((parking) => (
							<Button
								variant={'outline'}
								className="whitespace-normal min-h-[40px] py-6 "
								key={parking.id}
								onClick={(e) => {
									setSearchParking(parking.name);
								}}>
								{parking.name}
							</Button>
						))}
				</div>
			</CardContent>
			<CardContent>
				<div className="flex flex-col gap-1 rounded-md border px-4 py-2">
					<p>Mon Parking</p>
					<p className="text-sm">Description</p>
				</div>
			</CardContent>
			<Separator />
			<CardFooter className="flex w-full justify-between mt-5">
				<p>Place numéro</p>
				<p className="flex justify-center w-24 border py-2 rounded-md">122</p>
			</CardFooter>
		</Card>
	);
}
