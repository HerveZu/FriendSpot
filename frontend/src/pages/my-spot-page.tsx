import { Check, LoaderCircle, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
	lotName: string;
	parking: {
		address: string;
		id: string;
		name: string;
	};
}

interface ParkingAlreadyRegistered {
	spot?: MySpot;
}

export function MySpotPage() {
	const [mySpot, setMySpot] = useState<MySpot>();

	return (
		<div className="flex flex-col h-full gap-4">
			<Title>Mon spot</Title>
			<Spot spot={mySpot} onSpotFetched={setMySpot} />
			<ParkingSearch spot={mySpot} />
		</div>
	);
}

function Spot(props: { spot?: MySpot; onSpotFetched: (spot?: MySpot) => void }) {
	const { apiRequest } = useApiRequest();
	const { setIsLoading, refreshTrigger } = useLoading('MySpot.Spot');

	useEffect(() => {
		setIsLoading(true);

		apiRequest<ParkingAlreadyRegistered>('/@me/spot', 'GET')
			.then((data) => props.onSpotFetched(data.spot))
			.finally(() => setIsLoading(false));
	}, [refreshTrigger]);

	return (
		props.spot && (
			<Card>
				<CardTitle />
				<CardDescription />
				<CardContent className={'flex flex-col gap-6 p-6'}>
					<div className={'flex justify-between'}>
						<span className={'font-semibold'}>{props.spot?.parking.name}</span>
						<span>{props.spot?.lotName}</span>
					</div>
					<div className={'flex gap-2 text-sm opacity-75'}>
						<MapPin size={18} />
						<span>{props.spot?.parking.address}</span>
					</div>
				</CardContent>
			</Card>
		)
	);
}

function ParkingSearch(props: { spot?: MySpot }) {
	const { apiRequest } = useApiRequest();
	const { isLoading, setIsLoading, forceRefresh } = useLoading('MySpot.ParkingSearch');
	const [selectedParking, setSelectedParking] = useState<Parking>();
	const [lotName, setLotName] = useState('');
	const [search, setSearch] = useState('');
	const [dataParking, setDataParking] = useState<Parking[]>();
	const [debounceSearch] = useDebounce(search, 200);

	useEffect(() => {
		setSelectedParking(props.spot?.parking);
		setLotName(props.spot?.lotName ?? '');
		setSearch(props.spot?.parking.address ?? '');
	}, [props.spot]);

	useEffect(() => {
		setIsLoading(true);
		apiRequest<Parking[]>(`/parking?search=${debounceSearch ?? ''}`, 'GET')
			.then(setDataParking)
			.finally(() => setIsLoading(false));
	}, [debounceSearch]);

	const saveParking = useCallback(async () => {
		setIsLoading(true);

		try {
			await apiRequest<SetMySpot>('/@me/spot', 'PUT', {
				parkingId: selectedParking?.id,
				lotName: lotName
			});
		} finally {
			setIsLoading(false);
			forceRefresh();
		}
	}, [selectedParking, lotName]);

	const hasChanged =
		props.spot?.parking.id !== selectedParking?.id || props.spot?.lotName !== lotName;

	return (
		<Card className={'grow'}>
			<CardTitle />
			<CardDescription />
			<CardContent className={'flex flex-col gap-4 h-full min-h-0 p-6'}>
				<Command shouldFilter={false}>
					<CommandInput
						className="truncate ..."
						value={search}
						onValueChange={setSearch}
						placeholder="Recherchez un parking"
					/>
					<CommandList className={'h-full'}>
						<CommandGroup>
							{dataParking?.map((parking) => (
								<CommandItem
									key={parking.id}
									className="mt-3"
									onSelect={() => setSelectedParking(parking)}>
									<div className="flex w-full px-2 gap-2 items-center justify-between">
										<span className={'flex flex-col gap-2'}>
											<span className={'font-semibold'}>{parking.name}</span>
											<span className={'flex gap-2 text-xs opacity-75'}>
												<MapPin />
												{parking.address}
											</span>
										</span>
										{parking.id === selectedParking?.id && (
											<Check className={'text-primary'} />
										)}
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
						value={lotName}
						onChange={(e) => setLotName(e.target.value)}
					/>
				</div>
				<ActionButton
					variant={'default'}
					className="w-full cursor-none"
					onClick={() => saveParking()}
					disabled={!selectedParking || !lotName || !hasChanged}>
					{isLoading && <LoaderCircle className={'animate-spin'} />}
					Enregistrer
				</ActionButton>
			</CardContent>
		</Card>
	);
}
