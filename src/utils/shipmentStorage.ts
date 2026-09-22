import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Shipment } from '../types';

const STORAGE_KEY = 'shipments';

export async function loadShipments(): Promise<Shipment[]> {
  try {
    const raw =
      Platform.OS === 'web' ? window.localStorage.getItem(STORAGE_KEY) : await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Shipment[];
  } catch {
    return [];
  }
}

export async function saveShipments(shipments: Shipment[]) {
  const payload = JSON.stringify(shipments);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(STORAGE_KEY, payload);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}

export function createTrackingNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ENV-${y}${m}${d}-${rand}`;
}
