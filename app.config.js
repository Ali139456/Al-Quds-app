const appJson = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const appIconPath = './assets/images/al-quds-app-icon.png';
const faviconPath = './assets/images/al-quds-icon.png';
const splashPath = './assets/images/al-quds-logo-light.png';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    icon: appIconPath,
    splash: {
      ...appJson.expo.splash,
      image: splashPath,
    },
    android: {
      ...appJson.expo.android,
      adaptiveIcon: {
        ...appJson.expo.android.adaptiveIcon,
        foregroundImage: appIconPath,
      },
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      ...appJson.expo.web,
      favicon: faviconPath,
    },
    ios: {
      ...appJson.expo.ios,
      ...(googleMapsApiKey
        ? {
            config: {
              googleMapsApiKey,
            },
          }
        : {}),
    },
    plugins: [
      ...(appJson.expo.plugins || []),
    ],
  },
};
