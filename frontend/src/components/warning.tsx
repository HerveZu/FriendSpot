import { TriangleAlert } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert.tsx';
import { ReactNode } from 'react';

export function Warning(props: { children: ReactNode }) {
	return (
		<Alert className={'border-destructive bg-destructive'}>
			<TriangleAlert />
			<AlertTitle className={'ml-2 mt-1'}>{props.children}</AlertTitle>
		</Alert>
	);
}
