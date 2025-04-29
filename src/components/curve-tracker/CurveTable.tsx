import { useState } from 'react';
import type { CurveSchedule, CurveUpdateHistory, CurveReceipt } from '@prisma/client';

interface CurveTableProps {
  initialCurves: (CurveSchedule & {
    updateHistory: CurveUpdateHistory[];
    receipts: CurveReceipt[];
    _count: {
      comments: number;
    };
  })[];
}

interface SortConfig {
  key: keyof CurveSchedule;
  direction: 'asc' | 'desc';
}

export default function CurveTable({ initialCurves }: CurveTableProps) {
  const [curves, setCurves] = useState(initialCurves);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'curvePattern',
    direction: 'asc'
  });

  const handleSort = (key: keyof CurveSchedule) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    const sortedCurves = [...curves].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setSortConfig({ key, direction });
    setCurves(sortedCurves);
  };

  const getStatusColor = (curve: CurveSchedule) => {
    const dueDate = curve.nextUpdateDue;
    if (!dueDate) return 'bg-gray-100';
    
    try {
      const now = new Date();
      const daysDiff = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      );

      if (daysDiff < 0) return 'bg-red-100';
      if (daysDiff <= 7) return 'bg-yellow-100';
      return 'bg-green-100';
    } catch {
      return 'bg-gray-100';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    try {
      return date.toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('curvePattern')}
            >
              Curve Pattern
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('location')}
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('sourceType')}
            >
              Source Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('granularity')}
            >
              Granularity
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('lastUpdatedDate')}
            >
              Last Updated
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('nextUpdateDue')}
            >
              Next Due
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Comments
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {curves.map((curve) => (
            <tr
              key={curve.id}
              className={`${getStatusColor(curve)} hover:bg-gray-50 transition-colors`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {curve.curvePattern}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {curve.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {curve.sourceType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {curve.granularity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(curve.lastUpdatedDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(curve.nextUpdateDue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {curve._count.comments}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </button>
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}/edit`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}/update`}
                    className="text-green-600 hover:text-green-900"
                  >
                    Update
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 