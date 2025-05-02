import { useState, useEffect, useCallback } from 'react';
import { 
  getRecentlyUpdatedCurves, 
  getNextDueCurves, 
  getCurveUpdateStreak,
  getCurvesByTypeAndLocation
} from '../queries/curveTracking';
import type { CurveWithTracking } from '../queries/curveTracking';

interface CurveTrackingState {
  recentlyUpdated: CurveWithTracking[];
  nextDue: CurveWithTracking[];
  loading: boolean;
  error: Error | null;
}

export interface CurveStreak {
  mark_date: Date;
  on_time: boolean;
}

export function useCurveTracking(market: string, pollInterval = 30000) {
  const [state, setState] = useState<CurveTrackingState>({
    recentlyUpdated: [],
    nextDue: [],
    loading: true,
    error: null
  });

  const [streaks, setStreaks] = useState<Record<number, CurveStreak[]>>({});

  const fetchData = useCallback(async () => {
    try {
      const [recentlyUpdated, nextDue] = await Promise.all([
        getRecentlyUpdatedCurves(market),
        getNextDueCurves(market)
      ]);

      setState(prev => ({
        ...prev,
        recentlyUpdated,
        nextDue,
        loading: false,
        error: null
      }));

      // Fetch streaks for recently updated curves
      const streakPromises = recentlyUpdated.map(async curve => {
        const streak = await getCurveUpdateStreak(curve.curve_id);
        return { curveId: curve.curve_id, streak };
      });

      const newStreaks = await Promise.all(streakPromises);
      const streakMap = newStreaks.reduce((acc, { curveId, streak }) => {
        acc[curveId] = streak;
        return acc;
      }, {} as Record<number, CurveStreak[]>);

      setStreaks(streakMap);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error
      }));
    }
  }, [market]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  const filterByTypeAndLocation = useCallback(async (
    mark_type?: string,
    location?: string
  ) => {
    try {
      const filtered = await getCurvesByTypeAndLocation(market, mark_type, location);
      return filtered;
    } catch (error) {
      console.error('Error filtering curves:', error);
      return [];
    }
  }, [market]);

  const getStreak = useCallback((curveId: number) => {
    return streaks[curveId] || [];
  }, [streaks]);

  return {
    ...state,
    streaks,
    getStreak,
    filterByTypeAndLocation,
    refresh: fetchData
  };
} 