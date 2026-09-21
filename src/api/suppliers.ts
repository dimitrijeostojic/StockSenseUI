import { apiClient } from './client';
import type { SupplierDto, SupplierDetailDto, PagedResponse } from '../types';

export async function getSuppliers(params: { pageNumber?: number; pageSize?: number; searchTerm?: string; sortBy?: string; isAscending?: boolean } = {}): Promise<PagedResponse<SupplierDto>> {
  const { data } = await apiClient.get<PagedResponse<SupplierDto>>('/api/supplier', { params: { pageNumber: 1, pageSize: 100, isAscending: true, ...params } });
  return data;
}

export interface SupplierBody {
  name: string;
  contactName: string;
  contactEmail: string;
  supplierCode: string;
  currency: number;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
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

export async function getSupplierById(publicId: string): Promise<SupplierDetailDto> {
  const { data } = await apiClient.get<SupplierDetailDto>(`/api/supplier/${publicId}`);
  return data;
}
