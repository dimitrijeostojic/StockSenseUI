import { apiClient } from './client';
import type { GoodsReceiptDto } from '../types';

export interface CreateGoodsReceiptBody {
  notes?: string;
  items: Array<{ orderItemPublicId: string; receivedQuantity: number }>;
}

export async function createGoodsReceipt(orderPublicId: string, body: CreateGoodsReceiptBody): Promise<void> {
  await apiClient.post(`/api/orders/${orderPublicId}/goods-receipt`, body);
}

export async function getGoodsReceiptByOrderId(orderPublicId: string): Promise<GoodsReceiptDto> {
  const { data } = await apiClient.get<GoodsReceiptDto>(`/api/orders/${orderPublicId}/goods-receipt`);
  return data;
}

export async function exportGoodsReceiptPdf(orderPublicId: string): Promise<void> {
  const { data, headers } = await apiClient.get(`/api/orders/${orderPublicId}/goods-receipt/export-pdf`, { responseType: 'blob' });
  const disposition: string = headers['content-disposition'] ?? '';
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match?.[1]?.replace(/['"]/g, '') ?? `goods-receipt-${orderPublicId}.pdf`;
  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
