import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Title } from '@/components/title.tsx';

export function Container(props: {
	children?: ReactNode;
	title?: ReactNode;
	className?: string;
	description?: ReactNode;
	shrink?: boolean;
}) {
	return (
		<div className={cn('flex flex-col gap-4 min-h-0', !props.shrink && 'grow')}>
			{props.title && <Title>{props.title}</Title>}
			{props.description}
			{props.children && (
				<div
					className={cn(
						'rounded-lg bg-secondary p-2 overflow-y-scroll',
						props.className
					)}>
					{props.children}
				</div>
			)}
		</div>
	);
}
