import { API_BASE_URL } from './api';
import { TransportistaProfile, UsuarioProfile } from '../types';

export type GoogleAuthRole = 'usuario' | 'transportista';

export type GoogleAuthInput = {
  role: GoogleAuthRole;
  idToken?: string | null;
  accessToken?: string | null;
  clientId?: string;
};

export type GoogleDatos = {
  sub: string;
  email: string;
  nombre: string;
  apellido: string;
};

export type GoogleAuthResponse = {
  message: string;
  token?: string;
  usuario?: UsuarioProfile;
  transportista?: TransportistaProfile;
  vinculado?: boolean;
  vehiculoRegistrado?: boolean;
  googleDatos?: GoogleDatos;
};

export async function googleAuthSession(input: GoogleAuthInput): Promise<GoogleAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: input.role,
      idToken: input.idToken ?? undefined,
      accessToken: input.accessToken ?? undefined,
      clientId: input.clientId ?? undefined,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible iniciar sesión con Google.');
  }

  return data as GoogleAuthResponse;
}