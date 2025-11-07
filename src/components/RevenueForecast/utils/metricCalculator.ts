/**
 * Calculate metrics from curve data
 * Extracts revenue components from commodities and scenarios
 */

interface DataPoint {
  timestamp: string;
  value: number;
  curveType?: string;
  commodity: string;
  scenario: string;
}

interface CalculatedMetrics {
  energyArb: string;
  as: string;
  cap: string;
  total: string;
  p95: string;
  p50: string;
  p05: string;
}

/**
 * Calculate metrics from curve data points
 * Aggregates by commodity and scenario to get summary values
 */
export function calculateMetrics(data: DataPoint[]): CalculatedMetrics {
  if (!data || data.length === 0) {
    return {
      energyArb: '$0.00',
      as: '$0.00',
      cap: '$0.00',
      total: '$0.00',
      p95: '$0.00',
      p50: '$0.00',
      p05: '$0.00'
    };
  }

  // Group by commodity and scenario
  const byCommodity: Record<string, number[]> = {};
  const byScenario: Record<string, number[]> = {};

  data.forEach(point => {
    // Aggregate by commodity
    const commodity = point.commodity.toLowerCase();
    if (!byCommodity[commodity]) {
      byCommodity[commodity] = [];
    }
    byCommodity[commodity].push(point.value);

    // Aggregate by scenario
    const scenario = point.scenario.toUpperCase();
    if (!byScenario[scenario]) {
      byScenario[scenario] = [];
    }
    byScenario[scenario].push(point.value);
  });

  // Calculate averages for commodities
  const avgValue = (values: number[]) => {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // Extract energy arbitrage (EA Revenue, Energy Arbitrage, etc.)
  let energyArb = 0;
  for (const [key, values] of Object.entries(byCommodity)) {
    if (key.includes('ea') || key.includes('energy') || key.includes('arbitrage')) {
      energyArb = avgValue(values);
      break;
    }
  }

  // Extract ancillary services (AS Revenue, Ancillary Services, etc.)
  let as = 0;
  for (const [key, values] of Object.entries(byCommodity)) {
    if (key.includes('as') || key.includes('ancillary')) {
      as = avgValue(values);
      break;
    }
  }

  // Extract capacity (Capacity Revenue, Cap, etc.)
  let cap = 0;
  for (const [key, values] of Object.entries(byCommodity)) {
    if (key.includes('cap') || key.includes('capacity')) {
      cap = avgValue(values);
      break;
    }
  }

  // Extract total revenue
  let total = 0;
  for (const [key, values] of Object.entries(byCommodity)) {
    if (key.includes('total')) {
      total = avgValue(values);
      break;
    }
  }

  // If no total found, sum the components
  if (total === 0) {
    total = energyArb + as + cap;
  }

  // Extract P-values
  const p95 = byScenario['P95'] ? avgValue(byScenario['P95']) : total * 1.15;
  const p50 = byScenario['P50'] ? avgValue(byScenario['P50']) : total;
  const p05 = byScenario['P05'] || byScenario['P5'] ? avgValue(byScenario['P05'] || byScenario['P5']) : total * 0.85;

  return {
    energyArb: '$' + energyArb.toFixed(2),
    as: '$' + as.toFixed(2),
    cap: '$' + cap.toFixed(2),
    total: '$' + total.toFixed(2),
    p95: '$' + p95.toFixed(2),
    p50: '$' + p50.toFixed(2),
    p05: '$' + p05.toFixed(2)
  };
}

/**
 * Generate mock metrics for testing/fallback
 */
export function generateMockMetrics(): CalculatedMetrics {
  const base = Math.random() * 10 + 5;
  const energyArb = base * 0.6;
  const as = base * 0.3;
  const cap = base * 0.1;
  const total = energyArb + as + cap;

  return {
    energyArb: '$' + energyArb.toFixed(2),
    as: '$' + as.toFixed(2),
    cap: '$' + cap.toFixed(2),
    total: '$' + total.toFixed(2),
    p95: '$' + (total * 1.15).toFixed(2),
    p50: '$' + total.toFixed(2),
    p05: '$' + (total * 0.85).toFixed(2)
  };
}

