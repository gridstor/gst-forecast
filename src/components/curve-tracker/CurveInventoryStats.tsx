interface StatsProps {
  stats: {
    total: number;
    bySource: Record<string, number>;
    byMarket: Record<string, number>;
    byGranularity: Record<string, number>;
  };
}

interface StatBlockProps {
  title: string;
  stats: Record<string, number>;
  total: number;
  colorClasses?: string[];
}

function StatBlock({ title, stats, total, colorClasses = ['bg-indigo-600'] }: StatBlockProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(stats).map(([key, value], index) => {
          const percentage = Math.round((value / total) * 100);
          const colorClass = colorClasses[index % colorClasses.length];
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{key}</span>
                <span className="text-sm text-gray-500">
                  {value} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${colorClass} h-2 rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CurveInventoryStats({ stats }: StatsProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Curve Statistics</h2>
        <div className="text-3xl font-bold text-indigo-600">
          {stats.total}
          <span className="text-base font-normal text-gray-500 ml-2">total curves</span>
        </div>
      </div>

      <StatBlock
        title="By Source"
        stats={stats.bySource}
        total={stats.total}
        colorClasses={['bg-blue-600', 'bg-green-600']}
      />

      <StatBlock
        title="By Market"
        stats={stats.byMarket}
        total={stats.total}
        colorClasses={['bg-purple-600', 'bg-pink-600']}
      />

      <StatBlock
        title="By Granularity"
        stats={stats.byGranularity}
        total={stats.total}
        colorClasses={['bg-orange-600', 'bg-yellow-600']}
      />
    </div>
  );
} 