import React, { useState, useCallback } from 'react';
import { format, parse, isValid } from 'date-fns';
import { toast } from 'react-hot-toast';

interface PricePoint {
  flow_date_start: Date;
  value: number;
}

interface CurveDetails {
  location: string;
  market: string;
  mark_case: string;
  mark_type: string;
  granularity: 'MONTHLY' | 'ANNUAL';
  curve_creator: string;
  mark_date: string;
  mark_fundamentals_desc?: string;
  mark_model_type_desc?: string;
  mark_dispatch_optimization_desc?: string;
  gridstor_purpose?: string;
  value_type: string;
}

const StepByStepUploader: React.FC = () => {
  const [step, setStep] = useState(1);
  const [curveDetails, setCurveDetails] = useState<CurveDetails>({
    location: '',
    market: '',
    mark_case: 'Base',
    mark_type: '',
    granularity: 'ANNUAL',
    curve_creator: '',
    mark_date: format(new Date(), 'yyyy-MM-dd'),
    value_type: 'Price'
  });
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [rawPriceInput, setRawPriceInput] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  // Validation functions
  const validatePriceData = (prices: PricePoint[]): { isValid: boolean; message: string } => {
    if (!prices.length) {
      return { isValid: false, message: 'No price data provided' };
    }

    const MIN_PRICE = -1000;
    const MAX_PRICE = 1000;

    // Sort prices by date
    prices.sort((a, b) => a.flow_date_start.getTime() - b.flow_date_start.getTime());

    // Date range check
    const dateRange = (prices[prices.length - 1].flow_date_start.getTime() - 
                      prices[0].flow_date_start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (dateRange > 50) {
      return { isValid: false, message: `Date range too large: ${dateRange.toFixed(1)} years` };
    }

    // Price range and jump checks
    let warnings: string[] = [];
    for (let i = 0; i < prices.length; i++) {
      const value = prices[i].value;
      if (value < MIN_PRICE || value > MAX_PRICE) {
        return { isValid: false, message: `Price value out of reasonable range at position ${i + 1}: ${value}` };
      }

      if (i > 0) {
        const prevValue = prices[i - 1].value;
        const ratio = prevValue !== 0 ? Math.abs(value / prevValue) : Math.abs(value) > 0 ? Infinity : 1;
        if (ratio > 5) {
          warnings.push(`Large price jump detected between ${format(prices[i - 1].flow_date_start, 'yyyy-MM-dd')} and ${format(prices[i].flow_date_start, 'yyyy-MM-dd')}: ${prevValue} -> ${value}`);
        }
      }
    }

    if (warnings.length > 0) {
      toast.warning(warnings.join('\n'));
    }

    return { isValid: true, message: 'Validation passed' };
  };

  const parsePriceData = (input: string): PricePoint[] => {
    const lines = input.trim().split('\n');
    const prices: PricePoint[] = [];
    const dateFormats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'dd/MM/yyyy', 'yyyy/MM/dd'];

    for (let i = 1; i < lines.length; i++) { // Skip header row
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[\s,]+/).filter(Boolean);
      if (parts.length < 2) continue;

      let date: Date | null = null;
      const dateStr = parts[0];
      
      // Try different date formats
      for (const format of dateFormats) {
        const parsedDate = parse(dateStr, format, new Date());
        if (isValid(parsedDate)) {
          date = parsedDate;
          break;
        }
      }

      if (!date) {
        toast.error(`Could not parse date: ${dateStr}`);
        continue;
      }

      const valueStr = parts[parts.length - 1].replace(/,/g, '');
      const value = parseFloat(valueStr);
      
      if (isNaN(value)) {
        toast.error(`Could not parse value: ${valueStr}`);
        continue;
      }

      prices.push({
        flow_date_start: date,
        value: value
      });
    }

    return prices;
  };

  const handlePriceDataInput = () => {
    const prices = parsePriceData(rawPriceInput);
    const validation = validatePriceData(prices);
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setPriceData(prices);
    
    // Create preview data
    const preview = {
      curveDetails: {
        ...curveDetails,
        curve_start_date: format(prices[0].flow_date_start, 'yyyy-MM-dd'),
        curve_end_date: format(prices[prices.length - 1].flow_date_start, 'yyyy-MM-dd')
      },
      pricePoints: prices.slice(0, 5),
      totalPoints: prices.length,
      dateRange: {
        start: format(prices[0].flow_date_start, 'yyyy-MM-dd'),
        end: format(prices[prices.length - 1].flow_date_start, 'yyyy-MM-dd')
      },
      priceRange: {
        min: Math.min(...prices.map(p => p.value)),
        max: Math.max(...prices.map(p => p.value))
      }
    };
    
    setPreviewData(preview);
    setStep(4);
  };

  const handleSubmit = async () => {
    try {
      // Create CSV content
      const headers = [
        'flow_start_date',
        'granularity',
        'mark_date',
        'mark_type',
        'mark_case',
        'value',
        'units',
        'location',
        'market'
      ].join(',');

      const rows = priceData.map(point => [
        format(point.flow_date_start, 'yyyy-MM-dd'),
        curveDetails.granularity,
        curveDetails.mark_date,
        curveDetails.mark_type,
        curveDetails.mark_case,
        point.value.toString(),
        '$/kw-mn',
        curveDetails.location,
        curveDetails.market
      ].join(','));

      const csvContent = [headers, ...rows].join('\n');
      
      // Create FormData and upload
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', blob, 'curve_data.csv');

      const response = await fetch('/api/curves/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      const result = await response.json();
      toast.success('Curve uploaded successfully');
      setStep(1);
      setCurveDetails({
        location: '',
        market: '',
        mark_case: 'Base',
        mark_type: '',
        granularity: 'ANNUAL',
        curve_creator: '',
        mark_date: format(new Date(), 'yyyy-MM-dd'),
        value_type: 'Price'
      });
      setPriceData([]);
      setRawPriceInput('');
      setPreviewData(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Basic Curve Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., SP15, Houston"
                  value={curveDetails.location}
                  onChange={(e) => {
                    const location = e.target.value;
                    setCurveDetails(prev => ({
                      ...prev,
                      location,
                      mark_type: `${location}_${prev.mark_case}`
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Market</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., CAISO, ERCOT"
                  value={curveDetails.market}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, market: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mark Case</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.mark_case}
                  onChange={(e) => {
                    const markCase = e.target.value;
                    setCurveDetails(prev => ({
                      ...prev,
                      mark_case: markCase,
                      mark_type: `${prev.location}_${markCase}`
                    }));
                  }}
                >
                  <option value="Base">Base</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Granularity</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.granularity}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, granularity: e.target.value as 'MONTHLY' | 'ANNUAL' }))}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!curveDetails.location || !curveDetails.market}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mark Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.mark_date}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, mark_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Curve Creator</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.curve_creator}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, curve_creator: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Value Type</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Price, Revenue"
                  value={curveDetails.value_type}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, value_type: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fundamentals Description</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.mark_fundamentals_desc || ''}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, mark_fundamentals_desc: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model Type Description</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.mark_model_type_desc || ''}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, mark_model_type_desc: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GridStor Purpose</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.gridstor_purpose || ''}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, gridstor_purpose: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 space-x-4">
              <button
                onClick={() => setStep(1)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Next
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Price Data Input</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-2">Paste your price data below. Format:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                Date    Price{'\n'}
                2025-01-01    12.10{'\n'}
                2025-02-01    13.20
              </pre>
              <p className="text-sm text-gray-600 mt-2">The first row should be a header row (any header names are fine).</p>
            </div>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-64 font-mono"
              value={rawPriceInput}
              onChange={(e) => setRawPriceInput(e.target.value)}
              placeholder="Paste your price data here..."
            />
            <div className="mt-4 space-x-4">
              <button
                onClick={() => setStep(2)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                onClick={handlePriceDataInput}
                disabled={!rawPriceInput.trim()}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Preview
              </button>
            </div>
          </div>
        );

      case 4:
        return previewData && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 4: Review and Submit</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Curve Details</h4>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Location:</dt>
                  <dd>{curveDetails.location}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Market:</dt>
                  <dd>{curveDetails.market}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mark Type:</dt>
                  <dd>{curveDetails.mark_type}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mark Case:</dt>
                  <dd>{curveDetails.mark_case}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Granularity:</dt>
                  <dd>{curveDetails.granularity}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mark Date:</dt>
                  <dd>{curveDetails.mark_date}</dd>
                </div>
              </dl>

              <h4 className="font-medium mt-4 mb-2">Price Data Summary</h4>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Total Points:</dt>
                  <dd>{previewData.totalPoints}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Date Range:</dt>
                  <dd>{previewData.dateRange.start} to {previewData.dateRange.end}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Price Range:</dt>
                  <dd>${previewData.priceRange.min.toFixed(2)} to ${previewData.priceRange.max.toFixed(2)}</dd>
                </div>
              </dl>

              <h4 className="font-medium mt-4 mb-2">First Few Points</h4>
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-gray-500">Date</th>
                    <th className="text-left font-medium text-gray-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.pricePoints.map((point, index) => (
                    <tr key={index}>
                      <td>{format(point.flow_date_start, 'yyyy-MM-dd')}</td>
                      <td>${point.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-x-4">
              <button
                onClick={() => setStep(3)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Upload Curve
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`flex items-center ${step >= stepNumber ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                  step >= stepNumber ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                }`}>
                  {stepNumber}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">
                  {stepNumber === 1 && 'Basic Info'}
                  {stepNumber === 2 && 'Details'}
                  {stepNumber === 3 && 'Price Data'}
                  {stepNumber === 4 && 'Review'}
                </span>
              </div>
              {stepNumber < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > stepNumber ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {renderStep()}
    </div>
  );
};

export default StepByStepUploader; 