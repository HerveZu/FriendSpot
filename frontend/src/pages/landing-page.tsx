import { LogoCard, LogoCardProps, useLoading } from '@/components/logo.tsx';
import {
	Dispatch,
	HTMLProps,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState
} from 'react';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/action-button.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Title } from '@/components/title.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { DateTimePicker24h } from '@/components/date-time-picker.tsx';
import { Slider } from '@/components/ui/slider';
import { DialogDescription } from '@radix-ui/react-dialog';
import {
	addHours,
	addMinutes,
	differenceInHours,
	formatDuration,
	intervalToDuration
} from 'date-fns';
import { parseDuration } from '@/lib/date.ts';
import { Container } from '@/components/container.tsx';
import { AvailabilityCard } from '@/components/availability-card.tsx';

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
	const { setIsLoading, refreshTrigger, forceRefresh } = useLoading('LandingPage');
	const [action, setAction] = useState<HeroAction>();
	const [bookings, setBookings] = useState<BookingsResponse>();
	const [bookingModalOpen, setBookingModalOpen] = useState(false);
	const { apiRequest } = useApiRequest();
	const navigate = useNavigate();
	const auth0 = useAuth0();

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
		async function fetchBooking() {
			setIsLoading(true);

			try {
				const response = await apiRequest<BookingsResponse>('/spots/booking', 'GET');
				setBookings(response);
			} finally {
				setIsLoading(false);
			}
		}

		fetchBooking();
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
					</div>
				)}
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-6">
						<BookingModal open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
							<ActionButton large>Je réserve une place</ActionButton>
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
	const MAX_HOURS = 24 * 3;
	const INITIAL_DURATION_HOURS = 2;

	const [isLoading, setIsLoading] = useState(false);

	const [from, setFrom] = useState(new Date());
	const [to, setTo] = useState<Date>();
	const [durationPercent, setDurationPercent] = useState(INITIAL_DURATION_HOURS / MAX_HOURS);
	const [availableSpots, setAvailableSpots] = useState<AvailableSpot[]>();
	const [usedCredits, setUsedCredits] = useState<number>();
	const [infoMessage, setInfoMessage] = useState<string>('');
	const { user } = useContext(UserStatusContext);
	const now = new Date();

	const { apiRequest } = useApiRequest();

	const [fromDebounce] = useDebounce(from, 500);
	const [toDebounce] = useDebounce(to, 500);

	function selectRandomSpot(spot: AvailableSpot[]) {
		const randomIndex = Math.floor(Math.random() * spot.length);
		const selectedSpot = [spot[randomIndex]];
		setAvailableSpots(selectedSpot);
		simulateSpot(selectedSpot[0].parkingLotId);
	}

	const everySecond = now.getTime() % 1000;

	useEffect(() => {
		if (!from || from <= now) {
			setFrom(addMinutes(now, 30));
		}

		if (to && to < now) {
			setTo(addMinutes(now, 30));
		}
	}, [everySecond]);

	useEffect(() => {
		if (from && to && from.getTime() >= to.getTime()) {
			setTo(addMinutes(from, 30));
		}
	}, [from, to]);

	async function simulateSpot(parkingLotId: string) {
		if (!from || !to || !availableSpots) {
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
		if (!from || !to || !availableSpots) {
			return;
		}

		const body: {
			parkingLotId: string;
			from: string;
			to: string;
		} = {
			parkingLotId: availableSpots[0].parkingLotId,
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

	useEffect(() => {
		setTo(from && addHours(from, durationPercent * MAX_HOURS));
	}, [durationPercent, from]);

	const updateDurationPercent = useCallback(
		(from: Date, to: Date) => {
			setDurationPercent(differenceInHours(to, from) / MAX_HOURS);
		},
		[from, to]
	);

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
				setInfoMessage('Aucun spot trouvé dans ton parking 😞\nEssaie un autre créneau !');
				setUsedCredits(0);
				setAvailableSpots([]);
				return;
			}

			setInfoMessage('Un spot trouvé dans ton parking ! 🤗');
			if (response.availableSpots.length > 1) {
				selectRandomSpot(response.availableSpots);
			} else {
				setAvailableSpots(response.availableSpots);
				simulateSpot(response.availableSpots[0].parkingLotId);
			}
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
					<DialogDescription />
				</DialogHeader>
				<div className="text-center">{infoMessage}</div>
				<div className="flex flex-col gap-5">
					<div className="flex gap-4 items-center justify-between">
						<DateTimePicker24h
							date={from}
							onDateChange={(from) => {
								setFrom(from);

								if (from && to) {
									updateDurationPercent(from, to);
								}
							}}
							dateFormat="PPp"
							removeYear
						/>
						<ArrowRight size={16} className="shrink-0" />
						<DateTimePicker24h
							date={to}
							onDateChange={(to) => {
								setTo(to);

								if (from && to) {
									updateDurationPercent(from, to);
								}
							}}
							dateFormat="PPp"
							removeYear
						/>
					</div>

					{to && (
						<div className="text-sm">
							{formatDuration(intervalToDuration({ start: from, end: to }), {
								format: ['days', 'hours', 'minutes']
							})}
						</div>
					)}
					<Slider
						defaultValue={[100]}
						value={[durationPercent * 100]}
						onValueChange={(values) => {
							setDurationPercent(values[0] / 100);
						}}
					/>

					<ActionButton
						disabled={notEnoughCredits || availableSpots?.length === 0}
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
