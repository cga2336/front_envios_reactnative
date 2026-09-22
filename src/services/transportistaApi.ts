import { API_BASE_URL } from './api';
import { CompleteProfilePayload, RegisterTransportistaPayload, TransportistaProfile, TransportistaSession } from '../types';

type RegisterTransportistaResponse = {
  message: string;
  transportista: TransportistaProfile;
};

type LoginTransportistaResponse = {
  message: string;
  token: string;
  transportista: TransportistaProfile;
};

export async function registerTransportista(payload: RegisterTransportistaPayload): Promise<RegisterTransportistaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transportistas/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible registrar el transportista.');
  }

  return data as RegisterTransportistaResponse;
}

export async function loginTransportista(email: string, password: string): Promise<TransportistaSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transportistas/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible iniciar sesión.');
  }

  return {
    token: (data as LoginTransportistaResponse).token,
    transportista: (data as LoginTransportistaResponse).transportista,
  };
}

type UpdateTransportistaPerfilResponse = {
  message: string;
  transportista: TransportistaProfile;
};

export async function updateTransportistaPerfil(
  id: string,
  payload: CompleteProfilePayload,
  token: string,
): Promise<TransportistaProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transportistas/${id}/perfil`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible actualizar tu perfil.');
  }

  return (data as UpdateTransportistaPerfilResponse).transportista;
}