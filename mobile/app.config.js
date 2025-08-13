const APP_VARIANT = process.env.APP_VARIANT;
const backendDomain = process.env.EXPO_PUBLIC_BACKEND_API_URL.replace(
  /^https?:\/\/([^:\/]+)[:\/]?/,
  ''
);

const getUniqueIdentifier = () => {
  const id = 'com.friendspot';

  if (APP_VARIANT) {
    return `${id}.${APP_VARIANT.toLowerCase()}`;
  }

  return id;
};

const getAppName = () => {
  if (APP_VARIANT) {
    return `FriendSpot (${APP_VARIANT})`;
  }

  return 'FriendSpot';
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
    associatedDomains: [`applinks:${backendDomain}`],
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
    intentFilters: [
      {
        action: 'VIEW',
        data: [
          {
            scheme: 'https',
            host: backendDomain,
            pathPrefix: '/_open',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
});
