import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENTS } from 'react-joyride';
import type { EventData, Step } from 'react-joyride';
import { usePageTour } from './usePageTour';

vi.mock('../contexts/AuthContext');
vi.mock('../api/tenant');

import { useAuth } from '../contexts/AuthContext';
import { completeTour } from '../api/tenant';

const mockUseAuth = vi.mocked(useAuth);
const mockCompleteTour = vi.mocked(completeTour);

const STEPS: Step[] = [{ target: '[data-tour="test"]', content: 'Test step' }];

function makeTourEndEvent(): EventData {
  return { type: EVENTS.TOUR_END } as EventData;
}

function mockAuth(seenTourPages: string[] | null) {
  const markTourComplete = vi.fn();
  mockUseAuth.mockReturnValue({
    seenTourPages,
    markTourComplete,
  } as unknown as ReturnType<typeof useAuth>);
  return { markTourComplete };
}

describe('usePageTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCompleteTour.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not auto-start when pageName is in seenTourPages', () => {
    mockAuth(['products']);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('does not auto-start when seenTourPages is null (loading)', () => {
    mockAuth(null);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('auto-starts after 600ms when pageName is not in seenTourPages', () => {
    mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    expect(result.current.run).toBe(false);

    act(() => { vi.advanceTimersByTime(600); });

    expect(result.current.run).toBe(true);
  });

  it('does not auto-start when another page is already seen but not this one — still starts', () => {
    mockAuth(['suppliers']);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    act(() => { vi.advanceTimersByTime(600); });

    expect(result.current.run).toBe(true);
  });

  it('startTour sets run to true regardless of seen state', () => {
    mockAuth(['products']);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);

    act(() => { result.current.startTour(); });

    expect(result.current.run).toBe(true);
  });

  it('TOUR_END calls completeTour with pageName', async () => {
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(mockCompleteTour).toHaveBeenCalledWith('products');
    expect(markTourComplete).toHaveBeenCalledWith('products');
  });

  it('markTourComplete called even if API call fails', async () => {
    mockCompleteTour.mockRejectedValue(new Error('Network error'));
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markTourComplete).toHaveBeenCalledWith('products');
  });

  it('markTourComplete called when API call succeeds', async () => {
    mockCompleteTour.mockResolvedValue(undefined);
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markTourComplete).toHaveBeenCalledWith('products');
  });

  it('ignores non-TOUR_END events', async () => {
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    await act(async () => {
      await result.current.handleEvent({ type: EVENTS.STEP_AFTER } as EventData);
    });

    expect(mockCompleteTour).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('TOUR_END sets run to false', async () => {
    mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current.run).toBe(true);

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(result.current.run).toBe(false);
  });

  it('hook returns run, steps, handleEvent, startTour', () => {
    mockAuth([]);
    const { result } = renderHook(() => usePageTour('products', STEPS));

    expect(result.current).toHaveProperty('run');
    expect(result.current).toHaveProperty('steps');
    expect(result.current).toHaveProperty('handleEvent');
    expect(result.current).toHaveProperty('startTour');
    expect(result.current.steps).toBe(STEPS);
  });
});
