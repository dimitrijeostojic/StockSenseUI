import { apiClient } from './client';
import type { OrderListDto, OrderDetailDto, PagedResponse } from '../types';

export async function getOrders(params: { pageNumber?: number; pageSize?: number; searchTerm?: string; sortBy?: string; isAscending?: boolean; filterOn?: string; filterQuery?: string } = {}): Promise<PagedResponse<OrderListDto>> {
  const { data } = await apiClient.get<PagedResponse<OrderListDto>>('/api/order', { params: { pageNumber: 1, pageSize: 1000, isAscending: false, ...params } });
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
  await apiClient.post('/api/order', body);
}

export interface UpdateOrderBody {
  supplierPublicId: string;
  orderDate: string;
  notes?: string;
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
