import { ReactNode } from 'react';

export function Title(props: { children: ReactNode }) {
	return <h1 className={'text-2xl font-semibold'}>{props.children}</h1>;
}
