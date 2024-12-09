/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE__AUTH0__DOMAIN: string;
	readonly VITE__AUTH0__CALLBACK__PATH: string;
	readonly VITE__AUTH0__CLIENT__ID: string;
	readonly VITE__API__BASE__URL: string;
	readonly VITE__DISCORD__REVIEW_WEBHOOK_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
