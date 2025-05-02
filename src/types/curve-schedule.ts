import type { CurveSchedule, CurveUpdateHistory, CurveComment, CurveReceipt } from '@prisma/client';
import type { CurveDefinition } from './curve-types';

export interface CurveScheduleWithRelations extends CurveSchedule {
  updateHistory: CurveUpdateHistory[];
  receipts: CurveReceipt[];
  comments: CurveComment[];
  curve?: CurveDefinition;
  // Additional fields from the database
  curveId?: number; // The ID of the associated curve
  freshnessStartDate: Date | null;
  freshnessEndDate: Date | null;
  nextUpdateDue: Date | null;
  lastUpdatedDate: Date | null;
  isActive: boolean;
}

export interface CurveDetailsProps {
  curve: CurveScheduleWithRelations;
}

export type CurveStatus = 'FRESH' | 'STALE' | 'OVERDUE' | 'NO_SCHEDULE';

// Documentation of the shape of data from Prisma
export type { CurveUpdateHistory as CurveUpdateHistoryEntry };
export type { CurveComment as CurveCommentEntry }; 