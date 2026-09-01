import { apiClient } from './client';
import type { CategoryDto } from '../types';

export async function getCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<{ items: CategoryDto[]; totalCount: number }>('/api/category');
  return data.items;
}

export async function createCategory(body: { name: string; description?: string }): Promise<void> {
  await apiClient.post('/api/category', body);
}

export async function updateCategory(publicId: string, body: { name: string; description?: string }): Promise<void> {
  await apiClient.put(`/api/category/${publicId}`, body);
}

export async function deleteCategory(publicId: string): Promise<void> {
  await apiClient.delete(`/api/category/${publicId}`);
}
