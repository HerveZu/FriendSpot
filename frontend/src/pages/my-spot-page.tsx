import { Check, MapPin } from 'lucide-react';
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
import { useLoading } from '@/components/logo';
import { ActionButton } from '@/components/action-button.tsx';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { Title } from '@/components/title.tsx';

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
	spot: MySpot;
}

export function MySpotPage() {
	const { apiRequest } = useApiRequest();
	const { setIsLoading } = useLoading('MySpotPage');

	const [parkingAlreadyRegistered, setParkingAlreadyRegistered] =
		useState<ParkingAlreadyRegistered | null>(null);

	const [searchParkingUser, setSearchParkingUser] = useState<MySpot>();
	const parkingUserName = searchParkingUser?.parking?.name;

	const [dataParking, setDataParking] = useState<Parking[]>();
	const [debounceValue] = useDebounce(parkingUserName, 200);

	useEffect(() => {
		fetchParkingAlreadyRegistered().then();
	}, []);

	async function fetchParkingAlreadyRegistered() {
		setIsLoading(true);
		try {
			const response = await apiRequest<ParkingAlreadyRegistered | null>('/@me/spot', 'GET');
			setParkingAlreadyRegistered(response);
		} finally {
			setIsLoading(false);
		}
	}

	// Fetch parking match with my parking in search bar
	useEffect(() => {
		async function fetchSearchParking() {
			const response = await apiRequest<Parking[]>(
				`/parking?search=${debounceValue ?? ''}`,
				'GET'
			);
			setDataParking(response);
		}

		fetchSearchParking().then();
	}, [debounceValue]);

	useEffect(() => {
		setSearchParkingUser(parkingAlreadyRegistered?.spot);
	}, [parkingAlreadyRegistered]);

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
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
			fetchParkingAlreadyRegistered().then();
		}
	}

	return (
		<div className="flex flex-col h-full gap-4">
			<Title>Mon spot</Title>
			{parkingAlreadyRegistered?.spot && (
				<Card>
					<CardTitle />
					<CardDescription />
					<CardContent className={'flex flex-col gap-6 p-6'}>
						<div className={'flex justify-between'}>
							<span className={'font-semibold text-primary'}>
								{parkingAlreadyRegistered?.spot?.parking?.name}
							</span>
							<span>{parkingAlreadyRegistered?.spot.lotName}</span>
						</div>
						<div className={'flex gap-2 text-sm opacity-50'}>
							<MapPin size={18} />
							<span>{parkingAlreadyRegistered?.spot?.parking?.address}</span>
						</div>
					</CardContent>
				</Card>
			)}
			<Card className={'grow'}>
				<CardTitle />
				<CardDescription />
				<CardContent className={'flex flex-col gap-4 h-full min-h-0 p-6'}>
					<Command shouldFilter={false}>
						<CommandInput
							className="truncate ..."
							value={searchParkingUser?.parking?.name}
							onValueChange={(e) => {
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
							placeholder="Recherchez un parking"
						/>
						<CommandList className={'h-full'}>
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
										}}>
										<div className="flex w-full px-2 gap-2 items-center justify-between">
											{parking.name}
											{searchParkingUser && <Check color={'#617FAE'} />}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
					<div className="flex items-center gap-4 w-full justify-between">
						<span className={'text-sm'}>Place n°</span>
						<Input
							className={'w-20 text-center'}
							value={
								searchParkingUser?.lotName ??
								parkingAlreadyRegistered?.spot.lotName ??
								''
							}
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
					<ActionButton
						variant={'default'}
						className="w-full cursor-none"
						onClick={() => setUserParkingChange()}
						disabled={!searchParkingUser?.lotName?.trim()}>
						Enregistrer
					</ActionButton>
				</CardContent>
			</Card>
		</div>
	);
}
