import { Container } from '@/components/container.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useLoading } from '@/components/logo.tsx';
import { Info, LoaderCircle, TriangleAlert } from 'lucide-react';
import { formatDuration } from 'date-fns';
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
import { DateTimeRangePicker } from '@/components/date-time-picker.tsx';
import { Link } from 'react-router-dom';
import { InlineAlert } from '@/components/inline-alert.tsx';
import { AvailabilityCard } from '@/components/availability-card.tsx';
import { useDebounce } from 'use-debounce';

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
	readonly spot?: {
		readonly lotName?: string;
	};
};

export function AvailabilitiesPage() {
	const { apiRequest } = useApiRequest();
	const { isLoading, setIsLoadingOnce, refreshTrigger, forceRefresh } =
		useLoading('availabilities');
	const [availabilities, setAvailabilities] = useState<Availabilities>();
	const [mySpot, setMySpot] = useState<MySpot>();

	useEffect(() => {
		setIsLoadingOnce(true);

		apiRequest<Availabilities>('/spots/availabilities', 'GET')
			.then(setAvailabilities)
			.finally(() => setIsLoadingOnce(false));
	}, [refreshTrigger]);

	useEffect(() => {
		apiRequest<MySpot>('/@me/spot', 'GET').then(setMySpot);
	}, []);

	const hasSpot = !!mySpot?.spot;
	const hasAvailabilities = availabilities && availabilities.availabilities.length > 0;

	return (
		<div className={'h-full flex flex-col gap-4'}>
			<Container
				title={'Je prête ma place'}
				description={
					!isLoading && !hasSpot ? (
						<InlineAlert className={'space-x-1'} icon={<TriangleAlert />}>
							<Link to={'/myspot'} className={'text-primary'}>
								Défini ton spot
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
						<AvailabilityCard
							key={i}
							from={new Date(availability.from)}
							to={new Date(availability.to)}
							duration={parseDuration(availability.duration)}
						/>
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
	const { apiRequest } = useApiRequest();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [simulatedLend, setSimulatedLend] = useState<MakeSpotAvailableResponse>();

	const [fromDebounce] = useDebounce(from, 200);
	const [toDebounce] = useDebounce(to, 200);

	useEffect(() => {
		if (!fromDebounce || !toDebounce) {
			return;
		}

		apiRequest<MakeSpotAvailableResponse, MakeSpotAvailableBody>(
			'/spots/availabilities?simulation=true',
			'POST',
			{
				from: fromDebounce.toISOString(),
				to: toDebounce.toISOString()
			}
		).then(setSimulatedLend);
	}, [fromDebounce, toDebounce]);

	const isValid = useMemo(() => from && to, [from, to]);

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
					<DateTimeRangePicker from={from} setFrom={setFrom} to={to} setTo={setTo} />

					{simulatedLend?.overlaps && (
						<InlineAlert icon={<TriangleAlert />} className={'h-8 text-sm'}>
							Tu prêtes déjà ta place pendant cette période
						</InlineAlert>
					)}
					<ActionButton
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
