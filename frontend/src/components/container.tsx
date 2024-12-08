import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Title } from '@/components/title.tsx';
import { Alert, AlertTitle } from '@/components/ui/alert.tsx';
import { TriangleAlert } from 'lucide-react';

export function Container(props: {
	children?: ReactNode;
	title?: ReactNode;
	className?: string;
	alert?: ReactNode;
}) {
	return (
		<div className={'grow flex flex-col gap-4 min-h-0'}>
			{props.title && <Title>{props.title}</Title>}
			{props.alert && (
				<Alert className={'border-destructive bg-destructive'}>
					<TriangleAlert />
					<AlertTitle className={'ml-2 mt-1'}>{props.alert}</AlertTitle>
				</Alert>
			)}
			{props.children && (
				<div
					className={cn(
						props.className,
						'rounded-lg bg-secondary p-2 overflow-y-scroll'
					)}>
					{props.children}
				</div>
			)}
		</div>
	);
}
