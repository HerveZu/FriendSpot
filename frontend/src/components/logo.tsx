import { blerp, cn } from '@/lib/utils.ts';
import {
	createContext,
	CSSProperties,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';

export function Logo(props: { className?: string }) {
	return (
		<div className={cn(props.className, 'relative')}>
			<LogoCard
				style={{
					rotate: '-5deg'
				}}
				className={'absolute '}
				full={false}
			/>
			<LogoCard
				style={{
					rotate: '15deg',
					translate: '3% 5%'
				}}
				className={'absolute translate-x-1/3'}
				full={true}
			/>
		</div>
	);
}

type LoaderContext = {
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
};

export const LoaderContext = createContext<LoaderContext>(null!);

export function LoaderProvider(props: { className?: string, children: ReactNode }) {
	const [isLoading, setIsLoading] = useState(false);

	return (
		<LoaderContext.Provider value={{ isLoading, setIsLoading }}>
			{isLoading && (
				<div className={cn(props.className, 'z-50 w-full h-full absolute left-0 top-0 backdrop-blur-sm')}>
					<div className={'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 '}>
						<LogoLoader className={'w-12 h-12'} loop={700} pause={800} />
					</div>
				</div>
			)}
			{props.children}
		</LoaderContext.Provider>
	);
}

function LogoLoader(props: { className?: string, loop: number; pause: number }) {
	const ticksPerSecond = useMemo(() => 60, []);
	const [, setInternalTicks] = useState(0);
	const [ticks, setTicks] = useState(0);

	const time = useCallback(() => {
		return ticks / ticksPerSecond / (props.loop / 1000);
	}, [props.loop, ticks, ticksPerSecond]);

	useEffect(() => {
		const handler = setInterval(() => {
			setInternalTicks((internalTicks) => {
				const elapsedMs = (internalTicks / ticksPerSecond) * 1000;
				const totalDurationMs = props.pause + props.loop;

				if (elapsedMs % totalDurationMs > props.loop) {
					setTicks(0);
				} else {
					setTicks((ticks) => ticks + 1);
				}

				return internalTicks + 1;
			});
		}, 1000 / ticksPerSecond);

		return () => clearInterval(handler);
	}, [setInternalTicks, setTicks, ticksPerSecond, props.pause, props.loop]);

	return (
		<div className={cn(props.className, 'relative')}>
			<LogoCard
				style={{
					rotate: `-${blerp(5, 15, time())}deg`,
					translate: `-${blerp(0, 10, time())}px`
				}}
				className={'absolute transition-transform'}
				full={false}
			/>
			<LogoCard
				style={{
					rotate: `${blerp(15, 30, time())}deg`,
					translate: `${blerp(10, 20, time())}px ${blerp(5, 10, time())}px`
				}}
				className={'absolute transition-transform'}
				full={true}
			/>
		</div>
	);
}

function LogoCard(props: { className?: string; style?: CSSProperties; full: boolean }) {
	return (
		<div
			style={props.style}
			className={cn(
				props.className,
				'w-full aspect-[4/5] rounded-[20%] border-transparent p-[5%] bg-primary shadow-sm',
				!props.full && 'brightness-75',
				props.full && 'bg-gradient-to-br from-primary to-secondary'
			)}>
			{!props.full && <div className={'bg-secondary rounded-[20%] h-full w-full'} />}
		</div>
	);
}
