import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'Cove',
  slug: 'cove',
  scheme: 'cove',
  version: '0.1.0',
  platforms: ['ios', 'android'],
  orientation: 'default',
  userInterfaceStyle: 'light',
  ios: { bundleIdentifier: 'app.cove.music', supportsTablet: true },
  android: {
    package: 'app.cove.music',
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    'expo-dev-client',
    'expo-asset',
    'expo-secure-store',
    [
      'expo-audio',
      {
        enableBackgroundPlayback: true,
        enableBackgroundRecording: false,
        recordAudioAndroid: false,
        microphonePermission: false,
      },
    ],
  ],
};
export default config;
