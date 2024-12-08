import * as React from 'react';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { format } from 'date-fns';

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

export function DateTimePicker24h(props: {
	dateFormat: string;
	removeYear?: boolean;
	date?: Date;
	setDate: Dispatch<SetStateAction<Date | undefined>>;
	className?: string;
}) {
	const [isOpen, setIsOpen] = React.useState(false);

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			props.setDate(selectedDate);
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
			props.setDate(newDate);
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
				<div className="sm:flex">
					<Calendar
						mode="single"
						selected={props.date}
						onSelect={handleDateSelect}
						initialFocus
					/>
					<Separator />
					<div className="flex flex-col sm:flex-row sm:h-[300px]">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{hours.reverse().map((hour) => (
									<Button
										key={hour}
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
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
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
