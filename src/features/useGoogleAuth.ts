import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? WEB_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? WEB_CLIENT_ID;

export type GoogleCredentialResult = {
  idToken: string | null;
  accessToken: string | null;
  clientId: string;
};

function platformClientId(): string {
  if (Platform.OS === 'ios') return IOS_CLIENT_ID;
  if (Platform.OS === 'android') return ANDROID_CLIENT_ID;
  return WEB_CLIENT_ID;
}

export function useGoogleAuth() {
  // El clientId dummy evita que expo-auth-session falle si aún no hay credenciales
  // configuradas; prompt() valida la configuración antes de abrir Google.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: platformClientId() || 'unconfigured',
    webClientId: WEB_CLIENT_ID || 'unconfigured',
    iosClientId: IOS_CLIENT_ID || 'unconfigured',
    androidClientId: ANDROID_CLIENT_ID || 'unconfigured',
  });

  const [result, setResult] = useState<GoogleCredentialResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken ?? null;
      const accessToken = response.authentication?.accessToken ?? response.params?.access_token ?? null;
      setResult({ idToken, accessToken, clientId: platformClientId() });
      setError('');
    } else if (response.type === 'error') {
      setError('Ocurrió un error al iniciar sesión con Google.');
    }
    // 'cancel' / 'dismiss' / 'locked' → sin acción
  }, [response]);

  async function prompt() {
    setError('');
    setResult(null);

    if (!platformClientId()) {
      setError('Configura el Client ID de Google (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) y recarga la app.');
      return;
    }
    if (!request) {
      setError('No fue posible preparar el inicio de sesión de Google.');
      return;
    }

    await promptAsync();
  }

  return { prompt, result, error, clear: () => setResult(null) };
}