import { LogoCard, LogoCardProps } from '@/components/logo.tsx';
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/action-button.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Title } from '@/components/title.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { ArrowRight, Clock } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { Card, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { DateTimePicker24h } from '@/components/date-time-picker.tsx';
import { Slider } from '@/components/ui/slider';
import { Description } from '@radix-ui/react-dialog';
import {
	addMinutes,
	format,
	formatDuration,
	formatRelative,
	intervalToDuration,
	isToday,
	isTomorrow,
	differenceInHours,
	addHours
} from 'date-fns';
import { parseDuration } from '@/lib/date.ts';
import { Badge } from '@/components/ui/badge.tsx';

interface bookingsResponse {
	bookings: booking[];
	until: string;
}

interface booking {
	bookingId: string;
	duration: string;
	from: string;
	info: null;
}

// -------------------------------------

// Chose à faire (je précise pour pour moi (& hervé evidemment qui va venir fouiner ici :p))

// Refactorisation du code :
// - Revoir la logique des conditions si nécessaire
// - Créer un composant réutilisable pour l'affichage des spots réservés (j'ai supprimé/modifié des éléments pour que ça compile, comme par exemple isCurrent car il manque des informations du backend)
// - Créer un fichier dédié pour les types afin de rendre le code plus lisible
// - Gérer les erreurs côté console qui pop
// - Afficher les cards de bookings par exemple max 2 - 3 et ajouter un scroll
// - Vérifier les imports
// - Autres améliorations...

// -------------------------------------

export function LandingPage() {
	const { user } = useContext(UserStatusContext);
	const [action, setAction] = useState<'lend' | 'book'>();
	const [bookings, setBookings] = useState<booking[]>([]);
	const { apiRequest } = useApiRequest();
	const navigate = useNavigate();
	const auth0 = useAuth0();

	const routeForAction: { [action: string]: string } = {
		lend: '/availabilities'
	};

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
			try {
				const response = await apiRequest<bookingsResponse>('/spots/booking', 'GET');
				if (!bookings || bookings.length === 0) {
					setBookings(response.bookings);
				}
			} catch (error) {
				console.log(error);
			}
		}

		fetchBooking();
	}, []);

	return (
		<div className="flex flex-col gap-24 w-full h-full justify-between">
			<>
				{bookings ? (
					<div className="border">
						{bookings.map((spot) => (
							<BookingCard key={spot.bookingId} bookings={bookings} />
						))}
					</div>
				) : (
					<div className="flex flex-col justify-center grow">
						<div className="flex justify-center gap-6">
							<ActionCard
								primary={!!action || false}
								className="h-28"
								style={{
									rotate: '-5deg',
									translate: '45%'
								}}
								state={
									action ? (action === 'lend' ? 'active' : 'inactive') : 'none'
								}
							/>
							<ActionCard
								primary={true}
								className="h-28 delay-200"
								style={{
									rotate: '15deg',
									translate: '-40% 20%'
								}}
								state={
									action ? (action === 'book' ? 'active' : 'inactive') : 'none'
								}
							/>
						</div>
					</div>
				)}
				<div className="flex flex-col gap-8">
					<Title>
						Bonjour <span className="text-primary">{auth0.user?.name}</span>, <br /> que
						souhaites-tu faire ?
					</Title>
					<div className="flex flex-col gap-6">
						<BookingModal>
							<ActionButton
								large
								info={`${user.availableSpots} places sont disponibles dans votre parking`}>
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
				</div>
			</>
		</div>
	);
}

function ActionCard({
	className,
	style,
	...props
}: { state: 'none' | 'active' | 'inactive' } & LogoCardProps) {
	return (
		<LogoCard
			className={cn(
				className,
				'transition-all duration-3000 animate-float',
				props.state === 'inactive' && 'opacity-25 z-0',
				props.state === 'active' && 'z-50 animate-none duration-1000 delay-0'
			)}
			style={{
				...style,
				scale: props.state === 'active' ? '100' : '1',
				rotate: props.state === 'active' ? '0deg' : style?.rotate
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

function BookingModal(props: { children: ReactNode }) {
	const MAX_HOURS = 24 * 3;

	const [from, setFrom] = useState(new Date());
	const [to, setTo] = useState<Date>();
	const [durationPercent, setDurationPercent] = useState(0);
	const [availableSpots, setAvailableSpots] = useState<AvailableSpot[]>();
	const [usedCredits, setUsedCredits] = useState<number>();
	const [isValid, setIsValid] = useState<boolean>(false);
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
		try {
			const responseSimulation = await apiRequest<SimulateSpotResponse>(
				`/spots/booking?simulation=true`,
				'POST',
				body
			);
			setUsedCredits(responseSimulation.usedCredits);
		} catch (error) {
			console.log(error);
		} finally {
			setIsValid(true);
		}
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

		try {
			await apiRequest<MakeBookingResponse>(`/spots/booking`, 'POST', body);
		} catch (error) {
			setInfoMessage("Une erreur s'est produite");
			setIsValid(false);
			console.error(error);
		}
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
			try {
				const response = await apiRequest<AvailableSpotsResponse>(
					`/spots?from=${fromDebounce?.toISOString()}&to=${toDebounce?.toISOString()}`,
					'GET'
				);

				if (!response.availableSpots || response.availableSpots.length === 0) {
					setInfoMessage(
						'Aucun spot trouvé dans ton parking 😞\nEssaie un autre créneau !'
					);
					setUsedCredits(0);
					setAvailableSpots([]);
					setIsValid(false);
					return;
				}

				setInfoMessage('Un spot trouvé dans ton parking ! 🤗');
				if (response.availableSpots.length > 1) {
					selectRandomSpot(response.availableSpots);
				} else {
					setAvailableSpots(response.availableSpots);
					simulateSpot(response.availableSpots[0].parkingLotId);
				}
				setIsValid(true);
			} catch (error) {
				console.error('Erreur lors de la vérification des disponibilités:', error);
				setInfoMessage(
					'Erreur lors de la vérification des disponibilités. Veuillez réessayer.'
				);
				setIsValid(false);
			}
		}
		checkBookingAvailable();
	}, [fromDebounce, toDebounce]);

	return (
		<Dialog>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent className="w-11/12 rounded-lg">
				<Description />
				<DialogHeader className="mb-2">
					<DialogTitle>Réserver une place</DialogTitle>
				</DialogHeader>
				<div className="text-sm text-center min-h-10">{infoMessage && infoMessage}</div>
				<div className="flex flex-col gap-5 mt-3">
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
						<div className="text-sm min-h-5">
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
						disabled={
							!!usedCredits && usedCredits > user.wallet.credits
								? true
								: toDebounce && fromDebounce.getTime() === toDebounce.getTime()
						}
						onClick={isValid ? () => makeBooking() : undefined}>
						{usedCredits
							? usedCredits > user.wallet.credits
								? "Vous n'avez pas assez de crédits"
								: `Réserver pour ${usedCredits} crédits ?`
							: 'Réserver une place'}
					</ActionButton>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function BookingCard(props: { bookings: booking[] }) {
	return (
		<>
			{props.bookings.map((booking) => {
				const from = new Date(booking.from);
				const now = new Date();
				const isCurrent = true;

				return (
					<Card key={booking.bookingId} className={'p-4'}>
						<CardTitle
							className={'flex text-lg items-center justify-between capitalize'}>
							{formatRelative(from, now)}
							{!isCurrent && isToday(from) && <Badge>Aujourd&apos;hui</Badge>}
							{isTomorrow(from) && <Badge>Demain</Badge>}
							{isCurrent && <Badge>Maintenant</Badge>}
						</CardTitle>
						<CardDescription className={'flex flex-col gap-4'}>
							<div className={'flex gap-2 items-center text-primary'}>
								<Clock size={18} />
								{formatDuration(parseDuration(booking.duration), {
									format: ['days', 'hours', 'minutes']
								})}
							</div>
							<div className={'flex gap-2 items-center'}>
								<span>{format(from, 'PPp')}</span>
								<ArrowRight size={16} />
							</div>
						</CardDescription>
					</Card>
				);
			})}
		</>
	);
}
