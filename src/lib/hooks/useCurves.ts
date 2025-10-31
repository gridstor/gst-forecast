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
        // Defensive programming: ensure defaults has the expected structure
        const safeDefaults = {
          monthly: Array.isArray(defaults?.monthly) ? defaults.monthly : [],
          annual: Array.isArray(defaults?.annual) ? defaults.annual : []
        };
        
        setMonthlyCurves(safeDefaults.monthly);
        setAnnualCurves(safeDefaults.annual);
        
        // Then fetch all curves for this location
        return fetchCurvesByLocation(location);
      })
      .then(curves => {
        // Ensure curves is an array
        setCurves(Array.isArray(curves) ? curves : []);
      })
      .catch(err => {
        console.error('Error loading curves:', err);
        setError(`Failed to load curves: ${err.message}`);
        // Set safe defaults on error
        setMonthlyCurves([]);
        setAnnualCurves([]);
        setCurves([]);
      })
      .finally(() => setLoading(false));
  }, [location]);

  // Fetch monthly data when monthly curves change
  useEffect(() => {
    if (Array.isArray(monthlyCurves) && monthlyCurves.length > 0) {
      setLoading(true);
      fetchCurveData({ 
        curveIds: monthlyCurves,
        aggregation: 'monthly'
      })
      .then(data => {
        setMonthlyData(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error loading monthly data:', err);
        setError(`Failed to load monthly data: ${err.message}`);
        setMonthlyData([]);
      })
      .finally(() => setLoading(false));
    } else {
      setMonthlyData([]);
    }
  }, [monthlyCurves]);

  // Fetch annual data when annual curves change
  useEffect(() => {
    if (Array.isArray(annualCurves) && annualCurves.length > 0) {
      setLoading(true);
      fetchCurveData({ 
        curveIds: annualCurves,
        aggregation: 'annual'
      })
      .then(data => {
        setAnnualData(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error loading annual data:', err);
        setError(`Failed to load annual data: ${err.message}`);
        setAnnualData([]);
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