import { Container } from '@/components/container.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useLoading } from '@/components/logo.tsx';
import { Card, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { ArrowRight, Clock, Info, LoaderCircle, TriangleAlert } from 'lucide-react';
import {
	addMinutes,
	format,
	formatDuration,
	formatRelative,
	intervalToDuration,
	isToday,
	isTomorrow
} from 'date-fns';
import { Badge } from '@/components/ui/badge.tsx';
import { ActionButton } from '@/components/action-button.tsx';
import { parseDuration } from '@/lib/date.ts';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { DateTimePicker24h } from '@/components/date-time-picker.tsx';
import { Link } from 'react-router-dom';
import { InlineAlert } from '@/components/inline-alert.tsx';

type Availabilities = {
	readonly totalDuration: string;
	readonly availabilities: Availability[];
};

type Availability = {
	readonly from: string;
	readonly to: string;
	readonly duration: string;
};

type MySpot = {
	spot?: {
		lotName?: string;
	};
};

export function AvailabilitiesPage() {
	const { apiRequest } = useApiRequest();
	const { isLoading, setIsLoading, refreshTrigger, forceRefresh } = useLoading('availabilities');
	const [availabilities, setAvailabilities] = useState<Availabilities>();
	const [mySpot, setMySpot] = useState<MySpot>();

	useEffect(() => {
		setIsLoading(true);

		apiRequest<Availabilities>('/spots/availabilities', 'GET')
			.then(setAvailabilities)
			.finally(() => setIsLoading(false));
	}, [refreshTrigger]);

	useEffect(() => {
		apiRequest<MySpot>('/@me/spot', 'GET').then(setMySpot);
	}, []);

	const hasSpot = !!mySpot?.spot;
	const hasAvailabilities = availabilities && availabilities.availabilities.length > 0;

	return (
		<div className={'h-full flex flex-col gap-4'}>
			<Container
				className={'flex flex-col gap-2'}
				title={'Je prête ma place'}
				description={
					!isLoading && !hasSpot ? (
						<InlineAlert className={'space-x-1'} icon={<TriangleAlert />}>
							<Link to={'/myspot'} className={'text-primary'}>
								Défini un spot
							</Link>
							<span>pour prêter ta place !</span>
						</InlineAlert>
					) : (
						!hasAvailabilities && (
							<InlineAlert icon={<Info />}>
								Tu ne prêtes pas encore ta place
							</InlineAlert>
						)
					)
				}>
				{hasAvailabilities &&
					availabilities?.availabilities.map((availability, i) => (
						<AvailabilityCard key={i} availability={availability} />
					))}
			</Container>
			<LendSpotPopup onSubmit={forceRefresh}>
				<ActionButton
					disabled={!hasSpot}
					large
					info={
						hasAvailabilities
							? `Tu prêtes ta place un total de ${formatDuration(
									parseDuration(availabilities.totalDuration),
									{
										format: ['days', 'hours', 'minutes']
									}
								)}`
							: undefined
					}>
					Je prête ma place
				</ActionButton>
			</LendSpotPopup>
		</div>
	);
}

function AvailabilityCard(props: { availability: Availability }) {
	const from = new Date(props.availability.from);
	const to = new Date(props.availability.to);
	const now = new Date();
	const isCurrent = from.getTime() <= now.getTime() && to.getTime() > now.getTime();

	return (
		<Card className={'p-4'}>
			<CardTitle className={'flex text-lg items-center justify-between capitalize'}>
				{formatRelative(from, now)}
				{!isCurrent && isToday(from) && <Badge>Aujourd&apos;hui</Badge>}
				{isTomorrow(from) && <Badge>Demain</Badge>}
				{isCurrent && <Badge>Maintenant</Badge>}
			</CardTitle>
			<CardDescription className={'flex flex-col gap-4'}>
				<div className={'flex gap-2 items-center text-primary'}>
					<Clock size={18} />
					{formatDuration(parseDuration(props.availability.duration), {
						format: ['days', 'hours', 'minutes']
					})}
				</div>
				<div className={'flex gap-2 items-center'}>
					<span>{format(from, 'PPp')}</span>
					<ArrowRight size={16} />
					<span>{format(to, 'PPp')}</span>
				</div>
			</CardDescription>
		</Card>
	);
}

type MakeSpotAvailableBody = {
	from: string;
	to: string;
};

type MakeSpotAvailableResponse = {
	overlaps: boolean;
	earnedCredits: number;
};

function LendSpotPopup(props: { children: ReactNode; onSubmit: () => void }) {
	const [from, setFrom] = useState<Date>();
	const [to, setTo] = useState<Date>();
	const now = new Date();
	const { apiRequest } = useApiRequest();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [simulatedLend, setSimulatedLend] = useState<MakeSpotAvailableResponse>();

	useEffect(() => {
		if (!from || !to) {
			return;
		}

		apiRequest<MakeSpotAvailableResponse, MakeSpotAvailableBody>(
			'/spots/availabilities?simulation=true',
			'POST',
			{
				from: from.toISOString(),
				to: to.toISOString()
			}
		).then(setSimulatedLend);
	}, [from, to]);

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

	const isValid = useMemo(() => from && to, [from, to]);
	const duration = useMemo(
		() =>
			to && from
				? intervalToDuration({
						start: from,
						end: to
					})
				: undefined,
		[from, to]
	);

	async function makeSpotAvailable() {
		if (!from || !to) {
			return;
		}

		if (to.getTime() <= from.getTime()) {
			return;
		}

		setIsLoading(true);
		apiRequest<void, MakeSpotAvailableBody>('/spots/availabilities', 'POST', {
			from: from.toISOString(),
			to: to.toISOString()
		})
			.then(() => {
				setIsOpen(false);
				props.onSubmit();
			})
			.finally(() => setIsLoading(false));
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{props.children}</DialogTrigger>
			<DialogContent className={'w-11/12 rounded-lg'}>
				<DialogHeader>
					<DialogTitle>Prêter ma place</DialogTitle>
					<DialogDescription>
						Prêter votre place te permet de gagner des crédits
					</DialogDescription>
				</DialogHeader>
				<div className={'flex flex-col gap-6'}>
					<div className={'flex gap-4 items-center justify-between'}>
						<DateTimePicker24h
							date={from}
							onDateChange={setFrom}
							dateFormat={'PPp'}
							removeYear
						/>
						<ArrowRight size={16} className={'shrink-0'} />
						<DateTimePicker24h
							date={to}
							onDateChange={setTo}
							dateFormat={'PPp'}
							removeYear
						/>
					</div>

					{simulatedLend?.overlaps && (
						<InlineAlert icon={<TriangleAlert />} className={'h-8 text-sm'}>
							Tu prêtes déjà ta place pendant cette période
						</InlineAlert>
					)}
					<ActionButton
						info={
							// duration = 0 is falsy, but still needs to be displayed
							duration !== undefined ? (
								<span className={'flex items-center gap-2'}>
									<Clock size={16} />
									{formatDuration(duration, {
										format: ['days', 'hours', 'minutes']
									})}
								</span>
							) : undefined
						}
						disabled={!isValid || simulatedLend?.earnedCredits === 0}
						onClick={makeSpotAvailable}>
						{isLoading && <LoaderCircle className={'animate-spin'} />}
						{`Prêter ma place ${simulatedLend ? `pour ${simulatedLend.earnedCredits} crédits` : ''}`}
					</ActionButton>
				</div>
			</DialogContent>
		</Dialog>
	);
}
