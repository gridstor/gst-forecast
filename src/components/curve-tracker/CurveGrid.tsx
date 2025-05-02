import type { CurveScheduleWithRelations } from '../../types/curve';
import CurveCard from './CurveCard';

interface CurveGridProps {
  curves: CurveScheduleWithRelations[];
  selectedDate?: Date | null;
}

interface MarketGroup {
  recentlyUpdated: CurveScheduleWithRelations[];
  nextDue: CurveScheduleWithRelations[];
}

export default function CurveGrid({ curves, selectedDate }: CurveGridProps) {
  // Filter curves by freshness period if a date is selected
  const filteredCurves = selectedDate ? curves.filter(curve => {
    const date = selectedDate.getTime();
    const freshStart = curve.freshnessStartDate ? new Date(curve.freshnessStartDate).getTime() : null;
    const freshEnd = curve.freshnessEndDate ? new Date(curve.freshnessEndDate).getTime() : null;
    
    return freshStart && (freshEnd ? date >= freshStart && date <= freshEnd : date >= freshStart);
  }) : curves;

  // Group curves by market
  const markets = ['ERCOT', 'CAISO'];
  const marketGroups = markets.reduce((acc, market) => {
    const marketCurves = filteredCurves.filter(curve => curve.location.startsWith(market));
    
    // Sort by last update date
    const sortedByUpdate = [...marketCurves].sort((a, b) => 
      new Date(b.lastUpdatedDate || 0).getTime() - new Date(a.lastUpdatedDate || 0).getTime()
    );

    // Sort by next due date
    const sortedByDue = [...marketCurves].sort((a, b) => {
      if (!a.nextUpdateDue) return 1;
      if (!b.nextUpdateDue) return -1;
      return new Date(a.nextUpdateDue).getTime() - new Date(b.nextUpdateDue).getTime();
    });

    acc[market] = {
      recentlyUpdated: sortedByUpdate,
      nextDue: sortedByDue.filter(c => c.nextUpdateDue) // Only include curves with due dates
    };

    return acc;
  }, {} as Record<string, MarketGroup>);

  const renderMarketRow = (market: string, curves: CurveScheduleWithRelations[], title: string) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-700">{market} - {title}</h3>
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex space-x-4 min-w-full">
          {curves.map(curve => (
            <div key={curve.id} className="w-80 flex-shrink-0">
              <CurveCard curve={curve as any} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* ERCOT Rows */}
      {renderMarketRow('ERCOT', marketGroups['ERCOT'].recentlyUpdated, 'Recently Updated')}
      {renderMarketRow('ERCOT', marketGroups['ERCOT'].nextDue, 'Next Due for Update')}

      {/* CAISO Rows */}
      {renderMarketRow('CAISO', marketGroups['CAISO'].recentlyUpdated, 'Recently Updated')}
      {renderMarketRow('CAISO', marketGroups['CAISO'].nextDue, 'Next Due for Update')}
    </div>
  );
} 