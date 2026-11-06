// Keep the existing web configuration; enable iOS Google Sign-In when configured.
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const bundleIdentifier = process.env.REON_IOS_BUNDLE_IDENTIFIER;
  const plugins = [...(config.plugins ?? [])];
  plugins.push(['expo-build-properties', { ios: { enableSceneSupport: true } }]);
  if (iosClientId) {
    if (!/^[A-Za-z0-9-]+\.apps\.googleusercontent\.com$/.test(iosClientId)) {
      throw new Error('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID에 iOS OAuth 클라이언트 ID를 입력해주세요.');
    }
    plugins.push(['@react-native-google-signin/google-signin', {
      iosUrlScheme: iosClientId.split('.').reverse().join('.'),
    }]);
  }
  return {
    ...config,
    ios: {
      ...config.ios,
      ...(bundleIdentifier ? { bundleIdentifier } : {}),
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocalNetworkUsageDescription: '개발 중 같은 Wi-Fi의 Re:on 서버에 연결합니다.',
      },
    },
    plugins,
  };
};
