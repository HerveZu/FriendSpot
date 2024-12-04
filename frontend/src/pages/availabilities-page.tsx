import { Container } from '@/components/container.tsx';
import { useApiRequest } from '@/lib/hooks/use-api-request.ts';
import { useContext, useEffect, useState } from 'react';
import { LoaderContext } from '@/components/logo.tsx';
import { Card, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { ArrowRight, Clock } from 'lucide-react';
import { format, formatDuration, formatRelative, isToday, isTomorrow } from 'date-fns';
import { Badge } from '@/components/ui/badge.tsx';
import { ActionButton } from '@/components/action-button.tsx';
import { parseDuration } from '@/lib/date.ts';

type Availabilities = {
	readonly totalDuration: string;
	readonly availabilities: Availability[];
};

type Availability = {
	readonly from: string;
	readonly to: string;
	readonly duration: string;
};

export function AvailabilitiesPage() {
	const { apiRequest } = useApiRequest();
	const { setIsLoading } = useContext(LoaderContext);
	const [availabilities, setAvailabilities] = useState<Availabilities>();

	useEffect(() => {
		setIsLoading(true);

		apiRequest<Availabilities>('/spots/availabilities', 'GET')
			.then(setAvailabilities)
			.finally(() => setIsLoading(false));
	}, []);

	return (
		availabilities && (
			<div className={'h-full flex flex-col gap-4'}>
				<Container className={'flex flex-col gap-2'} title={'Mes réservations'}>
					{availabilities?.availabilities.map((availability, i) => (
						<AvailabilityCard key={i} availability={availability} />
					))}
				</Container>
				<ActionButton
					info={`Vous prêtez votre place un total de ${formatDuration(parseDuration(availabilities.totalDuration))}`}>
					Je prête ma place
				</ActionButton>
			</div>
		)
	);
}

function AvailabilityCard(props: { availability: Availability }) {
	const from = new Date(props.availability.from);
	const to = new Date(props.availability.to);
	const now = new Date();

	return (
		<Card className={'p-4'}>
			<CardTitle className={'flex text-lg items-center justify-between capitalize'}>
				{formatRelative(from, now)}
				{isToday(from) && <Badge>Aujourd&apos;hui</Badge>}
				{isTomorrow(from) && <Badge>Demain</Badge>}
			</CardTitle>
			<CardDescription className={'flex flex-col gap-4'}>
				<div className={'flex gap-2 items-center text-primary'}>
					<Clock size={18} />
					{formatDuration(parseDuration(props.availability.duration))}
				</div>
				<div className={'flex gap-2 items-center'}>
					<span>{format(from, 'PP HH:mm')}</span>
					<ArrowRight size={16} />
					<span>{format(to, 'PP HH:mm')}</span>
				</div>
			</CardDescription>
		</Card>
	);
}
