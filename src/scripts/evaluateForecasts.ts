import { fetchLocations, fetchCurvesByLocation, fetchCurveData, fetchDefaultCurves } from '../lib/api-client';
import type { CurveData } from '../lib/types';

/**
 * Evaluate Forecast Script
 * This script demonstrates an end-to-end process for retrieving and evaluating forecast curves.
 */

async function main() {
  try {
    console.log('Starting forecast evaluation process...');
    
    // Step 1: Fetch available locations
    console.log('Fetching available locations...');
    const locations = await fetchLocations();
    console.log(`Found ${locations.length} locations: ${locations.map(l => l.name).join(', ')}`);
    
    if (locations.length === 0) {
      console.error('No locations found. Exiting.');
      return;
    }
    
    // For this example, we'll use the first location
    const location = locations[0];
    console.log(`Selected location: ${location.name} (${location.market})`);
    
    // Step 2: Fetch default curves for this location to evaluate
    console.log(`Fetching default curves for ${location.name}...`);
    const defaultCurves = await fetchDefaultCurves(location.id);
    console.log(`Found ${defaultCurves.monthly.length} monthly curves and ${defaultCurves.annual.length} annual curves`);
    
    // Step 3: Fetch all available curves for this location
    console.log(`Fetching all curves for ${location.name}...`);
    const allCurves = await fetchCurvesByLocation(location.id);
    console.log(`Found ${allCurves.length} total curves`);
    
    // Initialize variables for monthly and annual data
    let monthlyData: CurveData[] = [];
    let annualData: CurveData[] = [];
    
    // Step 4: Fetch monthly data for evaluation
    if (defaultCurves.monthly.length > 0) {
      console.log('Fetching monthly data for evaluation...');
      monthlyData = await fetchCurveData({
        curveIds: defaultCurves.monthly,
        aggregation: 'monthly'
      });
      
      console.log(`Retrieved ${monthlyData.length} monthly data points`);
      console.log('Sample monthly data:');
      console.log(monthlyData.slice(0, 5));
      
      // Step 5: Calculate basic statistics for monthly data
      if (monthlyData.length > 0) {
        // Group by curve ID
        const groupedByMonth = monthlyData.reduce((acc, point) => {
          if (!acc[point.curveId]) {
            acc[point.curveId] = [];
          }
          acc[point.curveId].push(point);
          return acc;
        }, {} as Record<number, CurveData[]>);
        
        // Calculate statistics for each curve
        console.log('\nMonthly Curve Statistics:');
        Object.entries(groupedByMonth).forEach(([curveId, points]) => {
          const values = points.map(p => p.value);
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const curve = allCurves.find(c => c.curve_id === Number(curveId));
          
          console.log(`Curve ID: ${curveId} - ${curve?.mark_case} (${curve?.curve_creator})`);
          console.log(`  Data Points: ${points.length}`);
          console.log(`  Average: $${avg.toFixed(2)}/kw-mn`);
          console.log(`  Min: $${min.toFixed(2)}/kw-mn`);
          console.log(`  Max: $${max.toFixed(2)}/kw-mn`);
          console.log(`  Range: $${(max - min).toFixed(2)}/kw-mn`);
        });
      }
    }
    
    // Step 6: Fetch annual data for evaluation
    if (defaultCurves.annual.length > 0) {
      console.log('\nFetching annual data for evaluation...');
      annualData = await fetchCurveData({
        curveIds: defaultCurves.annual,
        aggregation: 'annual'
      });
      
      console.log(`Retrieved ${annualData.length} annual data points`);
      console.log('Sample annual data:');
      console.log(annualData.slice(0, 5));
      
      // Step 7: Calculate basic statistics for annual data
      if (annualData.length > 0) {
        // Group by curve ID
        const groupedByYear = annualData.reduce((acc, point) => {
          if (!acc[point.curveId]) {
            acc[point.curveId] = [];
          }
          acc[point.curveId].push(point);
          return acc;
        }, {} as Record<number, CurveData[]>);
        
        // Calculate statistics for each curve
        console.log('\nAnnual Curve Statistics:');
        Object.entries(groupedByYear).forEach(([curveId, points]) => {
          const values = points.map(p => p.value);
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const curve = allCurves.find(c => c.curve_id === Number(curveId));
          
          console.log(`Curve ID: ${curveId} - ${curve?.mark_case} (${curve?.curve_creator})`);
          console.log(`  Data Points: ${points.length}`);
          console.log(`  Average: $${avg.toFixed(2)}/kw-yr`);
          console.log(`  Min: $${min.toFixed(2)}/kw-yr`);
          console.log(`  Max: $${max.toFixed(2)}/kw-yr`);
          console.log(`  Range: $${(max - min).toFixed(2)}/kw-yr`);
        });
      }
    }
    
    // Step 8: Example of how to compare two forecasts if multiple are available
    if (defaultCurves.monthly.length > 1) {
      console.log('\nComparing multiple forecasts:');
      
      const firstCurveId = defaultCurves.monthly[0];
      const secondCurveId = defaultCurves.monthly[1];
      
      const firstCurveData = monthlyData.filter(p => p.curveId === firstCurveId);
      const secondCurveData = monthlyData.filter(p => p.curveId === secondCurveId);
      
      // Find matching dates for comparison
      const firstCurveDates = new Set(firstCurveData.map(p => p.date));
      const secondCurveDates = new Set(secondCurveData.map(p => p.date));
      
      // Intersection of dates
      const commonDates = [...firstCurveDates].filter(date => secondCurveDates.has(date));
      
      if (commonDates.length > 0) {
        console.log(`Found ${commonDates.length} common dates for comparison`);
        
        // Calculate differences
        let totalDiff = 0;
        let absTotal = 0;
        
        commonDates.forEach(date => {
          const firstPoint = firstCurveData.find(p => p.date === date);
          const secondPoint = secondCurveData.find(p => p.date === date);
          
          if (firstPoint && secondPoint) {
            const diff = firstPoint.value - secondPoint.value;
            totalDiff += diff;
            absTotal += Math.abs(diff);
            
            console.log(`Date: ${new Date(date).toLocaleDateString()}`);
            console.log(`  ${firstPoint.curve_creator}: $${firstPoint.value.toFixed(2)}/kw-mn`);
            console.log(`  ${secondPoint.curve_creator}: $${secondPoint.value.toFixed(2)}/kw-mn`);
            console.log(`  Difference: $${diff.toFixed(2)}/kw-mn (${(diff / secondPoint.value * 100).toFixed(2)}%)`);
          }
        });
        
        // Summary statistics
        const avgDiff = totalDiff / commonDates.length;
        const absAvgDiff = absTotal / commonDates.length;
        
        console.log('\nComparison Summary:');
        console.log(`  Average Difference: $${avgDiff.toFixed(2)}/kw-mn`);
        console.log(`  Average Absolute Difference: $${absAvgDiff.toFixed(2)}/kw-mn`);
      } else {
        console.log('No common dates found for comparison');
      }
    }
    
    console.log('\nForecast evaluation complete.');
    
  } catch (error) {
    console.error('Error during forecast evaluation:', error);
  }
}

main(); 