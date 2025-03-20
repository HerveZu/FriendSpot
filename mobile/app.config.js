const APP_VARIANT = process.env.APP_VARIANT;

const getUniqueIdentifier = () => {
  const id = 'friendspot';

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
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});
