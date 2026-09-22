import { API_BASE_URL } from './api';
import { RegisterUsuarioPayload, UsuarioProfile, UsuarioSession } from '../types';

type RegisterUsuarioResponse = {
  message: string;
  usuario: UsuarioProfile;
};

type LoginUsuarioResponse = {
  message: string;
  token: string;
  usuario: UsuarioProfile;
};

export async function registerUsuario(payload: RegisterUsuarioPayload): Promise<RegisterUsuarioResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/usuarios/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible registrar el usuario.');
  }

  return data as RegisterUsuarioResponse;
}

export async function loginUsuario(email: string, password: string): Promise<UsuarioSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/usuarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible iniciar sesión.');
  }

  return {
    token: (data as LoginUsuarioResponse).token,
    usuario: (data as LoginUsuarioResponse).usuario,
  };
}