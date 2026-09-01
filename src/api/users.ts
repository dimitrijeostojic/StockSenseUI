import { apiClient } from './client';
import type { UserDto, AdminRegisterUserRequest } from '../types';

export async function getUsers(): Promise<UserDto[]> {
  const { data } = await apiClient.get<{ items: UserDto[] }>('/api/user/GetAllUsers');
  return data.items;
}

export async function deleteUser(userPublicId: string): Promise<void> {
  await apiClient.delete(`/api/user/delete-user/${userPublicId}`);
}

export async function registerUser(req: AdminRegisterUserRequest): Promise<void> {
  await apiClient.post('/api/User/register-user', req);
}
