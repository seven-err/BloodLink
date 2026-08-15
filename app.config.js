const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

module.exports = ({ config }) => {
  const plugins = (config.plugins ?? []).map((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;

    if (name !== '@react-native-google-signin/google-signin') {
      return plugin;
    }

    if (!iosUrlScheme) {
      return plugin;
    }

    return [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme,
      },
    ];
  });

  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.sevenerr.BloodLink',
    },
    plugins,
  };
};

