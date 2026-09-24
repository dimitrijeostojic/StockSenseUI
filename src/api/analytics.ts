import { apiClient } from './client';
import type { UserAnalyticsResponse, BusinessAnalyticsResponse } from '../types/analytics';

function toIso(d: Date): string {
  return d.toISOString();
}

export async function getUserAnalytics(from: Date, to: Date, topN = 10): Promise<UserAnalyticsResponse> {
  const { data } = await apiClient.get<UserAnalyticsResponse>('/api/analytics/users', {
    params: { from: toIso(from), to: toIso(to), topN },
  });
  return data;
}

export async function getBusinessAnalytics(from: Date, to: Date, topN = 5): Promise<BusinessAnalyticsResponse> {
  const { data } = await apiClient.get<BusinessAnalyticsResponse>('/api/analytics/business', {
    params: { from: toIso(from), to: toIso(to), topN },
  });
  return data;
}
