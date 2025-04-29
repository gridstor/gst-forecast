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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">On Track</h3>
        <div className="flex items-baseline">
          <p className="text-3xl font-semibold text-green-600">{onTrackCurves}</p>
          <p className="ml-2 text-sm text-gray-500">({onTrackPercentage}%)</p>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${onTrackPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Due Soon</h3>
        <div className="flex items-baseline">
          <p className="text-3xl font-semibold text-yellow-600">{dueSoonCurves}</p>
          <p className="ml-2 text-sm text-gray-500">({dueSoonPercentage}%)</p>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-600 h-2 rounded-full"
            style={{ width: `${dueSoonPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Overdue</h3>
        <div className="flex items-baseline">
          <p className="text-3xl font-semibold text-red-600">{overdueCurves}</p>
          <p className="ml-2 text-sm text-gray-500">({overduePercentage}%)</p>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full"
            style={{ width: `${overduePercentage}%` }}
          ></div>
        </div>
      </div>
    </>
  );
} 