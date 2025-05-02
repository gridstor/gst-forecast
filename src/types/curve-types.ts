import type { 
  CurveSchedule as PrismaCurveSchedule, 
  CurveUpdateHistory as PrismaCurveUpdateHistory,
  CurveReceipt,
  CurveSchedule
} from '@prisma/client';

export interface CurveDefinition {
  curve_id: number;
  mark_type: string | null;
  mark_case: string | null;
  mark_date: Date | null;
  location: string | null;
  market: string | null;
  curve_creator: string | null;
  mark_fundamentals_desc: string | null;
  mark_model_type_desc: string | null;
  mark_dispatch_optimization_desc: string | null;
  gridstor_purpose: string | null;
  value_type: string | null;
  created_at: Date | null;
  curve_start_date: Date | null;
  curve_end_date: Date | null;
  granularity: string | null;
  display_curves?: DisplayCurve[];
  price_forecasts?: PriceForecast[];
  schedule?: CurveScheduleWithRelations;
}

export interface DisplayCurve {
  display_id: number;
  curve_id: number;
  display_order: number | null;
  display_color: string | null;
  display_label: string | null;
  created_at: Date | null;
}

export interface EnhancedCurveDefinition extends CurveDefinition {
  // Additional properties for enhanced functionality
  is_currently_fresh: boolean;
  status: CurveStatus;
  formatted_identifier: string;
}

export interface CurveScheduleWithRelations extends PrismaCurveSchedule {
  updateHistory: PrismaCurveUpdateHistory[];
  receipts: CurveReceipt[];
  curve?: CurveDefinition;
  freshnessStartDate: Date | null;
  freshnessEndDate: Date | null;
  nextUpdateDue: Date | null;
}

export interface EnhancedCurveUpdateHistory {
  update_id: number;
  curve_id: number;
  update_date: Date;
  update_type: 'MANUAL' | 'AUTOMATED' | 'SCHEDULED';
  update_status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  update_source?: string;
  updated_by?: string;
  notes?: string;
  file_reference?: string;
}

export interface EnhancedCurveComment {
  comment_id: number;
  curve_id: number;
  user_name: string;
  comment_text: string;
  comment_date: Date;
  is_resolved: boolean;
  created_at: Date;
  created_by: string;
}

export interface EnhancedCurveSchedule extends PrismaCurveSchedule {
  schedule_id: number;
  curve_id: number;
  update_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  next_update_due?: Date;
  last_successful_update?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  freshness_start_date?: Date;
  freshness_end_date?: Date;
}

export interface PriceForecast {
  forecast_id: number;
  curve_id: number;
  mark_date: Date;
  delivery_date: Date;
  price: number;
  created_at: Date;
}

// Utility type for curve status
export type CurveStatus = 'FRESH' | 'STALE' | 'OVERDUE' | 'NO_SCHEDULE';

// Updated utility functions
export function getCurveStatus(curve: CurveDefinition): CurveStatus {
  if (!curve.schedule) return 'NO_SCHEDULE';
  
  const schedule = curve.schedule;
  if (!schedule.nextUpdateDue) return 'NO_SCHEDULE';
  
  const now = new Date();
  const dueDate = new Date(schedule.nextUpdateDue);
  
  if (schedule.freshnessStartDate && schedule.freshnessEndDate) {
    const start = new Date(schedule.freshnessStartDate);
    const end = new Date(schedule.freshnessEndDate);
    if (now >= start && now <= end) return 'FRESH';
    if (now > end) return 'STALE';
  }
  
  return dueDate < now ? 'OVERDUE' : 'FRESH';
}

export function formatCurveIdentifier(curve: CurveDefinition): string {
  return `${curve.mark_type || 'unknown'}-${curve.mark_case || 'unknown'}-${curve.location || 'unknown'}`;
}

export function isCurveFresh(curve: CurveDefinition): boolean {
  if (!curve.schedule) return false;
  
  const now = new Date();
  const start = curve.schedule.freshnessStartDate ? new Date(curve.schedule.freshnessStartDate) : null;
  const end = curve.schedule.freshnessEndDate ? new Date(curve.schedule.freshnessEndDate) : null;
  
  return start !== null && start <= now && (!end || end >= now);
} 