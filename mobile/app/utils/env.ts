// see https://docs.expo.dev/guides/environment-variables/
export const env = {
	auth0: {
		domain: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
		clientId: process.env.EXPO_PUBLIC_AUTH0_DOMAIN
	},
	api_url: process.env.EXPO_PUBLIC_API_URL
};
