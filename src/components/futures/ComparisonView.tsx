import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CurveDateCalendar from './CurveDateCalendar';
import DateRangeSlider from './DateRangeSlider';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CurveData {
  success: boolean;
  data?: {
    tableData: Array<{
      market: string;
      [year: string]: number | string | null;
      tenYearStrip: number | null;
    }>;
    years: (number | string)[];
    markets: string[];
    peakHour?: string;
  };
  metadata?: {
    latestCurveDate: string | null;
    units: string;
    dateRange: string;
    dataSource: string;
    peakHour?: string;
  };
  message?: string;
  error?: string;
}

interface AvailableDatesData {
  success: boolean;
  data: {
    dates: string[];
    count: number;
  };
}

interface Props {
  contractTerm: 'Calendar' | 'Month';
}

interface SelectedCurve {
  id: string;
  date: string;
  curveType: 'gas' | 'power' | 'heat';
  peakHour: 'ON_PEAK' | '1800-2200' | 'ATC';
  hub: string;
  data: CurveData | null;
  loading: boolean;
}

const ComparisonView: React.FC<Props> = ({ contractTerm }) => {
  // Available dates
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Curve selection controls
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCurveType, setSelectedCurveType] = useState<'gas' | 'power' | 'heat'>('gas');
  const [selectedPeakHour, setSelectedPeakHour] = useState<'ON_PEAK' | '1800-2200' | 'ATC'>('ON_PEAK');
  const [selectedHub, setSelectedHub] = useState<string>('');
  
  // Multiple curves management
  const [selectedCurves, setSelectedCurves] = useState<SelectedCurve[]>([]);

  // Date range filter for chart
  const [dateRangeFilter, setDateRangeFilter] = useState<[number, number]>([0, 0]);

  // Fetch available dates on mount and when contract term changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`/api/futures/curve-dates?contractTerm=${contractTerm}`);
        const result: AvailableDatesData = await response.json();
        
        if (result.success) {
          setAvailableDates(result.data.dates);
        }
      } catch (err) {
        console.error('Error fetching available dates:', err);
      }
    };

    fetchAvailableDates();
    
    // Reset state when contract term changes
    setSelectedDate('');
    setSelectedCurves([]);
  }, [contractTerm]);

  // Add curve to the chart
  const handleAddCurve = async () => {
    if (!selectedDate || !selectedCurveType || !selectedHub) return;
    
    // Check if this exact curve already exists
    const curveId = `${selectedDate}-${selectedCurveType}-${selectedHub}-${selectedPeakHour}`;
    const existingCurve = selectedCurves.find(curve => curve.id === curveId);
    if (existingCurve) {
      alert('This curve is already added to the chart');
      return;
    }
    
    // Create new curve entry
    const newCurve: SelectedCurve = {
      id: curveId,
      date: selectedDate,
      curveType: selectedCurveType,
      peakHour: selectedPeakHour,
      hub: selectedHub,
      data: null,
      loading: true
    };
    
    // Add to curves list
    setSelectedCurves(prev => [...prev, newCurve]);
    
    // Fetch data for this curve
    try {
      const endpoint = getApiEndpoint(selectedCurveType, selectedDate, selectedPeakHour);
      const response = await fetch(endpoint);
      const result: CurveData = await response.json();
      
      // Update the curve with fetched data
      setSelectedCurves(prev => 
        prev.map(curve => 
          curve.id === curveId 
            ? { ...curve, data: result.success ? result : null, loading: false }
            : curve
        )
      );
      
    } catch (err) {
      console.error('Error fetching curve data:', err);
      // Update curve to show error state
      setSelectedCurves(prev => 
        prev.map(curve => 
          curve.id === curveId 
            ? { ...curve, data: null, loading: false }
            : curve
        )
      );
    }
  };

  // Remove curve from chart
  const handleRemoveCurve = (curveId: string) => {
    setSelectedCurves(prev => prev.filter(curve => curve.id !== curveId));
  };

  // Remove all curves from chart
  const handleRemoveAllCurves = () => {
    setSelectedCurves([]);
  };

  // Format date for display in selected curves
  const formatDateForDisplay = (dateStr: string) => {
    // Parse YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 because Date constructor uses 0-based months
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getApiEndpoint = (curveType: string, date: string, peakHour?: string) => {
    const peakParam = (curveType === 'power' || curveType === 'heat') ? `&peakHour=${peakHour}` : '';
    const contractParam = `&contractTerm=${contractTerm}`;
    
    switch (curveType) {
      case 'gas':
        return `/api/futures/natural-gas?date=${date}${contractParam}`;
      case 'power':
        return `/api/futures/power?date=${date}${peakParam}${contractParam}`;
      case 'heat':
        return `/api/futures/heat-rate?date=${date}${peakParam}${contractParam}`;
      default:
        return '';
    }
  };

  const getCurveTypeLabel = (curveType: string) => {
    switch (curveType) {
      case 'gas': return 'Natural Gas Futures';
      case 'power': return 'Power Futures';
      case 'heat': return 'Heat Rate Futures';
      default: return 'Futures';
    }
  };

  const getCurveTypeUnits = (curveType: string) => {
    switch (curveType) {
      case 'gas': return '$/MMBtu';
      case 'power': return '$/MWh';
      case 'heat': return 'MMBtu/MWh';
      default: return '';
    }
  };

  const getCurveColor = (curve: SelectedCurve) => {
    // Generate distinct color for each curve
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#84CC16'];
    const index = selectedCurves.findIndex(c => c.id === curve.id);
    return colors[index % colors.length];
  };

  const getHubOptions = (curveType: 'gas' | 'power' | 'heat') => {
    if (curveType === 'gas') {
      return [
        { value: 'HSC', label: 'HSC' },
        { value: 'Katy', label: 'Katy' },
        { value: 'Waha', label: 'Waha' },
        { value: 'Henry', label: 'Henry' },
        { value: 'El Paso', label: 'El Paso' },
        { value: 'SoCal Citygate', label: 'SoCal Citygate' },
      ];
    } else {
      // Power and Heat Rate use the same hubs
      return [
        { value: 'Houston', label: 'Houston' },
        { value: 'ERCOT South', label: 'ERCOT South' },
        { value: 'ERCOT North', label: 'ERCOT North' },
        { value: 'ERCOT West', label: 'ERCOT West' },
        { value: 'SP 15', label: 'SP 15' },
      ];
    }
  };

  // Helper function to get available years from selected curves
  const getAvailableYears = (): (string | number)[] => {
    const curvesWithData = selectedCurves.filter(curve => curve.data?.data);
    if (curvesWithData.length === 0) return [];
    
    const firstCurve = curvesWithData[0];
    return firstCurve.data?.data?.years || [];
  };

  const renderMultiCurveChart = () => {
    if (selectedCurves.length === 0) return null;

    // Get all curves with data
    const curvesWithData = selectedCurves.filter(curve => curve.data?.data);
    if (curvesWithData.length === 0) return null;

    // Use the first curve to determine years structure
    const firstCurve = curvesWithData[0];
    const allYears = firstCurve.data?.data?.years || [];
    
    // Initialize date range filter to full range if not set
    if (dateRangeFilter[1] === 0 && allYears.length > 0) {
      setDateRangeFilter([0, allYears.length - 1]);
    }
    
    // Filter years based on date range selection
    const years = allYears.slice(dateRangeFilter[0], dateRangeFilter[1] + 1);
    
    const datasets: any[] = [];

    // Add datasets for each selected curve (only the selected hub)
    curvesWithData.forEach((curve) => {
      if (!curve.data?.data?.tableData) return;

      // Find the specific hub row for this curve
      const hubRow = curve.data.data.tableData.find(row => row.market === curve.hub);
      if (!hubRow) return;

      const data = years.map((year, index) => {
        const actualYearIndex = dateRangeFilter[0] + index;
        const actualYear = allYears[actualYearIndex];
        const price = hubRow[actualYear.toString()];
        return typeof price === 'number' ? price : null;
      });

      // Create unique line for this specific curve with distinct color
      const curveColor = getCurveColor(curve);

      datasets.push({
        label: `${curve.hub} (${formatDateForDisplay(curve.date)})`,
        data: data,
        borderColor: curveColor,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [], // All solid lines
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
      });
    });

    const chartData = {
      labels: years,
      datasets: datasets
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // We have our own hub toggles
        },
        title: {
          display: false,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleFont: {
            family: 'Inter, sans-serif',
            size: 12,
          },
          bodyFont: {
            family: 'JetBrains Mono, monospace',
            size: 11,
          },
          callbacks: {
            label: function(context: any) {
              const value = context.parsed.y;
              if (value === null) return undefined;
              return `${context.dataset.label}: $${value.toFixed(2)}`;
            }
          }
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: contractTerm === 'Calendar' ? 'Year' : 'Month',
            font: {
              family: 'Inter, sans-serif',
              size: 12,
              weight: 500,
            },
          },
          grid: {
            color: '#E5E7EB',
          },
          ticks: {
            maxRotation: contractTerm === 'Month' ? 45 : 0, // Rotate labels for Month contracts
          },
        },
        y: {
          title: {
            display: true,
            text: `Price (${curvesWithData.length > 0 ? getCurveTypeUnits(curvesWithData[0].curveType) : ''})`,
            font: {
              family: 'Inter, sans-serif',
              size: 12,
              weight: 500,
            },
          },
          grid: {
            color: '#E5E7EB',
          },
          ticks: {
            callback: function(value: any) {
              return '$' + Number(value).toFixed(2);
            },
            font: {
              family: 'JetBrains Mono, monospace',
              size: 11,
            },
          },
        },
      },
      elements: {
        point: {
          borderWidth: 0,
        },
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
    };

    return <Line data={chartData} options={options} />;
  };

  return (
    <div className="space-y-6">
      {/* Curve Selection Controls */}
      <div className="bg-white rounded-lg border border-gray-200 border-l-4 p-6" style={{ borderLeftColor: '#3B82F6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4">Curve Selection</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Mark Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mark Date</label>
            <CurveDateCalendar
              selectedDate={selectedDate}
              availableDates={availableDates}
              onChange={setSelectedDate}
              disabled={false}
              placeholder="Select Date"
            />
          </div>

          {/* Curve Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curve Type</label>
            <select
              value={selectedCurveType}
              onChange={(e) => setSelectedCurveType(e.target.value as 'gas' | 'power' | 'heat')}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="gas">Natural Gas</option>
              <option value="power">Power</option>
              <option value="heat">Heat Rate</option>
            </select>
          </div>

          {/* Settlement Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Point</label>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="">Select Settlement Point</option>
              {getHubOptions(selectedCurveType).map(hub => (
                <option key={hub.value} value={hub.value}>{hub.label}</option>
              ))}
            </select>
          </div>

          {/* Peak Hour (only for power/heat) */}
          {(selectedCurveType === 'power' || selectedCurveType === 'heat') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peak Hour</label>
              <select
                value={selectedPeakHour}
                onChange={(e) => setSelectedPeakHour(e.target.value as 'ON_PEAK' | '1800-2200' | 'ATC')}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white"
              >
                <option value="ON_PEAK">0700-2200</option>
                <option value="1800-2200">1800-2200</option>
                <option value="ATC">ATC</option>
              </select>
            </div>
          )}

          {/* Add Curve Button */}
          <div className="flex items-end">
            <button
              onClick={handleAddCurve}
              disabled={!selectedDate || !selectedHub}
              className={`w-full px-4 py-2 text-sm font-medium rounded transition-colors ${
                (selectedDate && selectedHub) 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add Curve
            </button>
          </div>
        </div>
      </div>

       {/* Line Chart - Main Feature */}
       <div className="bg-white rounded-lg border border-gray-200 border-l-4 p-6" style={{ borderLeftColor: '#8B5CF6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
         <div className="space-y-4">
           {/* Chart Header */}
           <div>
             <h3 className="text-lg font-semibold text-[#2A2A2A]">Multi-Curve Comparison Chart</h3>
            <p className="text-sm text-gray-600">
              {selectedCurves.length} curve{selectedCurves.length > 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Chart */}
          <div className="h-96">
            {selectedCurves.length > 0 ? (
              renderMultiCurveChart()
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900">No curves selected</h4>
                  <p className="mt-1 text-sm text-gray-500">Add curves using the controls above to start comparing</p>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Slider */}
          {selectedCurves.length > 0 && getAvailableYears().length > 0 && (
            <div className="mt-4">
              <DateRangeSlider
                availableDates={getAvailableYears()}
                selectedRange={dateRangeFilter}
                onRangeChange={setDateRangeFilter}
                contractTerm={contractTerm}
              />
            </div>
          )}
        </div>
      </div>

       {/* Selected Curves Management */}
       <div className="bg-white rounded-lg border border-gray-200 border-l-4 p-6" style={{ borderLeftColor: '#10B981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-semibold text-[#2A2A2A]">Selected Curves</h3>
          {selectedCurves.length > 0 && (
            <button
              onClick={handleRemoveAllCurves}
              className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors border border-red-300"
            >
              Remove All
            </button>
          )}
        </div>
        
        {selectedCurves.length > 0 ? (
          <div className="space-y-3">
            {selectedCurves.map(curve => (
              <div key={curve.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-1 rounded"
                      style={{ backgroundColor: getCurveColor(curve) }}
                    />
                    <span className="font-medium text-[#2A2A2A]">
                      {curve.hub}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {getCurveTypeLabel(curve.curveType)} • {formatDateForDisplay(curve.date)}
                    {(curve.curveType === 'power' || curve.curveType === 'heat') && 
                      ` • ${curve.peakHour === 'ON_PEAK' ? '0700-2200' : curve.peakHour === '1800-2200' ? '1800-2200' : 'ATC'}`
                    }
                  </span>
                  {curve.loading && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCurve(curve.id)}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500">No curves selected</div>
            <div className="text-sm text-gray-400 mt-1">Use the curve selection controls above to add curves to the chart</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonView;
