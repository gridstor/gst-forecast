interface MarketSummaryProps {
  marketDistribution: Record<string, number>;
}

export default function MarketSummary({ marketDistribution }: MarketSummaryProps) {
  const safeMarketDistribution = marketDistribution || {};
  const total = Object.values(safeMarketDistribution).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Market Distribution</h3>
      <div className="space-y-4">
        {Object.entries(safeMarketDistribution).map(([market, count]) => {
          const percentage = Math.round((count / total) * 100);
          return (
            <div key={market}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#111827]">{market}</span>
                <span className="text-sm text-[#6B7280] font-mono">{count} curves ({percentage}%)</span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                <div
                  className="bg-[#3B82F6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Total Curves</span>
          <span className="text-lg font-bold text-[#111827] font-mono">{total}</span>
        </div>
      </div>
    </div>
  );
} 