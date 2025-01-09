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
  mark_type: string;
  mark_case: string;
  mark_date: Date;
  location: string;
  market: string;
  curve_creator: string;
  mark_fundamentals_desc?: string;
  mark_model_type_desc?: string;
  mark_dispatch_optimization_desc?: string;
  gridstor_purpose?: string;
  value_type?: string;
  granularity: string;
  curve_start_date?: Date;
  curve_end_date?: Date;
  created_at: Date;
  is_default?: boolean;
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