import React from 'react';
import { getHealthScoreColor, getHealthScoreLabel } from '../../lib/utils/healthScore';
import type { HealthScoreComponents } from '../../lib/utils/healthScore';

interface HealthScoreIndicatorProps {
  score: HealthScoreComponents;
  showDetails?: boolean;
}

const HealthScoreIndicator: React.FC<HealthScoreIndicatorProps> = ({ score, showDetails = false }) => {
  const colorClass = getHealthScoreColor(score.totalScore);
  const label = getHealthScoreLabel(score.totalScore);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <span className="font-medium">{score.totalScore}% - {label}</span>
      </div>
      
      {showDetails && (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Freshness:</span>
            <span>{score.freshnessScore}%</span>
          </div>
          <div className="flex justify-between">
            <span>Compliance:</span>
            <span>{score.complianceScore}%</span>
          </div>
          <div className="flex justify-between">
            <span>Quality:</span>
            <span>{score.qualityScore}%</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded mt-2">
            <div
              className={`h-full ${colorClass.replace('bg-', 'bg-')} rounded transition-all duration-300`}
              style={{ width: `${score.totalScore}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthScoreIndicator; 