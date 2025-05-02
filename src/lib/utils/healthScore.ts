import { differenceInDays, isAfter, isBefore } from 'date-fns';

export interface CurveHealthMetrics {
  lastReceivedDate: Date | null;
  nextExpectedDate: Date | null;
  updateHistory: Array<{
    expectedDate: Date;
    actualDate: Date | null;
  }>;
  dataQualityScore?: number; // Optional quality score from 0-100
}

export interface HealthScoreComponents {
  freshnessScore: number;
  complianceScore: number;
  qualityScore: number;
  totalScore: number;
}

const calculateFreshnessScore = (lastUpdate: Date | null, expectedDate: Date): number => {
  if (!lastUpdate) return 0;
  
  const today = new Date();
  if (isAfter(today, expectedDate)) {
    // Curve is overdue
    const daysOverdue = differenceInDays(today, expectedDate);
    return Math.max(0, 100 - (daysOverdue * 10)); // Lose 10 points per day overdue
  }
  
  // Curve is up to date
  return 100;
};

const calculateComplianceScore = (updateHistory: CurveHealthMetrics['updateHistory']): number => {
  if (updateHistory.length === 0) return 0;
  
  const scores = updateHistory.map(update => {
    if (!update.actualDate) return 0;
    
    const daysLate = differenceInDays(update.actualDate, update.expectedDate);
    if (daysLate <= 0) return 100; // On time or early
    if (daysLate <= 1) return 90; // 1 day late
    if (daysLate <= 2) return 75; // 2 days late
    if (daysLate <= 5) return 50; // 3-5 days late
    return 25; // More than 5 days late
  });
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};

export const calculateHealthScore = (metrics: CurveHealthMetrics): HealthScoreComponents => {
  const freshnessScore = metrics.lastReceivedDate && metrics.nextExpectedDate
    ? calculateFreshnessScore(metrics.lastReceivedDate, metrics.nextExpectedDate)
    : 0;
    
  const complianceScore = calculateComplianceScore(metrics.updateHistory);
  
  // Use provided quality score or default to 100 if not available
  const qualityScore = metrics.dataQualityScore ?? 100;
  
  // Calculate total score with weights:
  // - Freshness: 40%
  // - Compliance: 40%
  // - Quality: 20%
  const totalScore = Math.round(
    (freshnessScore * 0.4) +
    (complianceScore * 0.4) +
    (qualityScore * 0.2)
  );
  
  return {
    freshnessScore,
    complianceScore,
    qualityScore,
    totalScore
  };
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export const getHealthScoreLabel = (score: number): string => {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Warning';
  if (score >= 40) return 'At Risk';
  return 'Critical';
}; 