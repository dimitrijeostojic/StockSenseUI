import { apiClient } from './client';
import type { DashboardResponse } from '../types';
import type { BusinessAnalyticsResponse } from '../types/analytics';

function toIso(d: Date): string {
  return d.toISOString();
}

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>('/api/dashboard');
  return data;
}

export async function getBusinessAnalytics(from: Date, to: Date, topN = 5): Promise<BusinessAnalyticsResponse> {
  const { data } = await apiClient.get<BusinessAnalyticsResponse>('/api/dashboard/business', {
    params: { from: toIso(from), to: toIso(to), topN },
  });
  return data;
}
