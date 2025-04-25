import { useState, useEffect } from 'react';
import { fetchCurvesByLocation, fetchCurveData, fetchDefaultCurves } from '../api-client';
import type { CurveDefinition, CurveData } from '../types';

export function useCurves(location: string) {
  const [curves, setCurves] = useState<CurveDefinition[]>([]);
  const [monthlyData, setMonthlyData] = useState<CurveData[]>([]);
  const [annualData, setAnnualData] = useState<CurveData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCurves, setMonthlyCurves] = useState<number[]>([]);
  const [annualCurves, setAnnualCurves] = useState<number[]>([]);

  // Fetch curves when location changes
  useEffect(() => {
    if (!location) return;

    setLoading(true);
    setError(null);

    // First get the default curves for this location
    fetchDefaultCurves(location)
      .then(defaults => {
        setMonthlyCurves(defaults.monthly);
        setAnnualCurves(defaults.annual);
        // Then fetch all curves for this location
        return fetchCurvesByLocation(location);
      })
      .then(curves => {
        setCurves(curves);
      })
      .catch(err => {
        console.error('Error loading curves:', err);
        setError(`Failed to load curves: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [location]);

  // Fetch monthly data when monthly curves change
  useEffect(() => {
    if (monthlyCurves.length > 0) {
      setLoading(true);
      fetchCurveData({ 
        curveIds: monthlyCurves,
        aggregation: 'monthly'
      })
      .then(data => {
        setMonthlyData(data);
      })
      .catch(err => {
        console.error('Error loading monthly data:', err);
        setError(`Failed to load monthly data: ${err.message}`);
      })
      .finally(() => setLoading(false));
    } else {
      setMonthlyData([]);
    }
  }, [monthlyCurves]);

  // Fetch annual data when annual curves change
  useEffect(() => {
    if (annualCurves.length > 0) {
      setLoading(true);
      fetchCurveData({ 
        curveIds: annualCurves,
        aggregation: 'annual'
      })
      .then(data => {
        setAnnualData(data);
      })
      .catch(err => {
        console.error('Error loading annual data:', err);
        setError(`Failed to load annual data: ${err.message}`);
      })
      .finally(() => setLoading(false));
    } else {
      setAnnualData([]);
    }
  }, [annualCurves]);

  return {
    curves,
    monthlyData,
    annualData,
    loading,
    error,
    monthlyCurves,
    setMonthlyCurves,
    annualCurves,
    setAnnualCurves
  };
} 