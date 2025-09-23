interface MarketSummaryProps {
  marketDistribution: Record<string, number>;
}

export default function MarketSummary({ marketDistribution }: MarketSummaryProps) {
  const safeMarketDistribution = marketDistribution || {};
  const total = Object.values(safeMarketDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Market Distribution</h3>
      <div className="space-y-4">
        {Object.entries(safeMarketDistribution).map(([market, count]) => {
          const percentage = Math.round((count / total) * 100);
          return (
            <div key={market}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{market}</span>
                <span className="text-sm text-gray-500">{count} curves ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Curves</span>
          <span className="text-sm font-semibold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
} 