import { Platform } from 'react-native';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;

function defaultBaseUrl() {
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_BASE_URL = defaultBaseUrl();
