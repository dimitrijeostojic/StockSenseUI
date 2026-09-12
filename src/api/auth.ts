import { apiClient } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', req);
  return data;
}

export async function register(req: RegisterRequest): Promise<void> {
  const form = new FormData();
  form.append('firstName', req.firstName);
  form.append('lastName', req.lastName);
  form.append('username', req.username);
  form.append('email', req.email);
  form.append('password', req.password);
  form.append('companyName', req.companyName);
  form.append('pib', req.pib);
  if (req.address) form.append('address', req.address);
  if (req.logo) form.append('logo', req.logo);
  await apiClient.post('/api/auth/register', form);
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken });
}

export async function registerUser(req: { firstName: string; lastName: string; username: string; email: string; password: string }): Promise<void> {
  await apiClient.post('/api/auth/register-user', req);
}

export async function changePassword(req: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Promise<void> {
  await apiClient.put('/api/auth/change-password', req);
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/api/auth/forgot-password', { email });
}

export async function resetPassword(req: { email: string; token: string; newPassword: string; confirmNewPassword: string }): Promise<void> {
  await apiClient.post('/api/auth/reset-password', req);
}
