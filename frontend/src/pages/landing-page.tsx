import { LogoCard, LogoCardProps, useLoading } from '@/components/logo.tsx';
import {
	Dispatch,
	HTMLProps,
	ReactNode,
	SetStateAction,
	useContext,
	useEffect,
	useState
} from 'react';
import { cn } from '@/lib/utils.ts';
import { Link, useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/action-button.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Title } from '@/components/title.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { LoaderCircle, SearchCheck, TriangleAlert } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { DateTimeRangePicker } from '@/components/date-time-picker.tsx';
import { parseDuration } from '@/lib/date.ts';
import { Container } from '@/components/container.tsx';
import { AvailabilityCard } from '@/components/availability-card.tsx';
import { InlineAlert } from '@/components/inline-alert.tsx';

interface BookingsResponse {
	bookings: Booking[];
}

interface Booking {
	bookingId: string;
	duration: string;
	from: string;
	to: string;
	info?: {
		spotName: string;
	};
}

/*-------------------------------------

Chose à faire (je précise pour pour moi (& hervé evidemment qui va venir fouiner ici :p))
coucou

Refactorisation du code :
- Revoir la logique des conditions si nécessaire
- Créer un fichier dédié pour les types afin de rendre le code plus lisible
- Autres améliorations...

-------------------------------------*/

export function LandingPage() {
	const { setIsLoadingOnce, refreshTrigger, forceRefresh } = useLoading('LandingPage');
	const [action, setAction] = useState<HeroAction>();
	const [bookings, setBookings] = useState<BookingsResponse>();
	const [bookingModalOpen, setBookingModalOpen] = useState(false);
	const { apiRequest } = useApiRequest();
	const navigate = useNavigate();
	const auth0 = useAuth0();
	const { user } = useContext(UserStatusContext);

	const routeForAction: { [action: string]: string } = {
		lend: '/availabilities'
	};

	useEffect(() => {
		if (!bookingModalOpen) {
			forceRefresh();
		}
	}, [bookingModalOpen]);

	useEffect(() => {
		if (!action) {
			return;
		}

		const handler = setTimeout(() => navigate(routeForAction[action]), 400);
		return () => clearTimeout(handler);
	}, [navigate, action]);

	// Checks whether the user has reserved parking spaces
	useEffect(() => {
		setIsLoadingOnce(true);

		apiRequest<BookingsResponse>('/spots/booking', 'GET')
			.then(setBookings)
			.finally(() => setIsLoadingOnce(false));
	}, [refreshTrigger]);

	return (
		<div className="flex flex-col w-full h-full justify-between">
			<>
				{bookings && bookings.bookings.length > 0 ? (
					<>
						<Container shrink title={'Mes réservations'}>
							{bookings.bookings.map((booking, i) => (
								<AvailabilityCard
									key={i}
									from={new Date(booking.from)}
									to={new Date(booking.to)}
									duration={parseDuration(booking.duration)}
									nowInfo={
										booking.info?.spotName && `n° ${booking.info.spotName}`
									}
								/>
							))}
						</Container>
						<HeroLogo action={action} className={'h-8 shrink-0 my-8'} />
					</>
				) : (
					<div className={'flex flex-col justify-evenly h-full'}>
						<HeroLogo action={action} className={'mb-12 h-28'} />
						<Title>
							Bonjour <span className="text-primary">{auth0.user?.name}</span>, <br />{' '}
							que souhaites-tu faire ?
						</Title>
						{!user.hasSpot && (
							<InlineAlert className={'space-x-1'} icon={<TriangleAlert />}>
								<Link to={'/myspot'} className={'text-primary'}>
									Défini ton spot
								</Link>
								<span>pour réserver une place</span>
							</InlineAlert>
						)}
					</div>
				)}
				<div className="flex flex-col gap-6">
					<BookingModal open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
						<ActionButton disabled={!user.hasSpot} large>
							Je réserve une place
						</ActionButton>
					</BookingModal>
					<span className="mx-auto text-md">ou</span>
					<ActionButton
						large
						info="Gagner des crédits en prêtant votre place"
						variant="outline"
						onClick={() => setAction('lend')}>
						Je prête ma place
					</ActionButton>
				</div>
			</>
		</div>
	);
}

type HeroAction = 'lend';

function HeroLogo({
	className,
	action,
	...props
}: HTMLProps<HTMLDivElement> & { action?: HeroAction }) {
	return (
		<div className={cn('flex flex-col justify-center', className)} {...props}>
			<div className="flex justify-center h-full">
				<ActionCard
					primary={!!action}
					style={{
						rotate: '-5deg',
						translate: '30%'
					}}
					state={action === 'lend' ? 'active' : 'none'}
				/>
				<ActionCard
					primary={true}
					className="delay-200"
					style={{
						rotate: '15deg',
						translate: '-30% 20%'
					}}
					state={'none'}
				/>
			</div>
		</div>
	);
}

function ActionCard({ className, style, ...props }: { state: 'none' | 'active' } & LogoCardProps) {
	return (
		<LogoCard
			className={cn(
				className,
				'transition-all duration-3000 animate-float',
				!props.primary && props.state === 'active' && 'opacity-25 z-0',
				props.primary &&
					props.state === 'active' &&
					'z-50 animate-none duration-1000 delay-0'
			)}
			style={{
				...style,
				scale: props.primary && props.state === 'active' ? '100' : '1',
				rotate: props.primary && props.state === 'active' ? '0deg' : style?.rotate
			}}
			{...props}
		/>
	);
}

interface MakeBookingResponse {
	parkingLotId: string;
	from: Date;
	to: Date;
}

interface AvailableSpotsResponse {
	availableSpots: AvailableSpot[];
}

interface AvailableSpot {
	parkingLotId: string;
	from: Date;
	until: Date;
}

interface SimulateSpotResponse {
	bookingId: null;
	usedCredits: number;
}

function BookingModal(props: {
	children: ReactNode;
	open: boolean;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [from, setFrom] = useState<Date | undefined>(new Date());
	const [to, setTo] = useState<Date>();

	// null means not found, whereas undefined means unknown
	const [selectedSpot, setSelectedSpot] = useState<AvailableSpot | null>();
	const [usedCredits, setUsedCredits] = useState<number>();
	const { user } = useContext(UserStatusContext);

	const { apiRequest } = useApiRequest();

	const [fromDebounce] = useDebounce(from, 200);
	const [toDebounce] = useDebounce(to, 200);

	function selectRandomSpot(spot: AvailableSpot[]) {
		const randomIndex = Math.floor(Math.random() * spot.length);
		return spot[randomIndex];
	}

	async function simulateSpot(parkingLotId: string) {
		if (!from || !to) {
			return;
		}

		const body: {
			parkingLotId: string;
			from: string;
			to: string;
		} = {
			parkingLotId: parkingLotId,
			from: from.toJSON(),
			to: to?.toJSON()
		};

		const responseSimulation = await apiRequest<SimulateSpotResponse>(
			`/spots/booking?simulation=true`,
			'POST',
			body
		);
		setUsedCredits(responseSimulation.usedCredits);
	}

	async function makeBooking() {
		if (!from || !to || !selectedSpot) {
			return;
		}

		const body: {
			parkingLotId: string;
			from: string;
			to: string;
		} = {
			parkingLotId: selectedSpot.parkingLotId,
			from: from.toJSON(),
			to: to?.toJSON()
		};

		setIsLoading(true);

		try {
			await apiRequest<MakeBookingResponse>(`/spots/booking`, 'POST', body);
		} finally {
			setIsLoading(false);
		}

		props.onOpenChange(false);
	}

	// Check if user parking is available at certain times?
	useEffect(() => {
		if (!fromDebounce || !toDebounce) {
			return;
		}

		async function checkBookingAvailable() {
			const response = await apiRequest<AvailableSpotsResponse>(
				`/spots?from=${fromDebounce?.toISOString()}&to=${toDebounce?.toISOString()}`,
				'GET'
			);

			if (!response.availableSpots || response.availableSpots.length === 0) {
				setUsedCredits(0);
				setSelectedSpot(null);
				return;
			}

			const selectedSpot = selectRandomSpot(response.availableSpots);

			setSelectedSpot(selectedSpot);
			await simulateSpot(selectedSpot.parkingLotId);
		}

		checkBookingAvailable();
	}, [fromDebounce, toDebounce]);

	const notEnoughCredits = !!usedCredits && usedCredits > user.wallet.credits;

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent className="w-11/12 rounded-lg">
				<DialogHeader>
					<DialogTitle>Réserver une place</DialogTitle>
					<DialogDescription
						className={cn(
							'justify-center inline-flex gap-2 items-center',
							!selectedSpot && 'text-destructive'
						)}>
						{selectedSpot !== undefined &&
							(selectedSpot ? (
								<>
									Un spot trouvé dans ton parking !
									<SearchCheck className={'text-primary'} />
								</>
							) : (
								<>Aucun spot trouvé dans ton parking, essaie un autre créneau !</>
							))}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-6">
					<DateTimeRangePicker from={from} setFrom={setFrom} to={to} setTo={setTo} />
					<ActionButton
						disabled={notEnoughCredits || !selectedSpot}
						onClick={makeBooking}>
						{isLoading && <LoaderCircle className={'animate-spin'} />}
						{usedCredits
							? usedCredits > user.wallet.credits
								? `Vous n'avez pas assez de crédits (${usedCredits})`
								: `Réserver pour ${usedCredits} crédits`
							: 'Réserver une place'}
					</ActionButton>
				</div>
			</DialogContent>
		</Dialog>
	);
}
