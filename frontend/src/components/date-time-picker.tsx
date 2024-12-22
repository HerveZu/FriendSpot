import * as React from 'react';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import {
	addHours,
	addMinutes,
	differenceInHours,
	format,
	formatDuration,
	intervalToDuration,
	isSameDay,
	isSameHour
} from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { removeYear } from '@/lib/date.ts';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { ArrowRight, Clock } from 'lucide-react';
import { Slider } from '@/components/ui/slider.tsx';

export function DateTimeRangePicker(props: {
	className?: string;
	from: Date | undefined;
	setFrom: Dispatch<SetStateAction<Date | undefined>>;
	to: Date | undefined;
	setTo: Dispatch<SetStateAction<Date | undefined>>;
}) {
	const MAX_HOURS = 24 * 3;
	const INITIAL_DURATION_HOURS = 2;

	const [durationPercent, setDurationPercent] = useState(INITIAL_DURATION_HOURS / MAX_HOURS);
	const now = new Date();

	const everySecond = now.getTime() % 1000;

	const updateDurationPercent = useCallback((from: Date, to: Date) => {
		setDurationPercent(differenceInHours(to, from) / MAX_HOURS);
	}, []);

	const updatePeriodDate = useCallback(
		(durationPercent: number) => {
			props.setTo(props.from && addHours(props.from, durationPercent * MAX_HOURS));
		},
		[props.from]
	);

	useEffect(() => {
		updatePeriodDate(durationPercent);
	}, [props.from]);

	useEffect(() => {
		if (!props.from || props.from <= now) {
			props.setFrom(addMinutes(now, 15));
		}

		if (props.to && props.to < now) {
			props.setTo(addMinutes(now, 15));
		}
	}, [everySecond]);

	useEffect(() => {
		if (props.from && props.to && props.from.getTime() >= props.to.getTime()) {
			props.setTo(addMinutes(props.from, 15));
		}
	}, [props.from, props.to]);

	return (
		<div className={cn('flex flex-col gap-4', props.className)}>
			<div className={cn('flex gap-4 items-center justify-between')}>
				<DateTimePicker24h
					date={props.from}
					fromDate={now}
					onDateChange={(from) => {
						props.setFrom(from);

						if (from && props.to) {
							updateDurationPercent(from, props.to);
						}
					}}
					dateFormat="PPp"
					removeYear
				/>
				<ArrowRight size={16} className="shrink-0" />
				<DateTimePicker24h
					date={props.to}
					fromDate={props.from ?? now}
					onDateChange={(to) => {
						props.setTo(to);

						if (props.from && to) {
							updateDurationPercent(props.from, to);
						}
					}}
					dateFormat="PPp"
					removeYear
				/>
			</div>
			{props.from && props.to && (
				<div className="flex items-center gap-2 text-sm">
					<Clock size={16} />
					{formatDuration(intervalToDuration({ start: props.from, end: props.to }), {
						format: ['days', 'hours', 'minutes']
					})}
				</div>
			)}
			<Slider
				defaultValue={[100]}
				value={[durationPercent * 100]}
				onValueChange={(values) => {
					const durationPercent = values[0] / 100;

					setDurationPercent(durationPercent);
					updatePeriodDate(durationPercent);
				}}
			/>
		</div>
	);
}

export function DateTimePicker24h(props: {
	dateFormat: string;
	removeYear?: boolean;
	date: Date | undefined;
	fromDate: Date | undefined;
	onDateChange: (date: Date) => void;
	className?: string;
}) {
	const [isOpen, setIsOpen] = React.useState(false);

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

	const isHourDisabled = (hour: number): boolean => {
		return (
			!!props.date &&
			!!props.fromDate &&
			isSameDay(props.fromDate, props.date) &&
			props.fromDate.getHours() > hour
		);
	};

	const isMinuteDisabled = (minute: number): boolean => {
		return (
			!!props.date &&
			!!props.fromDate &&
			isSameHour(props.fromDate, props.date) &&
			props.fromDate.getMinutes() > minute
		);
	};

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			props.onDateChange(selectedDate);
		}
	};

	const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
		if (props.date) {
			const newDate = new Date(props.date);
			if (type === 'hour') {
				newDate.setHours(parseInt(value));
			} else if (type === 'minute') {
				newDate.setMinutes(parseInt(value));
			}
			props.onDateChange(newDate);
		}
	};

	const formattedDate = useMemo(() => {
		if (!props.date) {
			return;
		}

		let formattedDate = format(props.date, props.dateFormat);

		if (props.removeYear) {
			formattedDate = removeYear(formattedDate);
		}

		return formattedDate;
	}, [props.date]);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'w-full justify-start text-left font-normal',
						!props.date && 'text-muted-foreground',
						props.className
					)}>
					{formattedDate}
				</Button>
			</DialogTrigger>
			<DialogContent className="w-auto p-0 [&>button]:hidden gap-0">
				<DialogTitle />
				<DialogDescription />
				<div>
					<Calendar
						mode="single"
						selected={props.date}
						onSelect={handleDateSelect}
						fromDate={props.fromDate}
						initialFocus
					/>
					<Separator />
					<div className="flex flex-col p-6 gap-2">
						<span className={'flex gap-2 items-center'}>
							<Clock size={18} /> Heure
						</span>
						<ScrollArea className="w-60 overflow-hidden">
							<div className="flex sm:flex-col">
								{hours.map((hour) => (
									<Button
										key={hour}
										disabled={isHourDisabled(hour)}
										size="icon"
										variant={
											props.date && props.date.getHours() === hour
												? 'default'
												: 'ghost'
										}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() => handleTimeChange('hour', hour.toString())}>
										{hour}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="w-60">
							<div className="flex sm:flex-col">
								{minutes.map((minute) => (
									<Button
										key={minute}
										disabled={isMinuteDisabled(minute)}
										size="icon"
										variant={
											props.date && props.date.getMinutes() === minute
												? 'default'
												: 'ghost'
										}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() =>
											handleTimeChange('minute', minute.toString())
										}>
										{minute.toString().padStart(2, '0')}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
