import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StreakVisualization } from './StreakVisualization';
import type { CurveWithTracking } from '../../lib/queries/curveTracking';
import type { CurveStreak } from '../../lib/hooks/useCurveTracking';

interface CurveRowProps {
  curve: CurveWithTracking;
  streaks: CurveStreak[];
  onMarkUpdated?: (curveId: number, notes?: string) => Promise<void>;
}

export const CurveRow: React.FC<CurveRowProps> = ({ curve, streaks, onMarkUpdated }) => {
  const navigate = useNavigate();

  const handleViewCurve = () => {
    navigate(`/revenue-forecasts/${curve.curve_id}`);
  };

  const handleMarkUpdated = async () => {
    const notes = prompt('Add any notes about this update (optional):');
    if (onMarkUpdated) {
      await onMarkUpdated(curve.curve_id, notes || undefined);
    }
  };

  return (
    <div className="flex items-center p-4 border-b hover:bg-gray-50">
      <div className="flex-1">
        <h3 className="font-medium group flex items-center whitespace-normal break-words text-base md:text-lg">
          <button 
            onClick={handleViewCurve}
            className="hover:text-blue-600 focus:outline-none focus:text-blue-600 text-left w-full"
            title={curve.description}
          >
            {curve.description
              ? curve.description
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ')
              : ''}
            <span className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500">
              View →
            </span>
          </button>
        </h3>
        <div className="text-sm text-gray-500 whitespace-normal break-words">
          <span title={curve.mark_type}>
            {curve.mark_type
              ? curve.mark_type
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ')
              : ''}
          </span>
          {' • '}{curve.location} • {curve.granularity}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Last updated: {new Date(curve.last_received_date).toLocaleDateString()}
        </div>
      </div>

      <div className="flex-1">
        <StreakVisualization streaks={streaks} />
      </div>

      <div className="flex-1 text-right">
        <div className={`text-sm ${curve.is_currently_fresh ? 'text-green-600' : 'text-yellow-600'}`}>
          {curve.is_currently_fresh ? 'Fresh' : 'Needs Update'}
        </div>
        <div className="text-sm text-gray-500">
          {curve.days_since_update} days since update
        </div>
        <button
          onClick={handleMarkUpdated}
          className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Mark Updated
        </button>
      </div>
    </div>
  );
}; 