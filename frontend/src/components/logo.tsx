import { blerp, cn } from '@/lib/utils.ts';
import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';

export function Logo(props: {className?: string}) {
	return (
		<div className={cn(props.className, 'relative')}>
			<LogoCard
				style={{
					rotate: '-5deg'
				}}
				className={'absolute '}
				background={false}
			/>
			<LogoCard
				style={{
					rotate: '15deg',
					translate: '3% 5%'
				}}
				className={'absolute translate-x-1/3'}
				background={true}
			/>
		</div>
	);
}

export function LogoLoader(props: { loop: number, pause: number }) {
	const ticksPerSecond = useMemo(() => 60, []);
	const [, setInternalTicks] = useState(0);
	const [ticks, setTicks] = useState(0);

	const time = useCallback(
		() => {
			return ticks / ticksPerSecond / (props.loop / 1000);
		},
		[props.loop, ticks, ticksPerSecond]
	);

	useEffect(() => {
		const handler = setInterval(() => {
			setInternalTicks((internalTicks) => {
				const elapsedMs = internalTicks / ticksPerSecond * 1000
				const totalDurationMs = props.pause + props.loop

				if (elapsedMs % totalDurationMs > props.loop){
					setTicks(0)
				}
				else {
					setTicks(ticks => ticks + 1);
				}

				return internalTicks + 1;
			});
		}, 1000 / ticksPerSecond);

		return () => clearInterval(handler);
	}, [setInternalTicks, setTicks, ticksPerSecond, props.pause, props.loop]);

	return (
		<div className={'w-12 h-12 relative'}>
			<LogoCard
				style={{
					rotate: `-${blerp(5, 15, time())}deg`,
					translate: `-${blerp(0, 10, time())}px`
				}}
				className={'absolute transition-transform'}
				background={false}
			/>
			<LogoCard
				style={{
					rotate: `${blerp(15, 30, time())}deg`,
					translate: `${blerp(10, 20, time())}px ${blerp(5, 10, time())}px`
				}}
				className={'absolute transition-transform'}
				background={true}
			/>
		</div>
	);
}

function LogoCard(props: { className?: string; style?: CSSProperties; background: boolean }) {
	return (
		<div
			style={props.style}
			className={cn(
				props.className,
				'shadow-primary w-full aspect-[4/5] rounded-[20%] border-transparent p-[5%] bg-primary'
			)}>
			{!props.background && <div className={'bg-background rounded-[20%] h-full w-full'} />}
		</div>
	);
}
