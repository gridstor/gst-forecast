import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { CurveStreak } from '../../lib/hooks/useCurveTracking';

interface StreakVisualizationProps {
  streaks: CurveStreak[];
  width?: number;
  height?: number;
}

export const StreakVisualization: React.FC<StreakVisualizationProps> = ({
  streaks,
  width = 300,
  height = 50
}) => {
  const dotSize = 8;
  const gap = 4;
  const maxDots = Math.floor(width / (dotSize + gap));

  const displayStreaks = useMemo(() => {
    return streaks
      .slice(0, maxDots)
      .sort((a, b) => new Date(b.mark_date).getTime() - new Date(a.mark_date).getTime());
  }, [streaks, maxDots]);

  return (
    <div className="relative" style={{ width, height }}>
      {/* Streak dots */}
      <div className="flex items-center space-x-1">
        {displayStreaks.map((streak, index) => (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full 
              ${streak.on_time ? 'bg-green-500' : 'bg-yellow-500'}
              transition-all duration-200 hover:scale-150
            `}
            title={`${format(new Date(streak.mark_date), 'MMM d, yyyy')}
${streak.on_time ? 'On time' : 'Late'}`}
          />
        ))}
      </div>

      {/* Timeline */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200">
        <div className="absolute left-0 -bottom-4 text-xs text-gray-500">
          {displayStreaks.length > 0 &&
            format(new Date(displayStreaks[displayStreaks.length - 1].mark_date), 'MMM d')}
        </div>
        <div className="absolute right-0 -bottom-4 text-xs text-gray-500">
          {displayStreaks.length > 0 &&
            format(new Date(displayStreaks[0].mark_date), 'MMM d')}
        </div>
      </div>
    </div>
  );
}; 