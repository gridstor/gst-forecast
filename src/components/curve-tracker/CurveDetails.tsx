import React from 'react';
import type {
  CurveScheduleWithRelations,
  CurveStatus
} from '../../types/curve-schedule';
import type { CurveDefinition } from '../../types/curve-types';

interface CurveDetailsProps {
  schedule: CurveScheduleWithRelations;
  associatedCurve: CurveDefinition | null;
}

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
};

const getStatusColor = (schedule: CurveScheduleWithRelations): string => {
  if (!schedule?.nextUpdateDue) {
    return 'bg-gray-100';
  }
  
  const now = new Date();
  const dueDate = new Date(schedule.nextUpdateDue);
  const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  
  const colors = {
    overdue: 'bg-red-100',
    warning: 'bg-yellow-100',
    good: 'bg-green-100'
  } as const;

  const isOverdue = daysDiff * -1 > 0;
  const isWarning = daysDiff >= 0 && daysDiff <= 7;
  
  return isOverdue ? colors.overdue : 
         isWarning ? colors.warning : 
         colors.good;
};

const getImportanceLabel = (importance: number): string => {
  const labels: Record<number, string> = {
    1: 'High Priority',
    2: 'Medium Priority',
    3: 'Low Priority'
  };
  return labels[importance] || 'Unknown Priority';
};

export default function CurveDetails({ schedule, associatedCurve }: CurveDetailsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Schedule Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Schedule Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pattern</label>
              <p className="mt-1 text-sm text-gray-900">{schedule.curvePattern}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <p className="mt-1 text-sm text-gray-900">{schedule.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Market</label>
              <p className="mt-1 text-sm text-gray-900">{schedule.market}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Update Frequency</label>
              <p className="mt-1 text-sm text-gray-900">{schedule.updateFrequency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsible Team</label>
              <p className="mt-1 text-sm text-gray-900">{schedule.responsibleTeam}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">
                {schedule.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Associated Curve Details */}
        {associatedCurve && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Associated Curve Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source Type</label>
                <p className="mt-1 text-sm text-gray-900">{associatedCurve.mark_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Provider</label>
                <p className="mt-1 text-sm text-gray-900">{associatedCurve.curve_creator || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Granularity</label>
                <p className="mt-1 text-sm text-gray-900">{associatedCurve.granularity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model Type</label>
                <p className="mt-1 text-sm text-gray-900">{associatedCurve.mark_model_type_desc || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Received</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(associatedCurve.mark_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Expected</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(associatedCurve.curve_end_date)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Update History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Update History</h2>
          {schedule.updateHistory && schedule.updateHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.updateHistory.map((history) => (
                    <tr key={history.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(history.updateDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.updatedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.status}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {history.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No update history available</p>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          {schedule.comments && schedule.comments.length > 0 ? (
            <div className="space-y-4">
              {schedule.comments.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg border ${comment.isResolved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.commentDate)}</p>
                    </div>
                    {comment.isResolved && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{comment.commentText}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No comments available</p>
          )}
        </div>
      </div>

      {/* Schedule Status */}
      <div className="space-y-6">
        <div className={`bg-white rounded-lg shadow-md p-6 ${getStatusColor(schedule)}`}>
          <h2 className="text-xl font-semibold mb-4">Schedule Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(schedule.lastUpdatedDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Update Due</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(schedule.nextUpdateDue)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Freshness Period</label>
              <p className="mt-1 text-sm text-gray-900">
                {schedule.freshnessStartDate ? (
                  `${formatDate(schedule.freshnessStartDate)} - ${formatDate(schedule.freshnessEndDate)}`
                ) : (
                  'Not set'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 