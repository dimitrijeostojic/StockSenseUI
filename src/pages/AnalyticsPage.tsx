import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getUserAnalytics } from '../api/analytics';
import type { UserAnalyticsResponse } from '../types/analytics';
import { PageHeader, TableCard, LoadingState } from '../components/Layout';

type Preset = '7d' | '30d' | '90d' | '365d' | 'custom';

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #ececf0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#18181b', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}


export function AnalyticsPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(toDateInput(daysAgo(30)));
  const [customTo, setCustomTo] = useState(toDateInput(new Date()));

  const [userData, setUserData] = useState<UserAnalyticsResponse | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const resolvedRange = useCallback((): { from: Date; to: Date } => {
    if (preset === 'custom') {
      return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)) };
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
    return { from: daysAgo(days), to: endOfDay(new Date()) };
  }, [preset, customFrom, customTo]);

  const fetchUserAnalytics = useCallback(async () => {
    const { from, to } = resolvedRange();
    setUserLoading(true);
    setUserError(null);
    try {
      const data = await getUserAnalytics(from, to);
      setUserData(data);
    } catch {
      setUserError(t('analytics_load_failed'));
    } finally {
      setUserLoading(false);
    }
  }, [resolvedRange, t]);

  useEffect(() => {
    fetchUserAnalytics();
  }, [fetchUserAnalytics]);

  const presets: Preset[] = ['7d', '30d', '90d', '365d'];
  const presetLabels: Record<Preset, string> = {
    '7d': t('analytics_7d'),
    '30d': t('analytics_30d'),
    '90d': t('analytics_90d'),
    '365d': t('analytics_365d'),
    'custom': t('analytics_custom'),
  };

  const timeRangeSelector = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 24 }}>
      {presets.map(p => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          style={{
            height: 34, padding: '0 14px', borderRadius: 8,
            border: preset === p ? 'none' : '1px solid #e4e4e7',
            background: preset === p ? '#6d28d9' : '#ffffff',
            color: preset === p ? '#ffffff' : '#52525b',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >{presetLabels[p]}</button>
      ))}
      <button
        onClick={() => setPreset('custom')}
        style={{
          height: 34, padding: '0 14px', borderRadius: 8,
          border: preset === 'custom' ? 'none' : '1px solid #e4e4e7',
          background: preset === 'custom' ? '#6d28d9' : '#ffffff',
          color: preset === 'custom' ? '#ffffff' : '#52525b',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
        }}
      >{presetLabels.custom}</button>
      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            style={{ height: 34, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}
          />
          <span style={{ color: '#a1a1aa', fontSize: 13 }}>–</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={e => setCustomTo(e.target.value)}
            style={{ height: 34, borderRadius: 8, border: '1px solid #e4e4e7', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
      )}
    </div>
  );

  const userSection = (
    <>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#18181b', marginBottom: 16 }}>{t('analytics_user_section')}</div>

      {userLoading && <LoadingState />}
      {userError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{userError}</div>}

      {!userLoading && userData && (
        <>
          <SectionCard title={t('analytics_registration_trend')}>
            {userData.registrationTrend.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={userData.registrationTrend} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                  <Line type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2} dot={false} name={t('analytics_registrations')} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 280 }}>
              <SectionCard title={t('analytics_activity_by_entity')}>
                {userData.activityByEntityType.length === 0 ? (
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userData.activityByEntityType} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                      <XAxis dataKey="entityName" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                      <Bar dataKey="count" fill="#6d28d9" radius={[4, 4, 0, 0]} name={t('analytics_actions')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : 280 }}>
              <SectionCard title={t('analytics_activity_by_action')}>
                {userData.activityByActionType.length === 0 ? (
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={userData.activityByActionType} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                      <XAxis dataKey="action" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #ececf0' }} />
                      <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name={t('analytics_actions')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard title={t('analytics_top_users')}>
            {userData.topActiveUsers.length === 0 ? (
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>{t('analytics_no_data')}</div>
            ) : (
              <TableCard>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 18px', borderBottom: '1px solid #ececf0', background: '#fafafa' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('email')}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('analytics_actions')}</div>
                </div>
                {userData.topActiveUsers.map((u, i) => (
                  <div
                    key={u.userEmail}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      padding: '11px 18px', borderBottom: i < userData.topActiveUsers.length - 1 ? '1px solid #ececf0' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#18181b', fontWeight: 600 }}>{u.userEmail}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9' }}>{u.count}</span>
                  </div>
                ))}
              </TableCard>
            )}
          </SectionCard>
        </>
      )}
    </>
  );

  return (
    <div>
      <PageHeader title={t('nav_analytics')} subtitle={t('analytics_subtitle')} />
      {timeRangeSelector}
      {userSection}
    </div>
  );
}
