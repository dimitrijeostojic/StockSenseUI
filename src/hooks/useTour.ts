import { useState, useEffect, useCallback } from 'react';
import { EVENTS, type EventData, type Step } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { completeOnboarding } from '../api/tenant';

const STEPS: Step[] = [
  {
    target: '[data-tour="nav-suppliers"]',
    content: 'Add your first supplier — companies you order from',
  },
  {
    target: '[data-tour="nav-products"]',
    content: 'Your product catalog — stock levels live here',
  },
  {
    target: '[data-tour="nav-orders"]',
    content: 'Create purchase orders and track their status',
  },
  {
    target: '[data-tour="dashboard-kpi"]',
    content: 'Key metrics update automatically as you add data',
  },
  {
    target: '[data-tour="dashboard-stock-chart"]',
    content: 'Stock in vs out — your inventory flow over time',
  },
];

export function useTour() {
  const { hasSeenOnboarding, markOnboardingComplete } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (hasSeenOnboarding !== false) return;
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [hasSeenOnboarding]);

  const handleEvent = useCallback(async (data: EventData) => {
    if (data.type === EVENTS.TOUR_END) {
      setRun(false);
      try { await completeOnboarding(); } catch { /* silent — tour won't reshow this session */ }
      markOnboardingComplete();
    }
  }, [markOnboardingComplete]);

  return { run, steps: STEPS, handleEvent };
}
