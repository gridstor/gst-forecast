import { useState } from 'react';
import type { CurveScheduleWithRelations } from '../../types/curve';
import StreakIndicator from './StreakIndicator';

interface CurveCardProps {
  curve: CurveScheduleWithRelations;
}

export default function CurveCard({ curve }: CurveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = () => {
    if (!curve.nextUpdateDue) return { text: 'No Schedule', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const dueDate = new Date(curve.nextUpdateDue);
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysDiff < 0) return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
    if (daysDiff <= 7) return { text: 'Due Soon', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Fresh', color: 'bg-green-100 text-green-800' };
  };

  const status = getStatusBadge();

  return (
    <div 
      className={`bg-white rounded-lg shadow-md transition-all duration-200 ${
        isExpanded ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{curve.curvePattern}</h3>
            <p className="text-sm text-gray-600">{curve.location}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Update Streak */}
        <div className="my-4">
          <StreakIndicator updateHistory={curve.updateHistory} />
        </div>

        {/* Metadata */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Last Updated:</span>
            <span className="text-xs font-medium">
              {curve.lastUpdatedDate ? new Date(curve.lastUpdatedDate).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Next Due:</span>
            <span className="text-xs font-medium">
              {curve.nextUpdateDue ? new Date(curve.nextUpdateDue).toLocaleDateString() : 'Not Scheduled'}
            </span>
          </div>
        </div>

        {/* Icons */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="px-2 py-1 rounded-md bg-gray-100 text-xs">
            {curve.granularity}
          </span>
          <span className="px-2 py-1 rounded-md bg-gray-100 text-xs">
            {curve.sourceType}
          </span>
          {curve.modelType && (
            <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
              {curve.modelType}
            </span>
          )}
          {curve._count.comments > 0 && (
            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
              {curve._count.comments} comments
            </span>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Actions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Actions</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/curve-schedule/${curve.id}/edit`;
                    }}
                    className="px-3 py-1 text-sm rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/curve-schedule/${curve.id}/update`;
                    }}
                    className="px-3 py-1 text-sm rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    Update
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement download functionality
                      alert('Download functionality coming soon');
                    }}
                    className="px-3 py-1 text-sm rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    Download Data
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement comparison functionality
                      alert('Comparison functionality coming soon');
                    }}
                    className="px-3 py-1 text-sm rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    Compare Versions
                  </button>
                </div>
              </div>

              {/* Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Details</h4>
                <dl className="mt-2 text-sm grid grid-cols-3 gap-2">
                  <dt className="text-gray-500">Market</dt>
                  <dd className="col-span-2">{curve.location.split('-')[0]}</dd>
                  
                  <dt className="text-gray-500">Type</dt>
                  <dd className="col-span-2">{curve.sourceType}</dd>
                  
                  <dt className="text-gray-500">Granularity</dt>
                  <dd className="col-span-2">{curve.granularity}</dd>
                  
                  {curve.modelType && (
                    <>
                      <dt className="text-gray-500">Model Type</dt>
                      <dd className="col-span-2">{curve.modelType}</dd>
                    </>
                  )}
                  
                  <dt className="text-gray-500">Update Frequency</dt>
                  <dd className="col-span-2">{curve.updateFrequency}</dd>
                </dl>
              </div>

              {/* Update History Timeline */}
              {curve.updateHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Update History</h4>
                  <div className="mt-2 space-y-3">
                    {curve.updateHistory.map((update, index) => (
                      <div key={index} className="relative pl-4 border-l-2 border-gray-200">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-gray-200" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {new Date(update.updateDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            Updated by: {update.updatedBy}
                          </div>
                          {update.notes && (
                            <div className="text-gray-700 mt-1">{update.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Freshness Period */}
              {(curve.freshnessStartDate || curve.freshnessEndDate) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Freshness Period</h4>
                  <div className="mt-2 text-sm">
                    <div>
                      <span className="text-gray-500">Start:</span>{' '}
                      {curve.freshnessStartDate ? new Date(curve.freshnessStartDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">End:</span>{' '}
                      {curve.freshnessEndDate ? new Date(curve.freshnessEndDate).toLocaleDateString() : 'Current'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 