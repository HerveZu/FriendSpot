import { blerp, cn } from '@/lib/utils.ts';
import {
	createContext,
	HTMLProps,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import { Delay } from '@/components/delay.tsx';
import { useLocation } from 'react-router-dom';

export function Logo(props: { className?: string }) {
	return (
		<div className={cn(props.className, 'relative')}>
			<LogoCard
				style={{
					rotate: '-5deg',
					translate: '0%'
				}}
				className={'absolute h-full'}
				primary={false}
			/>
			<LogoCard
				style={{
					rotate: '15deg',
					translate: '3% 7%'
				}}
				className={'absolute translate-x-1/3 h-full'}
				primary={true}
			/>
		</div>
	);
}

type LoaderContext = {
	refreshTrigger: object;
	forceRefresh: () => void;
	isLoading: boolean;
	setIsLoading: (key: string, isLoading: boolean) => void;
};

const LoaderContext = createContext<LoaderContext>(null!);

export function useLoading(key: string) {
	const { setIsLoading, ...other } = useContext(LoaderContext);
	const [hasLoaded, setHasLoaded] = useState(false);
	const location = useLocation();

	const setIsLoadingBound = useCallback(
		(isLoading: boolean) => setIsLoading(key, isLoading),
		[setIsLoading]
	);

	const setIsLoadingOnce = useCallback(
		(isLoading: boolean) => {
			if (!isLoading) {
				setIsLoadingBound(false);
				return;
			}

			if (hasLoaded) {
				return;
			}

			setIsLoadingBound(isLoading);
			setHasLoaded(true);
		},
		[hasLoaded, setHasLoaded, setIsLoadingBound]
	);

	// clear hasLoaded on page change
	useEffect(() => {
		setHasLoaded(false);
	}, [location.pathname, setHasLoaded]);

	// clear loading state
	useEffect(() => {
		return () => setIsLoading(key, false);
	}, []);

	return { setIsLoading: setIsLoadingBound, setIsLoadingOnce, ...other };
}

export function LoaderProvider(props: { className?: string; children: ReactNode }) {
	const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
	const [refreshTrigger, setRefreshTrigger] = useState({});
	const isLoading = loadingRequests.size > 0;

	const setIsLoading = useCallback(
		(key: string, isLoading: boolean) => {
			setLoadingRequests((requests) => {
				if (isLoading) {
					return requests.add(key);
				}

				const newRequests = new Set(requests);
				newRequests.delete(key);

				return newRequests;
			});
		},
		[setLoadingRequests]
	);

	const forceRefresh = useCallback(() => setRefreshTrigger({}), [setRefreshTrigger]);

	return (
		<LoaderContext.Provider value={{ isLoading, setIsLoading, refreshTrigger, forceRefresh }}>
			<Delay delay={150}>
				{isLoading && (
					<div
						className={cn(
							props.className,
							'z-50 w-full h-full absolute left-0 top-0 backdrop-blur-xl'
						)}>
						<div
							className={
								'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 '
							}>
							<LogoLoader className={'w-12 h-12'} loop={700} pause={800} />
						</div>
					</div>
				)}
			</Delay>
			{props.children}
		</LoaderContext.Provider>
	);
}

function LogoLoader(props: { className?: string; loop: number; pause: number }) {
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
				className={'absolute transition-transform h-12'}
				primary={false}
			/>
			<LogoCard
				style={{
					rotate: `${blerp(15, 30, time())}deg`,
					translate: `${blerp(10, 20, time())}px ${blerp(5, 10, time())}px`
				}}
				className={'absolute transition-transform h-12'}
				primary={true}
			/>
		</div>
	);
}

export type LogoCardProps = {
	primary: boolean;
} & HTMLProps<HTMLDivElement>;

export function LogoCard({ primary, className, ...props }: LogoCardProps) {
	return (
		<div
			className={cn(
				'aspect-[4/5] rounded-[20%] border-transparent p-[2px] bg-primary shadow-sm',
				className
			)}
			{...props}>
			<div
				className={cn(
					'rounded-[20%] h-full w-full bg-primary',
					!primary && 'brightness-75 bg-gradient-to-br from-primary to-70% to-secondary'
				)}
			/>
		</div>
	);
}
