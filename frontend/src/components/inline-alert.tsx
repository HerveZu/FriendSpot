import { Alert, AlertTitle } from '@/components/ui/alert.tsx';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export function InlineAlert(props: { children: ReactNode; icon: ReactNode; className?: string }) {
	return (
		<Alert className={'flex items-center gap-4'}>
			<div>{props.icon}</div>
			<AlertTitle className={cn(props.className)}>{props.children}</AlertTitle>
		</Alert>
	);
}
