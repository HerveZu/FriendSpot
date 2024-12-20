import { Card, CardDescription, CardTitle } from '@/components/ui/card.tsx';
import { Duration, format, formatDuration, formatRelative, isToday, isTomorrow } from 'date-fns';
import { Badge } from '@/components/ui/badge.tsx';
import { ArrowRight, Clock } from 'lucide-react';
import { ReactNode } from 'react';

export function AvailabilityCard({
	from,
	to,
	duration,
	...props
}: {
	from: Date;
	to: Date;
	duration: Duration;
	nowInfo?: ReactNode;
}) {
	const now = new Date();
	const isCurrent = from.getTime() <= now.getTime() && to.getTime() > now.getTime();

	return (
		<Card className={'p-4'}>
			<CardTitle className={'flex text-lg items-center justify-between capitalize'}>
				{formatRelative(from, now)}
				{!isCurrent && isToday(from) && <Badge>Aujourd&apos;hui</Badge>}
				{isTomorrow(from) && <Badge>Demain</Badge>}
				{isCurrent && <Badge>{props.nowInfo ?? 'Maintenant'}</Badge>}
			</CardTitle>
			<CardDescription className={'flex flex-col gap-4'}>
				<div className={'flex gap-2 items-center text-primary'}>
					<Clock size={18} />
					{formatDuration(duration, {
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
