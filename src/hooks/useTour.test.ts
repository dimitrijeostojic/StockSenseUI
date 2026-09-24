import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENTS } from 'react-joyride';
import type { EventData } from 'react-joyride';
import { useTour } from './useTour';

vi.mock('../contexts/AuthContext');
vi.mock('../api/tenant');

import { useAuth } from '../contexts/AuthContext';
import { completeOnboarding } from '../api/tenant';

const mockUseAuth = vi.mocked(useAuth);
const mockCompleteOnboarding = vi.mocked(completeOnboarding);

function makeTourEndEvent(): EventData {
  return { type: EVENTS.TOUR_END } as EventData;
}

function mockAuth(hasSeenOnboarding: boolean | null) {
  const markOnboardingComplete = vi.fn();
  mockUseAuth.mockReturnValue({
    hasSeenOnboarding,
    markOnboardingComplete,
  } as unknown as ReturnType<typeof useAuth>);
  return { markOnboardingComplete };
}

describe('useTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockCompleteOnboarding.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start when hasSeenOnboarding is true', () => {
    mockAuth(true);
    const { result } = renderHook(() => useTour());

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('does not start when hasSeenOnboarding is null (loading)', () => {
    mockAuth(null);
    const { result } = renderHook(() => useTour());

    act(() => { vi.advanceTimersByTime(1000); });

    expect(result.current.run).toBe(false);
  });

  it('starts after 600ms when hasSeenOnboarding is false', () => {
    mockAuth(false);
    const { result } = renderHook(() => useTour());

    expect(result.current.run).toBe(false);

    act(() => { vi.advanceTimersByTime(600); });

    expect(result.current.run).toBe(true);
  });

  it('skip (TOUR_END) calls completeOnboarding once', async () => {
    const { markOnboardingComplete } = mockAuth(false);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(mockCompleteOnboarding).toHaveBeenCalledOnce();
    expect(markOnboardingComplete).toHaveBeenCalledOnce();
  });

  it('finish (TOUR_END) calls completeOnboarding once', async () => {
    const { markOnboardingComplete } = mockAuth(false);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(mockCompleteOnboarding).toHaveBeenCalledOnce();
    expect(markOnboardingComplete).toHaveBeenCalledOnce();
  });

  it('marks onboarding complete in context even when API call fails', async () => {
    mockCompleteOnboarding.mockRejectedValue(new Error('Network error'));
    const { markOnboardingComplete } = mockAuth(false);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markOnboardingComplete).toHaveBeenCalledOnce();
  });

  it('marks onboarding complete in context when API call succeeds', async () => {
    mockCompleteOnboarding.mockResolvedValue(undefined);
    const { markOnboardingComplete } = mockAuth(false);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent(makeTourEndEvent());
    });

    expect(markOnboardingComplete).toHaveBeenCalledOnce();
  });

  it('ignores non-TOUR_END events', async () => {
    const { markOnboardingComplete } = mockAuth(false);
    const { result } = renderHook(() => useTour());

    await act(async () => {
      await result.current.handleEvent({ type: EVENTS.STEP_AFTER } as EventData);
    });

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(markOnboardingComplete).not.toHaveBeenCalled();
  });
});
