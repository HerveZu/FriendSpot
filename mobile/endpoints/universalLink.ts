const config = {
  appDomain: process.env.EXPO_PUBLIC_APP_DOMAIN,
};

export function universalLink(target: string) {
  return `https://${config.appDomain}/_open/${target}`;
}
