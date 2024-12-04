export function parseDuration(duration: string) {
	const [hours, minutes, seconds] = duration.split(':').map(Number);

	return {
		hours,
		minutes,
		seconds
	};
}
