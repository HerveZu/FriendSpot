import { Alert, AlertTitle } from '@/components/ui/alert.tsx';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export function InlineAlert(props: { children: ReactNode; icon: ReactNode; className?: string }) {
	return (
		<Alert className={'border-warning bg-warning'}>
			{props.icon}
			<AlertTitle className={cn('ml-2 mt-1', props.className)}>{props.children}</AlertTitle>
		</Alert>
	);
}
