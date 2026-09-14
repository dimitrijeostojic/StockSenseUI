import { apiClient } from './client';
import type { ProductDto, PagedResponse, StockEntryDto } from '../types';

export interface GetProductsParams {
  searchTerm?: string;
  sortBy?: string;
  isAscending?: boolean;
  pageNumber?: number;
  pageSize?: number;
  filterOn?: string;
  filterQuery?: string;
}

export async function getProducts(params: GetProductsParams = {}): Promise<PagedResponse<ProductDto>> {
  const { data } = await apiClient.get<PagedResponse<ProductDto>>('/api/product', { params: { pageNumber: 1, pageSize: 100, isAscending: true, ...params } });
  return data;
}

export async function getProductById(publicId: string): Promise<ProductDto> {
  const { data } = await apiClient.get<ProductDto>(`/api/product/${publicId}`);
  return data;
}

export interface CreateProductBody {
  name: string;
  sku: string;
  description?: string;
  price: number;
  vatRate: number;
  minimumStockQuantity: number;
  unitOfMeasurement: number;
  categoryPublicId: string;
  supplierPublicId: string;
}

export async function createProduct(body: CreateProductBody): Promise<void> {
  await apiClient.post('/api/product', body);
}

export interface UpdateProductBody {
  name: string;
  sku: string;
  description?: string;
  price: number;
  vatRate: number;
  minimumStockQuantity: number;
  unitOfMeasurement: number;
  categoryId: string;
  supplierId: string;
}

export async function updateProduct(publicId: string, body: UpdateProductBody): Promise<void> {
  await apiClient.put(`/api/product/${publicId}`, body);
}

export async function deleteProduct(publicId: string): Promise<void> {
  await apiClient.delete(`/api/product/${publicId}`);
}

export interface CreateStockEntryBody {
  quantity: number;
  notes?: string;
  stockEntryType: number;
}

export async function createStockEntry(productId: string, body: CreateStockEntryBody): Promise<void> {
  await apiClient.post(`/api/product/${productId}/stockentry`, body);
}

export async function getStockEntries(productId: string): Promise<StockEntryDto[]> {
  const { data } = await apiClient.get<{ items: StockEntryDto[]; totalCount: number }>(`/api/product/${productId}/stockentry`);
  return data.items;
}

export interface BulkImportResult {
  successCount: number;
  failureCount: number;
  errors: { rowNumber: number; errorMessage: string }[];
}

export async function bulkImportProducts(file: File): Promise<BulkImportResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<BulkImportResult>('/api/product/bulk-import', form);
  return data;
}
