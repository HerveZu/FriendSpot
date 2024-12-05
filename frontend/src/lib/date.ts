export function parseDuration(duration: string) {
	const timeSpanRegex = /(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?/;
	const match = timeSpanRegex.exec(duration);

	if (!match) {
		throw new Error('Invalid TimeSpan format');
	}

	const [
		,
		// full match, unused
		days = '0',
		hours,
		minutes,
		seconds,
		fractionalSeconds = '0'
	] = match;

	return {
		days: parseInt(days, 10),
		hours: parseInt(hours, 10),
		minutes: parseInt(minutes, 10),
		seconds: parseInt(seconds, 10),
		milliseconds: Math.round(parseFloat(`0.${fractionalSeconds}`) * 1000)
	};
}

export function removeYear(formattedDate: string) {
	return formattedDate.replace(/(\.\s)?[0-9]{4}/g, '');
}
