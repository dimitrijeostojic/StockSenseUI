import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', req);
  return data;
}

export async function register(req: RegisterRequest): Promise<void> {
  await apiClient.post('/api/auth/register', req);
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken });
}

export async function registerUser(req: { firstName: string; lastName: string; username: string; email: string; password: string }): Promise<void> {
  await apiClient.post('/api/auth/register-user', req);
}
