interface StatusSummaryProps {
  totalCurves: number;
  overdueCurves: number;
  dueSoonCurves: number;
}

export default function StatusSummary({
  totalCurves,
  overdueCurves,
  dueSoonCurves
}: StatusSummaryProps) {
  const onTrackCurves = totalCurves - overdueCurves - dueSoonCurves;
  const onTrackPercentage = Math.round((onTrackCurves / totalCurves) * 100) || 0;
  const dueSoonPercentage = Math.round((dueSoonCurves / totalCurves) * 100) || 0;
  const overduePercentage = Math.round((overdueCurves / totalCurves) * 100) || 0;

  return (
    <>
      {/* On Track Card - Design System */}
      <div className="bg-white rounded-lg p-6 accent-border-green transition-all duration-200 hover:-translate-y-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">On Track</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-3xl font-bold text-[#111827] font-mono">{onTrackCurves}</p>
          <p className="text-sm text-[#6B7280] font-mono">({onTrackPercentage}%)</p>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div
            className="bg-[#10B981] h-2 rounded-full transition-all duration-300"
            style={{ width: `${onTrackPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Due Soon Card - Design System */}
      <div className="bg-white rounded-lg p-6 accent-border-purple transition-all duration-200 hover:-translate-y-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">Due Soon</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-3xl font-bold text-[#111827] font-mono">{dueSoonCurves}</p>
          <p className="text-sm text-[#6B7280] font-mono">({dueSoonPercentage}%)</p>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div
            className="bg-[#F59E0B] h-2 rounded-full transition-all duration-300"
            style={{ width: `${dueSoonPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Overdue Card - Design System */}
      <div className="bg-white rounded-lg p-6 accent-border-red transition-all duration-200 hover:-translate-y-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">Overdue</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-3xl font-bold text-[#111827] font-mono">{overdueCurves}</p>
          <p className="text-sm text-[#6B7280] font-mono">({overduePercentage}%)</p>
        </div>
        <div className="w-full bg-[#E5E7EB] rounded-full h-2">
          <div
            className="bg-[#EF4444] h-2 rounded-full transition-all duration-300"
            style={{ width: `${overduePercentage}%` }}
          ></div>
        </div>
      </div>
    </>
  );
} 