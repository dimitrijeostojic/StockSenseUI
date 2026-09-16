import { apiClient } from './client';
import type { OrderListDto, OrderDetailDto, PagedResponse } from '../types';

export async function getOrders(params: { pageNumber?: number; pageSize?: number; searchTerm?: string; sortBy?: string; isAscending?: boolean; filterOn?: string; filterQuery?: string } = {}): Promise<PagedResponse<OrderListDto>> {
  const { data } = await apiClient.get<PagedResponse<OrderListDto>>('/api/order', { params: { pageNumber: 1, pageSize: 100, isAscending: false, ...params } });
  return data;
}

export async function getOrderById(publicId: string): Promise<OrderDetailDto> {
  const { data } = await apiClient.get<OrderDetailDto>(`/api/order/${publicId}`);
  return data;
}

export interface CreateOrderBody {
  supplierPublicId: string;
  orderDate: string;
  notes?: string;
  orderItemsDto: Array<{ productPublicId: string; quantity: number }>;
}

export async function createOrder(body: CreateOrderBody): Promise<void> {
  await apiClient.post('/api/order', body, {
    headers: { 'X-Idempotency-Key': crypto.randomUUID() },
  });
}

export interface UpdateOrderBody {
  supplierPublicId: string;
  orderDate: string;
  notes?: string;
  orderItemsDto?: Array<{ productPublicId: string; quantity: number }>;
}

export async function updateOrder(publicId: string, body: UpdateOrderBody): Promise<void> {
  await apiClient.put(`/api/order/${publicId}`, body);
}

export async function updateOrderStatus(publicId: string, status: number): Promise<void> {
  await apiClient.patch(`/api/order/${publicId}/status`, { status });
}

export async function deleteOrder(publicId: string): Promise<void> {
  await apiClient.delete(`/api/order/${publicId}`);
}

export async function exportOrderPdf(publicId: string): Promise<void> {
  const { data, headers } = await apiClient.get(`/api/order/${publicId}/export-pdf`, { responseType: 'blob' });
  const disposition: string = headers['content-disposition'] ?? '';
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match?.[1]?.replace(/['"]/g, '') ?? `order-${publicId}.pdf`;
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
