import { Button, ButtonProps } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { forwardRef, ReactNode } from 'react';

export const ActionButton = forwardRef<
	HTMLButtonElement,
	ButtonProps & { info?: ReactNode; large?: boolean }
>(({ large, className, ...props }, ref) => {
	return (
		<div className={'flex flex-col gap-2 text-center'}>
			{props.info && <span className={'text-sm text-primary'}>{props.info}</span>}
			<Button ref={ref} size={'lg'} className={cn(large && 'h-14', className)} {...props} />
		</div>
	);
});

ActionButton.displayName = 'ActionButton';
