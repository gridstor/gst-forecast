import type { 
  CurveSchedule as PrismaCurveSchedule,
  CurveUpdateHistory as PrismaCurveUpdateHistory,
  CurveReceipt as PrismaCurveReceipt,
  CurveComment as PrismaCurveComment,
  curve_definitions
} from '@prisma/client';

// Base types extending Prisma models
export interface CurveDefinition extends curve_definitions {
  display_curves?: DisplayCurve[];
  price_forecasts?: PriceForecast[];
  schedules?: CurveScheduleWithRelations[];
}

// CamelCase version of CurveDefinition for frontend use
export interface CamelCaseCurveDefinition {
  curveId: number;
  markType: string | null;
  markCase: string | null;
  markDate: Date | null;
  location: string | null;
  market: string | null;
  curveCreator: string | null;
  markFundamentalsDesc: string | null;
  markModelTypeDesc: string | null;
  markDispatchOptimizationDesc: string | null;
  gridstorPurpose: string | null;
  valueType: string | null;
  createdAt: Date | null;
  curveStartDate: Date | null;
  curveEndDate: Date | null;
  granularity: string | null;
  displayCurves?: DisplayCurve[];
  priceForcasts?: PriceForecast[];
  schedules?: CurveScheduleWithRelations[];
}

// Utility function to convert snake_case to camelCase
export function toCamelCase(curve: CurveDefinition): CamelCaseCurveDefinition {
  return {
    curveId: curve.curve_id,
    markType: curve.mark_type,
    markCase: curve.mark_case,
    markDate: curve.mark_date,
    location: curve.location,
    market: curve.market,
    curveCreator: curve.curve_creator,
    markFundamentalsDesc: curve.mark_fundamentals_desc,
    markModelTypeDesc: curve.mark_model_type_desc,
    markDispatchOptimizationDesc: curve.mark_dispatch_optimization_desc,
    gridstorPurpose: curve.gridstor_purpose,
    valueType: curve.value_type,
    createdAt: curve.created_at,
    curveStartDate: curve.curve_start_date,
    curveEndDate: curve.curve_end_date,
    granularity: curve.granularity,
    displayCurves: curve.display_curves,
    priceForcasts: curve.price_forecasts,
    schedules: curve.schedules
  };
}

// Utility function to convert camelCase to snake_case
export function toSnakeCase(curve: CamelCaseCurveDefinition): Omit<CurveDefinition, 'display_curves' | 'price_forecasts' | 'schedules'> {
  return {
    curve_id: curve.curveId,
    mark_type: curve.markType,
    mark_case: curve.markCase,
    mark_date: curve.markDate,
    location: curve.location,
    market: curve.market,
    curve_creator: curve.curveCreator,
    mark_fundamentals_desc: curve.markFundamentalsDesc,
    mark_model_type_desc: curve.markModelTypeDesc,
    mark_dispatch_optimization_desc: curve.markDispatchOptimizationDesc,
    gridstor_purpose: curve.gridstorPurpose,
    value_type: curve.valueType,
    created_at: curve.createdAt,
    curve_start_date: curve.curveStartDate,
    curve_end_date: curve.curveEndDate,
    granularity: curve.granularity
  };
}

export interface CurveSchedule extends PrismaCurveSchedule {
  freshnessStartDate: Date | null;
  freshnessEndDate: Date | null;
  isActive: boolean;
  market: string | null;
}

export interface CurveUpdateHistory extends PrismaCurveUpdateHistory {
  updateDate: Date;
  updatedBy: string;
  notes: string | null;
  status: string;
  fileReference: string | null;
}

export interface CurveReceipt extends PrismaCurveReceipt {
  receivedBy: string;
  providerContact: string | null;
  fileReference: string | null;
  processingStatus: string;
  notes: string | null;
  receivedDate: Date;
}

export interface CurveComment extends PrismaCurveComment {
  userName: string;
  commentText: string;
  isResolved: boolean;
  createdBy: string;
  commentDate: Date;
}

// Extended types with relationships
export interface CurveScheduleWithRelations extends CurveSchedule {
  updateHistory: CurveUpdateHistory[];
  receipts: CurveReceipt[];
  comments: CurveComment[];
  curve?: CurveDefinition | null;
}

export interface CurveDefinitionWithRelations extends CurveDefinition {
  displayCurves: DisplayCurve[];
  priceForcasts: PriceForecast[];
  schedules: CurveScheduleWithRelations[];
}

// Supporting types
export interface DisplayCurve {
  displayId: number;
  curveId: number;
  displayOrder: number | null;
  displayColor: string | null;
  displayLabel: string | null;
  createdAt: Date;
}

export interface PriceForecast {
  id: number;
  curveId: number;
  markDate: Date;
  flowDateStart: Date;
  value: number;
  units: string | null;
  location: string | null;
  markCase: string | null;
  curveCreator: string | null;
  valueType: string | null;
  createdAt: Date;
}

// Utility types
export type CurveStatus = 'FRESH' | 'STALE' | 'OVERDUE' | 'NO_SCHEDULE';

// Utility functions
export function getCurveStatus(curve: CurveDefinition): CurveStatus {
  if (!curve.schedules || curve.schedules.length === 0) return 'NO_SCHEDULE';
  
  const schedule = curve.schedules[0];
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
  if (!curve.schedules || curve.schedules.length === 0) return false;
  
  const schedule = curve.schedules[0];
  if (!schedule.freshnessStartDate) return false;
  
  const now = new Date();
  const start = new Date(schedule.freshnessStartDate);
  const end = schedule.freshnessEndDate ? new Date(schedule.freshnessEndDate) : null;
  
  return start <= now && (!end || end >= now);
} 