export type Market = string;
export type Granularity = 'monthly' | 'annual';

export interface LocationOption {
  id: string;
  name: string;
  market: Market;
  active: boolean;
}

export interface CurveData {
  date: string;
  value: number;
  curveId: number;
  mark_type: string;
  mark_case: string;
  mark_date: string;
  location: string;
  curve_creator: string;
}

export interface CurveDefinition {
  curve_id: number;
  market: Market;
  location: string;
  mark_case: string;
  mark_date: Date;
  mark_type: string;
  granularity: Granularity;
  is_default: boolean;
  display_order?: number;
  curve_creator: string;
}

export interface PriceForecast {
  FlowDateStart: string;
  Value: number | null;
  MarkType: string;
  MarkCase: string;
}

export interface SavedView {
  view_id?: number;
  name: string;
  curves: number[];
  dateRange: {
    start: Date;
    end: Date;
  };
  aggregation: 'monthly' | 'annual';
}