import { useState, useEffect } from 'react';
import type { CurveSchedule, CurveUpdateHistory, CurveReceipt } from '@prisma/client';

interface CurveWithRelations extends CurveSchedule {
  updateHistory: CurveUpdateHistory[];
  receipts: CurveReceipt[];
  _count: {
    comments: number;
  };
}

interface CurveInventoryTableProps {
  initialCurves: CurveWithRelations[];
}

interface GroupedCurves {
  [key: string]: CurveWithRelations[];
}

export default function CurveInventoryTable({ initialCurves }: CurveInventoryTableProps) {
  const [curves, setCurves] = useState(initialCurves);
  const [groupedCurves, setGroupedCurves] = useState<GroupedCurves>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedCurves, setSelectedCurves] = useState<Set<number>>(new Set());

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (curve: CurveSchedule) => {
    if (!curve.nextUpdateDue) return 'bg-gray-100';
    
    const now = new Date();
    const dueDate = new Date(curve.nextUpdateDue);
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysDiff < 0) return 'bg-red-100';
    if (daysDiff <= 7) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (expandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const toggleCurve = (curveId: number) => {
    const newSelectedCurves = new Set(selectedCurves);
    if (selectedCurves.has(curveId)) {
      newSelectedCurves.delete(curveId);
    } else {
      newSelectedCurves.add(curveId);
    }
    setSelectedCurves(newSelectedCurves);
  };

  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th className="w-8 px-4 py-3">
          <input
            type="checkbox"
            onChange={(e) => {
              const newSelectedCurves = new Set<number>();
              if (e.target.checked) {
                curves.forEach(curve => newSelectedCurves.add(curve.id));
              }
              setSelectedCurves(newSelectedCurves);
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Curve Pattern
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Source / Provider
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Location
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Granularity
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Last Updated
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Next Due
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th className="px-4 py-3"></th>
      </tr>
    </thead>
  );

  const renderCurveRow = (curve: CurveWithRelations) => (
    <tr
      key={curve.id}
      className={`${getStatusColor(curve)} hover:bg-gray-50 transition-colors`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selectedCurves.has(curve.id)}
          onChange={() => toggleCurve(curve.id)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {curve.curvePattern}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {curve.sourceType} / {curve.provider}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {curve.location}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {curve.granularity}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(curve.lastUpdatedDate)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(curve.nextUpdateDue)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {curve.updateHistory[0]?.status || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = `/curve-tracker/${curve.id}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            View
          </button>
          <button
            onClick={() => window.location.href = `/curve-tracker/${curve.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );

  const renderGroupedCurves = () => (
    Object.entries(groupedCurves).map(([groupName, groupCurves]) => (
      <div key={groupName} className="mb-4">
        <div
          className="bg-gray-100 px-4 py-2 flex items-center cursor-pointer"
          onClick={() => toggleGroup(groupName)}
        >
          <span className="mr-2">
            {expandedGroups.has(groupName) ? '▼' : '▶'}
          </span>
          <h3 className="text-lg font-medium">{groupName}</h3>
          <span className="ml-2 text-gray-500">({groupCurves.length} curves)</span>
        </div>
        {expandedGroups.has(groupName) && (
          <div className="mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              {renderTableHeader()}
              <tbody className="bg-white divide-y divide-gray-200">
                {groupCurves.map(curve => renderCurveRow(curve))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="overflow-x-auto">
      {Object.keys(groupedCurves).length > 0 ? (
        <div className="p-4">
          {renderGroupedCurves()}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader()}
          <tbody className="bg-white divide-y divide-gray-200">
            {curves.map(curve => renderCurveRow(curve))}
          </tbody>
        </table>
      )}
      
      {selectedCurves.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <span className="font-medium">{selectedCurves.size} curves selected</span>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => setSelectedCurves(new Set())}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Selection
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Batch Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 