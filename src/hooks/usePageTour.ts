import { useState, useEffect, useCallback } from 'react';
import { EVENTS, type EventData, type Step } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { completeTour } from '../api/tenant';

export function usePageTour(pageName: string, steps: Step[]) {
  const { seenTourPages, markTourComplete } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (seenTourPages == null) return;
    if (seenTourPages.includes(pageName)) return;
    const timer = setTimeout(() => setRun(true), 600);
    return () => clearTimeout(timer);
  }, [seenTourPages, pageName]);

  const startTour = useCallback(() => {
    setRun(true);
  }, []);

  const handleEvent = useCallback(async (data: EventData) => {
    if (data.type !== EVENTS.TOUR_END) return;
    setRun(false);
    markTourComplete(pageName);
    try { await completeTour(pageName); } catch { /* silent */ }
  }, [pageName, markTourComplete]);

  return { run, steps, handleEvent, startTour };
}
