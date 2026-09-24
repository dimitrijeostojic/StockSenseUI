import { apiClient } from './client';

export interface TenantDto {
  publicId: string;
  name: string;
  pib: string;
  address?: string;
  logo?: string; // base64
  hasSeenOnboarding: boolean;
}

export interface UpdateTenantBody {
  name: string;
  address?: string;
  logo?: File | null;
}

export async function getMyTenant(): Promise<TenantDto> {
  const { data } = await apiClient.get<TenantDto>('/api/tenant');
  return data;
}

export async function updateTenant(body: UpdateTenantBody): Promise<TenantDto> {
  const form = new FormData();
  form.append('name', body.name);
  if (body.address) form.append('address', body.address);
  if (body.logo) form.append('logo', body.logo);
  const { data } = await apiClient.put<TenantDto>('/api/tenant', form);
  return data;
}

export async function completeOnboarding(): Promise<void> {
  await apiClient.post('/api/tenant/complete-onboarding');
}
