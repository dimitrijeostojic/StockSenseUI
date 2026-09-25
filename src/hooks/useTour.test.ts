import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENTS } from 'react-joyride';
import type { EventData } from 'react-joyride';
import { useTour } from './useTour';

vi.mock('../contexts/AuthContext');
vi.mock('../api/tenant');

import { useAuth } from '../contexts/AuthContext';
import { completeTour } from '../api/tenant';

const mockUseAuth = vi.mocked(useAuth);
const mockCompleteTour = vi.mocked(completeTour);

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

describe('useTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCompleteTour.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start when dashboard is in seenTourPages', () => {
    mockAuth(['dashboard']);
    const { result } = renderHook(() => useTour());

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('does not start when seenTourPages is null (loading)', () => {
    mockAuth(null);
    const { result } = renderHook(() => useTour());

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('starts after 600ms when dashboard is not in seenTourPages', () => {
    mockAuth([]);
    const { result } = renderHook(() => useTour());

    expect(result.current.run).toBe(false);

    act(() => { vi.advanceTimersByTime(600); });

    expect(result.current.run).toBe(true);
  });

  it('skip (TOUR_END) calls completeTour with dashboard', async () => {
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(mockCompleteTour).toHaveBeenCalledWith('dashboard');
    expect(markTourComplete).toHaveBeenCalledWith('dashboard');
  });

  it('finish (TOUR_END) calls completeTour with dashboard', async () => {
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(mockCompleteTour).toHaveBeenCalledWith('dashboard');
    expect(markTourComplete).toHaveBeenCalledWith('dashboard');
  });

  it('marks tour complete in context even when API call fails', async () => {
    mockCompleteTour.mockRejectedValue(new Error('Network error'));
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markTourComplete).toHaveBeenCalledWith('dashboard');
  });

  it('marks tour complete in context when API call succeeds', async () => {
    mockCompleteTour.mockResolvedValue(undefined);
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markTourComplete).toHaveBeenCalledWith('dashboard');
  });

  it('ignores non-TOUR_END events', async () => {
    const { markTourComplete } = mockAuth([]);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent({ type: EVENTS.STEP_AFTER } as EventData);
    });

    expect(mockCompleteTour).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });
});
