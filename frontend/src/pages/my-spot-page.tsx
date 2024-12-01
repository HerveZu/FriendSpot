import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { useAuth0 } from '@auth0/auth0-react';
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

const baseUrl = import.meta.env.VITE__AUTH0__BASE__URL;

export function MySpotPage() {
	const { apiRequest } = useApiRequest();
	const { getAccessTokenSilently } = useAuth0();

	const [selectedParking, setSelectedParking] = useState<boolean>(false);
	const [selectedParkingId, setSelectedParkingId] = useState<string>('');
	const [selectedParkingName, setSelectedParkingName] = useState<string>('');
	const [parkingNumber, setParkingNumber] = useState<string>('');

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [dataExistingParking, setDataExistingParking] = useState([]);
	const [debounceValue] = useDebounce(selectedParkingName, 500);

	useEffect(() => {
		async function fetchUserParking() {
			const response = await apiRequest('/@me/spot', 'GET');
			setIsLoading(true);
			if (response.ok) {
				const data = await response.json();
				setIsLoading(false);
				setSelectedParkingId(data.parking.id);
				setSelectedParkingName(data.parking.name);
				setParkingNumber(data.lotName);
				setSelectedParking(false);
			}
		}
		fetchUserParking();
	}, []);

	// Fetch parkings match with my parking
	useEffect(() => {
		async function fetchSearchParking() {
			const response = await apiRequest(`/parking?search=${debounceValue}`, 'GET');
			const data = await response.json();
			setDataExistingParking(data);
		}
		fetchSearchParking();
	}, [debounceValue]);

	async function userParkingChange() {
		const data: {
			parkingId: string;
			lotName: string;
		} = {
			parkingId: selectedParkingId,
			lotName: parkingNumber
		};
		try {
			await fetch(`${baseUrl}/@me/spot`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${await getAccessTokenSilently()}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			setSelectedParking(false);
		} catch (error) {
			console.log(error);
		}
	}

	function selectParking(parkingName: string, parkingId: string) {
		setSelectedParkingName(parkingName);
		setSelectedParkingId(parkingId);
		setSelectedParking(true);
	}

	return (
		<Card className=" flex flex-col mx-auto mt-20 w-[80%]">
			<CardHeader>
				<CardTitle>Mon Spot</CardTitle>
			</CardHeader>
			<CardContent className="relative z-0">
				<Command>
					<CommandInput
						value={selectedParkingName}
						onValueChange={(e) => {
							setSelectedParkingName(e);
							setSelectedParking(false);
						}}
						placeholder="Recherchez votre parking.."
					/>
					<CommandList>
						<CommandGroup>
							{dataExistingParking.map((parking) => (
								<CommandItem
									key={parking.id}
									className="mt-3"
									onSelect={() => selectParking(parking.name, parking.id)}>
									<div className="flex max-w-[225px] gap-2 items-center">
										<p className="">{parking.name}</p>
										<p>{selectedParking && <Check color="green" />}</p>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</CardContent>
			<Separator />
			<CardFooter className="flex flex-col w-full justify-between mt-5 ">
				<div className="flex items-center gap-8">
					<p className={`${parkingNumber.trim().length === 0 ? 'text-red-500' : ''}`}>
						Place numéro
					</p>
					<Input
						className={`flex justify-center w-20 h-9 py-2 rounded-md ${parkingNumber.trim().length === 0 ? 'border-2 border-red-500 focus-visible:ring-0 focus-visible:ring-offset-0' : ''}`}
						type="text"
						value={parkingNumber}
						onChange={(e) => setParkingNumber(e.target.value)}
					/>
				</div>
				<Button
					variant={'default'}
					className="mt-5 w-full cursor-none"
					onClick={() => userParkingChange()}
					disabled={selectedParking === false || parkingNumber.trim().length === 0}>
					{isLoading ? 'En cours..' : 'Enregistrer'}
				</Button>
			</CardFooter>
		</Card>
	);
}
