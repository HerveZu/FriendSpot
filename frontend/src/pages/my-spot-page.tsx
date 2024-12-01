import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

interface IParkingsList {
	id: string;
	address: string;
	name: string;
}
interface SetMySpot {
	parkingId: string;
	lotName: string;
}

interface MySpot {
	lotName?: string;
	parking?: {
		address?: string;
		id?: string;
		name?: string;
	};
}

export function MySpotPage() {
	const { apiRequest } = useApiRequest();

	const [parkingUser, setParkingUser] = useState<MySpot>();

	const [selectedParking, setSelectedParking] = useState<boolean>(false);

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [dataParkingsList, setDataParkingsList] = useState<IParkingsList[] | undefined>();
	const [debounceValue] = useDebounce(parkingUser ? parkingUser?.parking?.name : '', 500);

	// Check if the user has a registered parking space
	useEffect(() => {
		async function fetchUserParking() {
			setIsLoading(true);
			try {
				const response = await apiRequest<MySpot>('/@me/spot', 'GET');
				setParkingUser(response);
				setSelectedParking(false);
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		}
		fetchUserParking();
	}, []);

	// Fetch parkings match with my parking
	useEffect(() => {
		async function fetchSearchParking() {
			try {
				const response = await apiRequest<IParkingsList[]>(
					`/parking?search=${debounceValue}`,
					'GET'
				);
				setDataParkingsList(response);
			} catch (error) {
				console.log(error);
			}
		}
		fetchSearchParking();
	}, [debounceValue]);

	// Update user parking info
	async function setUserParkingChange() {
		const body: {
			parkingId: string | undefined;
			lotName: string | undefined;
		} = {
			parkingId: parkingUser?.parking?.id,
			lotName: parkingUser?.lotName
		};
		try {
			await apiRequest<SetMySpot>('/@me/spot', 'PUT', body);
			setSelectedParking(false);
		} catch (error) {
			console.log(error);
		} finally {
			setDataParkingsList(undefined);
		}
	}

	return (
		<Card className=" flex flex-col mx-auto mt-20 w-[80%]">
			<CardHeader>
				<CardTitle>Mon Spot</CardTitle>
			</CardHeader>
			<CardContent className="relative z-0">
				<Command>
					<CommandInput
						value={parkingUser?.parking?.name}
						onValueChange={(e) => {
							const newName = e;
							setParkingUser((prevState) => ({
								...prevState,
								lotName: prevState?.lotName,
								parking: {
									...prevState?.parking,
									name: newName
								}
							}));
						}}
						placeholder="Recherchez votre parking..."
					/>
					<CommandList>
						<CommandGroup>
							{dataParkingsList?.map((parking) => (
								<CommandItem
									key={parking.id}
									className="mt-3"
									onSelect={() => {
										setParkingUser((prevState) => ({
											...prevState,
											lotName: prevState?.lotName,
											parking: {
												...prevState?.parking,
												id: parking.id,
												name: parking.name
											}
										}));
										setSelectedParking(true);
									}}>
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
					<p
						className={`${parkingUser?.lotName?.trim().length === 0 ? 'text-destructive' : ''}`}>
						Place numéro :
					</p>
					<Input
						className={`flex justify-center w-20 h-9 py-2 rounded-md ${parkingUser?.lotName?.trim().length === 0 ? 'border-2 border-destructive focus-visible:ring-0 focus-visible:ring-offset-0' : ''}`}
						type="text"
						value={parkingUser?.lotName}
						onChange={(e) => {
							const newLotName = e.target.value;

							setParkingUser((prevState) => ({
								...prevState,
								lotName: newLotName,
								parking: {
									...prevState?.parking
								}
							}));
						}}
					/>
				</div>
				<Button
					variant={'default'}
					className="mt-5 w-full cursor-none"
					onClick={() => setUserParkingChange()}
					disabled={
						selectedParking === false || parkingUser?.lotName?.trim().length === 0
					}>
					{isLoading ? 'En cours..' : 'Enregistrer'}
				</Button>
			</CardFooter>
		</Card>
	);
}
