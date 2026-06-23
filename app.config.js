const appJson = require('./app.json');

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const logoPath = './assets/images/al-quds-logo.png';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    icon: logoPath,
    splash: {
      ...appJson.expo.splash,
      image: logoPath,
    },
    android: {
      ...appJson.expo.android,
      adaptiveIcon: {
        ...appJson.expo.android.adaptiveIcon,
        foregroundImage: logoPath,
      },
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      ...appJson.expo.web,
      favicon: logoPath,
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
