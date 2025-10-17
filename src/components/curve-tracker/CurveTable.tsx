import { useState, useEffect } from 'react';
import type { CurveScheduleWithRelations, CurveUpdateHistory, CurveReceipt } from '../../types/curve';
import type { FilterState } from './FilterPanel';

interface CurveTableProps {
  initialCurves: (CurveScheduleWithRelations & {
    updateHistory: CurveUpdateHistory[];
    receipts: CurveReceipt[];
    _count: {
      comments: number;
    };
  })[];
}

interface SortConfig {
  key: keyof CurveScheduleWithRelations;
  direction: 'asc' | 'desc';
}

export default function CurveTable({ initialCurves }: CurveTableProps) {
  const [curves, setCurves] = useState(initialCurves || []);
  const [filteredCurves, setFilteredCurves] = useState(initialCurves || []);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'curvePattern',
    direction: 'asc'
  });

  // Subscribe to filter changes from FilterPanel
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent<FilterState>) => {
      const filters = event.detail;
      
      const filtered = curves.filter(curve => {
        if (filters.market !== 'All' && !curve.location.startsWith(filters.market)) return false;
        if (filters.location !== 'All' && curve.location !== filters.location) return false;
        if (filters.sourceType !== 'All' && curve.sourceType !== filters.sourceType) return false;
        if (filters.granularity !== 'All' && curve.granularity !== filters.granularity) return false;
        
        if (filters.status !== 'All') {
          const now = new Date();
          const dueDate = curve.nextUpdateDue;
          if (!dueDate) return false;
          
          const daysDiff = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
          
          switch (filters.status) {
            case 'Overdue':
              if (daysDiff >= 0) return false;
              break;
            case 'Due Soon':
              if (daysDiff < 0 || daysDiff > 7) return false;
              break;
            case 'On Track':
              if (daysDiff <= 7) return false;
              break;
          }
        }
        
        return true;
      });
      
      setFilteredCurves(filtered);
    };

    window.addEventListener('filterchange', handleFilterChange as EventListener);
    return () => window.removeEventListener('filterchange', handleFilterChange as EventListener);
  }, [curves]);

  const handleSort = (key: keyof CurveScheduleWithRelations) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    const sortedCurves = [...filteredCurves].sort((a, b) => {
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setSortConfig({ key, direction });
    setFilteredCurves(sortedCurves);
  };

  const getStatusColor = (curve: CurveScheduleWithRelations) => {
    const dueDate = curve.nextUpdateDue;
    if (!dueDate || !(dueDate instanceof Date)) return 'bg-[#F9FAFB]';
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysDiff < 0) return 'bg-[#FEF2F2]';
    if (daysDiff <= 7) return 'bg-[#FEF3C7]';
    return 'bg-[#ECFDF5]';
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
      <table className="min-w-full divide-y divide-[#E5E7EB]">
        <thead className="bg-[#F9FAFB]">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('curvePattern')}
            >
              Curve Pattern
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('location')}
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('sourceType')}
            >
              Source Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('granularity')}
            >
              Granularity
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('lastUpdatedDate')}
            >
              Last Updated
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-[#111827] transition-colors"
              onClick={() => handleSort('nextUpdateDue')}
            >
              Next Due
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider"
            >
              Comments
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#E5E7EB]">
          {filteredCurves.map((curve) => (
            <tr
              key={curve.id}
              className={`${getStatusColor(curve)} hover:bg-white/50 transition-colors`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                {curve.curvePattern}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280] font-mono">
                {curve.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                {curve.sourceType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                {curve.granularity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280] font-mono">
                {formatDate(curve.lastUpdatedDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280] font-mono">
                {formatDate(curve.nextUpdateDue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280] font-mono">
                {curve._count.comments}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}`}
                    className="text-[#3B82F6] hover:text-[#2563EB] font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}/edit`}
                    className="text-[#10B981] hover:text-[#059669] font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => window.location.href = `/curve-schedule/${curve.id}/update`}
                    className="text-[#8B5CF6] hover:text-[#7C3AED] font-medium transition-colors"
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