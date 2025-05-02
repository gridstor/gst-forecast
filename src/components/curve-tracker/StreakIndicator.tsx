import type { CurveUpdateHistory } from '@prisma/client';

interface StreakIndicatorProps {
  updateHistory: CurveUpdateHistory[];
  width?: number; // Width in pixels
  maxDays?: number; // Number of days to show in the streak
}

export default function StreakIndicator({ 
  updateHistory, 
  width = 200, 
  maxDays = 180 // Show 6 months by default
}: StreakIndicatorProps) {
  const now = new Date();
  const startDate = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000);
  
  // Sort updates by date
  const sortedUpdates = [...updateHistory].sort((a, b) => 
    new Date(a.updateDate).getTime() - new Date(b.updateDate).getTime()
  );

  // Filter updates within the time range
  const relevantUpdates = sortedUpdates.filter(update => 
    new Date(update.updateDate) >= startDate && new Date(update.updateDate) <= now
  );

  // Calculate positions for each update dot
  const updatePositions = relevantUpdates.map(update => {
    const updateDate = new Date(update.updateDate);
    const position = ((updateDate.getTime() - startDate.getTime()) / (now.getTime() - startDate.getTime())) * width;
    return {
      position,
      date: updateDate,
      status: update.status,
      notes: update.notes
    };
  });

  return (
    <div className="relative" style={{ width: `${width}px`, height: '20px' }}>
      {/* Background track */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2" />
      
      {/* Update dots */}
      {updatePositions.map((update, index) => (
        <div
          key={index}
          className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full 
            ${update.status === 'on_time' ? 'bg-green-500' : 'bg-red-500'}
            hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 transition-all cursor-help`}
          style={{ left: `${update.position}px` }}
          title={`${update.date.toLocaleDateString()}${update.notes ? ` - ${update.notes}` : ''}`}
        />
      ))}

      {/* Time markers */}
      <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
        {startDate.toLocaleDateString()}
      </div>
      <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
        {now.toLocaleDateString()}
      </div>
    </div>
  );
} 