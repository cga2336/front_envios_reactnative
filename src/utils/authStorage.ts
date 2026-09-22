import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TransportistaSession, UsuarioSession } from '../types';

const STORAGE_KEY = 'transportista_session';
const USUARIO_STORAGE_KEY = 'usuario_session';

export async function loadTransportistaSession(): Promise<TransportistaSession | null> {
  try {
    const raw =
      Platform.OS === 'web' ? window.localStorage.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TransportistaSession;
    if (!parsed.token || !parsed.transportista) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveTransportistaSession(session: TransportistaSession) {
  const payload = JSON.stringify(session);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(STORAGE_KEY, payload);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

export async function clearTransportistaSession() {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function loadUsuarioSession(): Promise<UsuarioSession | null> {
  try {
    const raw =
      Platform.OS === 'web' ? window.localStorage.getItem(USUARIO_STORAGE_KEY) : await AsyncStorage.getItem(USUARIO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsuarioSession;
    if (!parsed.token || !parsed.usuario) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveUsuarioSession(session: UsuarioSession) {
  const payload = JSON.stringify(session);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(USUARIO_STORAGE_KEY, payload);
    return;
  }
  await AsyncStorage.setItem(USUARIO_STORAGE_KEY, payload);
}

export async function clearUsuarioSession() {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(USUARIO_STORAGE_KEY);
    return;
  }
  await AsyncStorage.removeItem(USUARIO_STORAGE_KEY);
}