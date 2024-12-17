import { LogoCard, LogoCardProps } from '@/components/logo.tsx';
import { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '@/components/action-button.tsx';
import { UserStatusContext } from '@/components/authentication-guard.tsx';
import { useAuth0 } from '@auth0/auth0-react';
import { Title } from '@/components/title.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { DateTimePicker24h } from '@/components/date-time-picker.tsx';
import { Slider } from '@/components/ui/slider';
import {
	addHours,
	differenceInHours,
	formatDuration,
	intervalToDuration,
	millisecondsToHours
} from 'date-fns';

const routeForAction: { [action: string]: string } = {
	lend: '/availabilities'
};

interface MakeBooking {
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

export function LandingPage() {
	const { user } = useContext(UserStatusContext);
	const [action, setAction] = useState<'lend' | 'book'>();
	const [isOpen, setIsOpen] = useState(false);
	const [from, setFrom] = useState<Date>();
	const [to, setTo] = useState<Date>();
	const [isLoading, setIsLoading] = useState(false);
	const { apiRequest } = useApiRequest();
	const navigate = useNavigate();
	const auth0 = useAuth0();

	const [bookingReserved, setBookingReserved] = useState();

	const [parkingId, setParkingId] = useState<string>();

	const [availableSpots, setAvailableSpots] = useState<AvailableSpot[]>();

	const [sliderValue, setSliderValue] = useState<number[] | undefined>(
		calculateDuration(to?.getTime() - from?.getTime()) || [0]
	);

	// Calculates time between from and to
	function calculateDuration(milliseconds: number): number[] | undefined {
		if (!to || !from) {
			return undefined;
		} else {
			let hours = millisecondsToHours(milliseconds);
			const maxHours = 24;
			if (milliseconds > maxHours) {
				hours = 24;
				return [hours];
			}
			return [hours];
		}
	}

	useEffect(() => {
		if (!to || !from) {
			return;
		}

		const duration = calculateDuration(to?.getTime() - from?.getTime() || 0);
		setSliderValue(duration);

		const formatedDate = to?.toISOString().split('T')[0] + 'T';
		const formatedDuration = to?.toTimeString().split(' ')[0];

		const castToTimestamp = new Date(formatedDate + formatedDuration);

		setTo(castToTimestamp);

		// Modifier setTo pour afficher en directe par exemple ici 2024-12-26T17:20:00+00:00
	}, [from, to]);

	// const now = new Date();
	// const isCurrent = from.getTime() <= now.getTime() && until.getTime() > now.getTime();

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
				const response = await apiRequest('/spots/booking', 'GET');
				setBookingReserved(response);
			} catch (error) {
				console.log(error);
			}
		}

		fetchBooking();
	}, []);

	// Check if user parking is available at certain times?
	useEffect(() => {
		if (!from || !to) {
			return;
		}

		async function checkBookingAvailable() {
			try {
				const response = await apiRequest<AvailableSpotsResponse>(
					`/spots?from=${from?.toISOString()}&to=${to?.toISOString()}`,
					'GET'
				);
				setAvailableSpots(response.availableSpots);
			} catch (error) {
				console.log(error);
			}
		}

		checkBookingAvailable();
	}, [from, to]);

	async function makeBooking() {
		if (!from || !to) {
			return;
		}

		const body: {
			parkingLotId: string;
			from: string;
			duration: string;
		} = {
			parkingLotId: parkingId,
			from: from.toJSON()
		};

		setIsLoading(true);
		apiRequest<MakeBooking>('/spots/booking', 'POST', body)
			.then(() => setIsOpen(false))
			.finally(() => setIsLoading(false));
	}

	return (
		<div className="flex flex-col gap-24 w-full h-full justify-between">
			{!isOpen ? (
				<>
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
					<div className="flex flex-col gap-8 text-center">
						<Title>
							Bonjour <span className="text-primary">{auth0.user?.name}</span>, <br />{' '}
							que souhaites-tu faire ?
						</Title>
						<div className="flex flex-col gap-6">
							<BookingModal>
								<ActionButton
									large
									info={`${user.availableSpots} places sont disponibles dans votre parking`}
									// onClick={() => setIsOpen(true)}
								>
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
			) : (
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogContent className="w-11/12 rounded-lg">
						<DialogHeader>
							<DialogTitle>De quand à quand ?</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-6 mt-4">
							<div className="flex gap-4 items-center justify-between">
								<DateTimePicker24h
									date={from}
									onDateChange={setFrom}
									dateFormat="PPp"
									removeYear
								/>
								<ArrowRight size={16} className="shrink-0" />
								<DateTimePicker24h
									date={to}
									onDateChange={setTo}
									dateFormat="PPp"
									removeYear
								/>
							</div>

							{/* Slider */}

							{sliderValue && (
								<h3>{`${sliderValue} heure${sliderValue > [1] ? 's' : ''}`}</h3>
							)}

							{!!sliderValue && (
								<Slider
									defaultValue={sliderValue}
									onValueChange={(value) => setSliderValue(value)}
									disabled={!sliderValue}
									max={24}
									step={1}
								/>
							)}

							<ActionButton disabled={false} onClick={makeBooking}>
								{isLoading && <LoaderCircle className="animate-spin" />}
								Réserver une place
							</ActionButton>
						</div>
					</DialogContent>
				</Dialog>
			)}
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

function BookingModal(props: { children: ReactNode }) {
	const MAX_HOURS = 24 * 3;

	const [from, setFrom] = useState(new Date());
	const [to, setTo] = useState<Date>();
	const [durationPercent, setDurationPercent] = useState(0);

	useEffect(() => {
		setTo(from && addHours(from, durationPercent * MAX_HOURS));
	}, [durationPercent, from]);

	const updateDurationPercent = useCallback(
		(from: Date, to: Date) => {
			setDurationPercent(differenceInHours(to, from) / MAX_HOURS);
		},
		[from, to]
	);

	return (
		<Dialog>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent className="w-11/12 rounded-lg">
				<DialogHeader>
					<DialogTitle>Réserver une place</DialogTitle>
					<DialogDescription />
				</DialogHeader>
				<div className="flex flex-col gap-6 mt-4">
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

					{to &&
						formatDuration(intervalToDuration({ start: from, end: to }), {
							format: ['days', 'hours', 'minutes']
						})}
					<Slider
						value={[durationPercent * 100]}
						onValueChange={(values) => {
							setDurationPercent(values[0] / 100);
						}}
					/>

					<ActionButton disabled={false}>Réserver une place</ActionButton>
				</div>
			</DialogContent>
		</Dialog>
	);
}
