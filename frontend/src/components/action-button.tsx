import { Button, ButtonProps } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';

export function ActionButton(props: ButtonProps & { info?: string }) {
	return (
		<div className={'flex flex-col gap-2'}>
			{props.info && <span className={'text-xs text-primary mt-2'}>{props.info}</span>}
			<Button {...props} size={'lg'} className={cn(props.className, 'h-14')} />
		</div>
	);
}
