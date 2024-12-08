import { ReactNode, useEffect, useState } from 'react';

export function Delay(props: { delay: number; children: ReactNode }) {
	const [display, setDisplay] = useState(false);

	useEffect(() => {
		const handler = setTimeout(() => setDisplay(true), props.delay);

		return () => clearTimeout(handler);
	}, [props.delay]);

	return display && props.children;
}
