import { format } from 'date-fns';

export interface CurveTemplate {
  location: string;
  market: string;
  markCase: string;
  markType: string;
  granularity: string;
  curveCreator: string;
  markDate: string;
  valueType: string;
  markFundamentalsDesc: string;
  markModelTypeDesc: string;
  markDispatchOptimizationDesc: string;
  gridstorPurpose: string;
  curve_bess_duration: number | null;
}

export interface PricePoint {
  flow_date_start: string;
  value: number;
  curve_id?: string;
}

export interface ParsedCurve {
  curveDetails: CurveTemplate;
  pricePoints: PricePoint[];
}

export const generateMultiCurveTemplate = (templates: CurveTemplate[]): string => {
  let csv = '';

  // Add metadata section
  csv += '# Curve Definitions\n';
  csv += 'curve_id,location,market,mark_case,mark_type,granularity,curve_creator,mark_date,value_type,mark_fundamentals_desc,mark_model_type_desc,mark_dispatch_optimization_desc,gridstor_purpose,curve_bess_duration\n';

  // Add curve definitions
  templates.forEach((template, index) => {
    const curveId = `curve_${index + 1}`;
    csv += `${curveId},${template.location},${template.market},${template.markCase},${template.markType},${template.granularity},${template.curveCreator},${template.markDate},${template.valueType},${template.markFundamentalsDesc || ''},${template.markModelTypeDesc || ''},${template.markDispatchOptimizationDesc || ''},${template.gridstorPurpose || ''},${template.curve_bess_duration || ''}\n`;
  });

  // Add price data section
  csv += '\n# Price Data\n';
  csv += 'curve_id,flow_date_start,value\n';
  csv += '# Example:\n';
  
  // Add example data for each curve
  templates.forEach((_, index) => {
    const curveId = `curve_${index + 1}`;
    const today = new Date();
    csv += `${curveId},${format(today, 'yyyy-MM-dd')},100.00\n`;
    csv += `${curveId},${format(new Date(today.setDate(today.getDate() + 1)), 'yyyy-MM-dd')},101.00\n`;
  });

  return csv;
};

export const parseMultiCurveCSV = (csvContent: string): ParsedCurve[] => {
  const lines = csvContent.split('\n').map(line => line.trim());
  const curves: Map<string, ParsedCurve> = new Map();
  
  let currentSection = '';
  let headers: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('#')) {
      currentSection = line.toLowerCase();
      if (lines[i + 1]) {
        headers = lines[i + 1].split(',').map(h => h.trim());
      }
      i++; // Skip header line
      continue;
    }
    
    if (!line || line.length === 0) continue;
    
    if (currentSection.includes('curve definitions')) {
      const values = line.split(',').map(v => v.trim());
      const curveId = values[0];
      
      const curveDetails: CurveTemplate = {
        location: values[1],
        market: values[2],
        markCase: values[3],
        markType: values[4],
        granularity: values[5],
        curveCreator: values[6],
        markDate: values[7],
        valueType: values[8],
        markFundamentalsDesc: values[9],
        markModelTypeDesc: values[10],
        markDispatchOptimizationDesc: values[11],
        gridstorPurpose: values[12],
        curve_bess_duration: values[13] ? parseFloat(values[13]) : null
      };
      
      curves.set(curveId, {
        curveDetails,
        pricePoints: []
      });
    }
    
    if (currentSection.includes('price data')) {
      const [curveId, dateStr, valueStr] = line.split(',').map(v => v.trim());
      if (!curveId || !dateStr || !valueStr || curveId.startsWith('#')) continue;
      
      const curve = curves.get(curveId);
      if (curve) {
        curve.pricePoints.push({
          flow_date_start: dateStr,
          value: parseFloat(valueStr),
          curve_id: curveId
        });
      }
    }
  }
  
  return Array.from(curves.values());
};

export const validateParsedCurves = (curves: ParsedCurve[]): string[] => {
  const errors: string[] = [];
  
  curves.forEach((curve, index) => {
    const { curveDetails, pricePoints } = curve;
    
    // Required fields
    if (!curveDetails.location) errors.push(`Curve ${index + 1}: Missing location`);
    if (!curveDetails.market) errors.push(`Curve ${index + 1}: Missing market`);
    if (!curveDetails.markType) errors.push(`Curve ${index + 1}: Missing mark type`);
    if (!curveDetails.valueType) errors.push(`Curve ${index + 1}: Missing value type`);
    
    // Price data validation
    if (pricePoints.length === 0) {
      errors.push(`Curve ${index + 1}: No price points found`);
    } else {
      pricePoints.forEach((point, pointIndex) => {
        if (isNaN(point.value)) {
          errors.push(`Curve ${index + 1}, Point ${pointIndex + 1}: Invalid price value`);
        }
        if (point.value < 0 || point.value > 1000) {
          errors.push(`Curve ${index + 1}, Point ${pointIndex + 1}: Price must be between 0 and 1000`);
        }
        try {
          new Date(point.flow_date_start).toISOString();
        } catch {
          errors.push(`Curve ${index + 1}, Point ${pointIndex + 1}: Invalid date format`);
        }
      });
    }
  });
  
  return errors;
}; 