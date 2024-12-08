import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Title } from '@/components/title.tsx';

export function Container(props: { children: ReactNode; title?: string; className?: string }) {
	return (
		<div className={'grow flex flex-col gap-4 min-h-0'}>
			{props.title && <Title>{props.title}</Title>}
			<div className={cn(props.className, 'rounded-lg bg-secondary p-2 overflow-y-scroll')}>
				{props.children}
			</div>
		</div>
	);
}
