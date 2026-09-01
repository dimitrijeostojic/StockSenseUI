import { apiClient } from './client';
import type { SupplierDto, PagedResponse } from '../types';

export async function getSuppliers(params: { pageNumber?: number; pageSize?: number; searchTerm?: string; sortBy?: string; isAscending?: boolean } = {}): Promise<PagedResponse<SupplierDto>> {
  const { data } = await apiClient.get<PagedResponse<SupplierDto>>('/api/supplier', { params: { pageNumber: 1, pageSize: 1000, isAscending: true, ...params } });
  return data;
}

export interface SupplierBody {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function createSupplier(body: SupplierBody): Promise<void> {
  await apiClient.post('/api/supplier', body);
}

export async function updateSupplier(publicId: string, body: SupplierBody): Promise<void> {
  await apiClient.put(`/api/supplier/${publicId}`, body);
}

export async function deleteSupplier(publicId: string): Promise<void> {
  await apiClient.delete(`/api/supplier/${publicId}`);
}
