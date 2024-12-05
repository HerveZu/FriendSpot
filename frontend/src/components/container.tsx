import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export function Container(props: { children: ReactNode; title?: string; className?: string }) {
	return (
		<div className={'grow flex flex-col gap-4 min-h-0'}>
			{props.title && <h1 className={'text-2xl font-semibold'}>{props.title}</h1>}
			<div className={cn(props.className, 'rounded-lg bg-secondary p-2 overflow-y-scroll')}>
				{props.children}
			</div>
		</div>
	);
}
