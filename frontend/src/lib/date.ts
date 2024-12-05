export function parseDuration(duration: string) {
	const [hours, minutes, seconds] = duration.split(':').map(Number);

	return {
		hours,
		minutes,
		seconds
	};
}

export function removeYear(formattedDate: string) {
	return formattedDate.replace(/(\.\s)?[0-9]{4}/g, '');
}
