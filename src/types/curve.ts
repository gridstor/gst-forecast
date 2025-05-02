import type { 
  CurveSchedule as PrismaCurveSchedule, 
  CurveUpdateHistory as PrismaCurveUpdateHistory, 
  CurveReceipt 
} from '@prisma/client';

export interface CurveScheduleWithFreshness extends PrismaCurveSchedule {
  freshnessStartDate?: Date | null;
  freshnessEndDate?: Date | null;
}

export interface CurveScheduleWithRelations extends CurveScheduleWithFreshness {
  updateHistory: PrismaCurveUpdateHistory[];
  receipts: CurveReceipt[];
  _count: {
    comments: number;
  };
}

export interface CurveDefinition {
  curve_id: number;
  mark_type: string;
  mark_case: string;
  location: string;
  granularity: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  last_received_date?: Date;
  next_expected_date?: Date;
  freshness_start_date?: Date;
  freshness_end_date?: Date;
  is_currently_fresh: boolean;
}

export interface PriceForecast {
  forecast_id: number;
  curve_id: number;
  mark_date: Date;
  delivery_date: Date;
  price: number;
  created_at: Date;
}

export interface CurveUpdateHistory {
  update_id: number;
  curve_id: number;
  update_date: Date;
  update_type: 'MANUAL' | 'AUTOMATED' | 'SCHEDULED';
  update_status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  update_source?: string;
  updated_by?: string;
  notes?: string;
}

export interface CurveComment {
  comment_id: number;
  curve_id: number;
  comment_text: string;
  created_at: Date;
  created_by: string;
}

export interface CurveSchedule {
  schedule_id: number;
  curve_id: number;
  update_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  next_update_due?: Date;
  last_successful_update?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CurveWithRelations extends CurveDefinition {
  price_forecasts?: PriceForecast[];
  update_history?: CurveUpdateHistory[];
  comments?: CurveComment[];
  schedule?: CurveSchedule;
}

// Utility type for curve status
export type CurveStatus = 'FRESH' | 'STALE' | 'OVERDUE' | 'NO_SCHEDULE';

// Utility functions
export function getCurveStatus(curve: CurveDefinition): CurveStatus {
  if (!curve.next_expected_date) return 'NO_SCHEDULE';
  if (!curve.is_currently_fresh) return 'STALE';
  
  const now = new Date();
  const dueDate = new Date(curve.next_expected_date);
  return dueDate < now ? 'OVERDUE' : 'FRESH';
}

export function formatCurveIdentifier(curve: CurveDefinition): string {
  return `${curve.mark_type}-${curve.mark_case}-${curve.location}`;
}

export function isCurveFresh(curve: CurveDefinition): boolean {
  if (!curve.freshness_start_date) return false;
  
  const now = new Date();
  const start = new Date(curve.freshness_start_date);
  const end = curve.freshness_end_date ? new Date(curve.freshness_end_date) : null;
  
  return start <= now && (!end || end >= now);
} 