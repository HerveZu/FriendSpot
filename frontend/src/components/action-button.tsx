import { Button, ButtonProps } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { forwardRef } from 'react';

export const ActionButton = forwardRef<
	HTMLButtonElement,
	ButtonProps & { info?: string; large?: boolean }
>(({ large, ...props }, ref) => {
	return (
		<div className={'flex flex-col gap-2'}>
			{props.info && <span className={'text-xs text-primary mt-2'}>{props.info}</span>}
			<Button
				ref={ref}
				size={'lg'}
				className={cn(large && 'h-14', props.className)}
				{...props}
			/>
		</div>
	);
});

ActionButton.displayName = 'ActionButton';
