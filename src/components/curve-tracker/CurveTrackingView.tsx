import React, { useState, useCallback } from 'react';
import { useCurveTracking } from '../../lib/hooks/useCurveTracking';
import { useCurveUploadTracking } from '../../lib/hooks/useCurveUploadTracking';
import { CurveRow } from './CurveRow';
import type { CurveWithTracking } from '../../lib/queries/curveTracking';

interface MarketSectionProps {
  title: string;
  curves: CurveWithTracking[];
  getStreak: (curveId: number) => { mark_date: Date; on_time: boolean; }[];
  onMarkUpdated: (curveId: number, notes?: string) => Promise<void>;
}

const MarketSection: React.FC<MarketSectionProps> = ({ title, curves, getStreak, onMarkUpdated }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="bg-white rounded-lg shadow">
      {curves.map(curve => (
        <CurveRow
          key={curve.curve_id}
          curve={curve}
          streaks={getStreak(curve.curve_id)}
          onMarkUpdated={onMarkUpdated}
        />
      ))}
      {curves.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No curves to display
        </div>
      )}
    </div>
  </div>
);

export const CurveTrackingView: React.FC = () => {
  const [market, setMarket] = useState<'ERCOT' | 'CAISO'>('ERCOT');
  const { recentlyUpdated, nextDue, loading, error, getStreak, refresh } = useCurveTracking(market);
  
  const { handleCurveUpload } = useCurveUploadTracking({
    onUpdateSuccess: (curveId) => {
      console.log(`Successfully updated tracking for curve ${curveId}`);
      refresh();
    },
    onUpdateError: (error) => {
      console.error('Failed to update curve tracking:', error);
      // You could add a toast notification here
    }
  });

  const handleMarkUpdated = useCallback(async (curveId: number, notes?: string) => {
    try {
      await handleCurveUpload(curveId, {
        uploadDate: new Date(),
        fileName: 'manual-update',
        uploadedBy: 'USER', // You could get this from your auth context
      });
    } catch (error) {
      console.error('Error marking curve as updated:', error);
    }
  }, [handleCurveUpload]);

  if (loading) {
    return <div className="p-8 text-center">Loading curve data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading curve data: {error.message}
        <button
          onClick={refresh}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Curve Tracking</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setMarket('ERCOT')}
            className={`px-4 py-2 rounded ${
              market === 'ERCOT' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            ERCOT
          </button>
          <button
            onClick={() => setMarket('CAISO')}
            className={`px-4 py-2 rounded ${
              market === 'CAISO' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            CAISO
          </button>
        </div>
      </div>

      <MarketSection
        title="Recently Updated Curves"
        curves={recentlyUpdated}
        getStreak={getStreak}
        onMarkUpdated={handleMarkUpdated}
      />

      <MarketSection
        title="Next Due for Update"
        curves={nextDue}
        getStreak={getStreak}
        onMarkUpdated={handleMarkUpdated}
      />
    </div>
  );
}; 