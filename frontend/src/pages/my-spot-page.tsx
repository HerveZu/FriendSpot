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
import { useLoading } from '@/components/logo';

interface Parking {
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

interface ParkingAlreadyRegistered {
	spot: {
		lotName: string;
		parking: {
			address: string;
			id: string;
			name: string;
		};
	};
}

export function MySpotPage() {
	const { apiRequest } = useApiRequest();

	const [parkingAlreadyRegistered, setParkingAlreadyRegistered] =
		useState<ParkingAlreadyRegistered | null>(null);

	const [searchParkingUser, setSearchParkingUser] = useState<MySpot>();

	const parkingUserName = searchParkingUser?.parking?.name;

	const [handleSelectedParking, setHandleSelectedParking] = useState<boolean>(false);

	const [dataParking, setDataParking] = useState<Parking[]>();

	const [debounceValue] = useDebounce(parkingUserName, 500);

	const { setIsLoading } = useLoading('MySpotPage');

	// Check if the user has a registered parking space
	useEffect(() => {
		fetchParkingAlreadyRegistered();
	}, []);

	async function fetchParkingAlreadyRegistered() {
		// setIsLoading(true);
		try {
			const response = await apiRequest<ParkingAlreadyRegistered | null>('/@me/spot', 'GET');
			setParkingAlreadyRegistered(response);
			setHandleSelectedParking(false);
		} catch (error) {
			console.log(error);
		} finally {
			// setIsLoading(false);
		}
	}

	// Fetch parkings match with my parking in searche bar
	useEffect(() => {
		async function fetchSearchParking() {
			try {
				const response = await apiRequest<Parking[]>(
					`/parking?search=${debounceValue ?? ''}`,
					'GET'
				);
				setDataParking(response);
			} catch (error) {
				console.log(error);
			}
		}
		fetchSearchParking();
	}, [debounceValue]);

	//  Update parking spot user info
	async function setUserParkingChange() {
		setIsLoading(true);
		const body: {
			parkingId: string | undefined;
			lotName: string | undefined;
		} = {
			parkingId: searchParkingUser?.parking?.id,
			lotName: searchParkingUser?.lotName
		};
		try {
			await apiRequest<SetMySpot>('/@me/spot', 'PUT', body);
			setHandleSelectedParking(false);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(true);
			fetchParkingAlreadyRegistered();
		}
	}

	return (
		<div className="flex flex-col gap-6 mx-auto w-[95%] min-h-[200px]">
			<Card className="flex flex-col mt-05">
				<CardHeader>
					<CardTitle>Mon Spot</CardTitle>
				</CardHeader>
				<CardContent className="relative z-0 min-h-[250px]">
					<Command>
						<CommandInput
							className="truncate ..."
							value={searchParkingUser?.parking?.name}
							onValueChange={(e) => {
								setHandleSelectedParking(false);
								const newName = e;
								setSearchParkingUser((prevState) => ({
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
								{dataParking?.map((parking) => (
									<CommandItem
										key={parking.id}
										className="mt-3"
										onSelect={() => {
											setSearchParkingUser((prevState) => ({
												...prevState,
												lotName: prevState?.lotName,
												parking: {
													...prevState?.parking,
													id: parking.id,
													name: parking.name
												}
											}));
											setHandleSelectedParking(!handleSelectedParking);
										}}>
										<div className="flex w-full px-2 gap-2 items-center">
											<p>{parking.name}</p>
											<p>
												{handleSelectedParking && (
													<Check color={'#617FAE'} />
												)}
											</p>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</CardContent>
				<Separator />
				<CardFooter className="flex flex-col w-full justify-between mt-5 ">
					<div className="flex items-center gap-24">
						<p className={'text-sm'}>Place numéro :</p>
						<Input
							className={`flex justify-center w-16 h-9 py-2 rounded-md`}
							type="text"
							value={searchParkingUser?.lotName}
							onChange={(e) => {
								const newLotName = e.target.value;

								setSearchParkingUser((prevState) => ({
									...prevState,
									lotName: newLotName,
									parking: prevState?.parking
								}));
							}}
						/>
					</div>
					<Button
						variant={'default'}
						className="mt-5 w-full cursor-none"
						onClick={() => setUserParkingChange()}
						disabled={!handleSelectedParking || !searchParkingUser?.lotName?.trim()}>
						Enregistrer
					</Button>
				</CardFooter>
			</Card>

			{parkingAlreadyRegistered?.spot !== null && (
				<Card>
					<CardHeader>
						<CardTitle className="mb-2">
							Vos <span className="text-primary">informations</span>
						</CardTitle>
						<Separator />
					</CardHeader>
					<>
						<CardContent className="flex flex-col items-start gap-2 pb-5">
							<p className="text-sm">{`Votre numéro de place :`}</p>
							<p className="text-sm text-primary">{`${parkingAlreadyRegistered?.spot?.lotName}`}</p>
						</CardContent>
						<CardFooter className="flex flex-col items-start gap-2">
							<p className="text-sm">{`Adresse de parking :`}</p>
							<p className="text-sm text-primary">{`${parkingAlreadyRegistered?.spot?.parking?.name}`}</p>
						</CardFooter>
					</>
				</Card>
			)}
		</div>
	);
}
