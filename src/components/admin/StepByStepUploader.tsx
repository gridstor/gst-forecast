import React, { useState, useCallback } from 'react';
import { format, parse, isValid, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

interface PricePoint {
  flow_date_start: string;
  value: number;
}

interface CurveDetails {
  location: string;
  market: string;
  markCase: string;
  markType: string;
  granularity: string;
  curveCreator: string;
  markDate: string;
  valueType: string;
  curveStartDate: string;
  curveEndDate: string;
  markFundamentalsDesc: string;
  markModelTypeDesc: string;
  markDispatchOptimizationDesc: string;
  gridstorPurpose: string;
  curve_bess_duration: number | null;
}

interface PreviewPoint {
  flow_date_start: string;
  value: number;
}

interface PreviewData {
  curveDetails: CurveDetails & {
    curve_start_date: string;
    curve_end_date: string;
  };
  pricePoints: PreviewPoint[];
  totalPoints: number;
  dateRange: {
    start: string;
    end: string;
  };
  priceRange: {
    min: number;
    max: number;
  };
}

// Predefined options for dropdowns
const MARK_CASES = ['P50', 'P25', 'P75'];
const LOCATIONS = ['SP15', 'Goleta', 'Hidden Lakes', 'Houston'];
const MARKETS = ['CAISO', 'ERCOT'];
const VALUE_TYPES = ['Revenue', 'TB2', 'TB4', 'Energy Arb', 'AS'];
const CURVE_CREATORS = ['Gridstor', 'Aurora', 'Actual'];
const MODEL_TYPES = ['Gridstor Forwards Regressions', 'Aurora', 'Gridstor Stochastics', 'Actual'];
const DISPATCH_OPTIMIZATIONS = ['TB Regression', 'Aurora', 'Actual - Target', 'Actual - Revenue'];

const StepByStepUploader: React.FC = () => {
  const [step, setStep] = useState(1);
  const [curveDetails, setCurveDetails] = useState<CurveDetails>({
    location: '',
    market: '',
    markCase: 'P50',
    markType: '',
    granularity: 'ANNUAL',
    curveCreator: '',
    markDate: format(new Date(), 'yyyy-MM-dd'),
    valueType: 'Revenue',
    curveStartDate: '',
    curveEndDate: '',
    markFundamentalsDesc: '',
    markModelTypeDesc: '',
    markDispatchOptimizationDesc: '',
    gridstorPurpose: '',
    curve_bess_duration: null
  });
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [rawPriceInput, setRawPriceInput] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [useCustomInput, setUseCustomInput] = useState({
    markType: false,
    location: false,
    market: false,
    markCase: false,
    valueType: false,
    modelType: false,
    dispatchOptimization: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMarkType, setEditingMarkType] = useState(false);
  const [tempMarkType, setTempMarkType] = useState('');

  // Validation functions
  const validatePriceData = (data: string): PricePoint[] => {
    const lines = data.trim().split('\n');
    const points: PricePoint[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const [dateStr, valueStr] = line.split(',').map(s => s.trim());
      const value = parseFloat(valueStr);

      if (!dateStr || isNaN(value)) {
        errors.push(`Line ${index + 1}: Invalid format`);
        return;
      }

      if (value < 0 || value > 1000) {
        toast.error(`Line ${index + 1}: Price must be between 0 and 1000`);
        return;
      }

      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          errors.push(`Line ${index + 1}: Invalid date`);
          return;
        }
        points.push({
          flow_date_start: format(date, 'yyyy-MM-dd'),
          value
        });
      } catch (e) {
        errors.push(`Line ${index + 1}: Invalid date format`);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return [];
    }

    return points;
  };

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    return !isNaN(date.getTime());
  };

  const handlePriceDataInput = () => {
    // Parse the raw input first
    const prices = parsePriceData(rawPriceInput);
    
    if (prices.length === 0) {
      toast.error('No valid price data found');
      return;
    }

    setPriceData(prices);
    
    // Format mark_date to just include the date part
    const markDateOnly = curveDetails.markDate.split('T')[0];
    
    // Create default mark_type by concatenating required fields
    const defaultMarkType = `${curveDetails.curveCreator}_${curveDetails.location}_${curveDetails.granularity}_${curveDetails.valueType}_${markDateOnly}`;
    
    // Update curveDetails with the default mark_type
    setCurveDetails(prev => ({
      ...prev,
      markType: defaultMarkType
    }));
    
    // Create preview data
    const preview: PreviewData = {
      curveDetails: {
        ...curveDetails,
        curve_start_date: prices[0].flow_date_start,
        curve_end_date: prices[prices.length - 1].flow_date_start
      },
      pricePoints: prices.slice(0, 5),
      totalPoints: prices.length,
      dateRange: {
        start: prices[0].flow_date_start,
        end: prices[prices.length - 1].flow_date_start
      },
      priceRange: {
        min: Math.min(...prices.map(p => p.value)),
        max: Math.max(...prices.map(p => p.value))
      }
    };
    
    setPreviewData(preview);
    setStep(4);
  };

  const parsePriceData = (input: string): PricePoint[] => {
    if (!input.trim()) {
      return [];
    }

    const prices: PricePoint[] = [];
    const lines = input.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[,\t]/);
      if (parts.length < 2) {
        toast.error(`Invalid format on line ${i + 1}: ${line}`);
        continue;
      }

      const dateStr = parts[0].trim();
      const valueStr = parts[parts.length - 1].replace(/[$,]/g, '');
      const value = parseFloat(valueStr);

      if (isNaN(value)) {
        toast.error(`Invalid price value on line ${i + 1}: ${valueStr}`);
        continue;
      }

      // Try parsing the date
      try {
        const date = parseISO(dateStr);
        if (date instanceof Date && !isNaN(date.getTime())) {
          prices.push({
            flow_date_start: format(date, 'yyyy-MM-dd'),
            value
          });
        } else {
          toast.error(`Invalid date format on line ${i + 1}: ${dateStr}. Please use YYYY-MM-DD format.`);
        }
      } catch (error) {
        toast.error(`Invalid date format on line ${i + 1}: ${dateStr}. Please use YYYY-MM-DD format.`);
      }
    }

    if (prices.length === 0) {
      toast.error('No valid price data found. Please check the format.');
      return [];
    }

    // Sort prices by date
    return prices.sort((a, b) => 
      new Date(a.flow_date_start).getTime() - new Date(b.flow_date_start).getTime()
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      toast.error('Please complete all required fields and ensure price data is valid');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the first and last dates from price data for curve start/end dates
      const sortedPrices = [...priceData].sort((a, b) => 
        new Date(a.flow_date_start).getTime() - new Date(b.flow_date_start).getTime()
      );
      
      const requestData = {
        curveDetails: {
          mark_type: curveDetails.markType,
          mark_case: curveDetails.markCase,
          mark_date: curveDetails.markDate,
          location: curveDetails.location,
          market: curveDetails.market,
          granularity: curveDetails.granularity,
          curve_start_date: sortedPrices[0].flow_date_start,
          curve_end_date: sortedPrices[sortedPrices.length - 1].flow_date_start,
          curve_creator: curveDetails.curveCreator,
          mark_fundamentals_desc: curveDetails.markFundamentalsDesc,
          mark_model_type_desc: curveDetails.markModelTypeDesc,
          mark_dispatch_optimization_desc: curveDetails.markDispatchOptimizationDesc,
          gridstor_purpose: curveDetails.gridstorPurpose,
          value_type: curveDetails.valueType,
          curve_bess_duration: curveDetails.curve_bess_duration
        },
        pricePoints: priceData
      };

      const response = await fetch('/api/curves/upload.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload curve');
      }

      toast.success(
        <div>
          <p>Curve uploaded successfully!</p>
          <p className="text-sm mt-1">Mark Type: {curveDetails.markType}</p>
          <p className="text-sm">Curve ID: {data.curveId}</p>
        </div>,
        { duration: 5000 }
      );
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload curve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = () => {
    // Implement your validation logic here
    return true; // Placeholder, actual implementation needed
  };

  const resetForm = () => {
    setCurveDetails({
      location: '',
      market: '',
      markCase: 'P50',
      markType: '',
      granularity: 'ANNUAL',
      curveCreator: '',
      markDate: format(new Date(), 'yyyy-MM-dd'),
      valueType: 'Revenue',
      curveStartDate: '',
      curveEndDate: '',
      markFundamentalsDesc: '',
      markModelTypeDesc: '',
      markDispatchOptimizationDesc: '',
      gridstorPurpose: '',
      curve_bess_duration: null
    });
    setPriceData([]);
    setRawPriceInput('');
    setStep(1);
  };

  // Add a function to handle mark type updates
  const handleMarkTypeUpdate = () => {
    if (tempMarkType.trim()) {
      setCurveDetails(prev => ({
        ...prev,
        markType: tempMarkType.trim()
      }));
      setEditingMarkType(false);
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
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.location ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.location ? '' : curveDetails.location}
                    onChange={(e) => {
                      const location = e.target.value;
                      setCurveDetails(prev => ({
                        ...prev,
                        location,
                        markType: `${location}_${prev.markCase}`
                      }));
                    }}
                    disabled={useCustomInput.location}
                  >
                    <option value="">Select Location</option>
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customLocation"
                      checked={useCustomInput.location}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, location: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customLocation" className="text-sm text-gray-600">
                      Enter custom location
                    </label>
                  </div>
                  {useCustomInput.location && (
                    <input
                      type="text"
                      value={curveDetails.location}
                      onChange={(e) => setCurveDetails({ ...curveDetails, location: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom location"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Market</label>
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.market ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.market ? '' : curveDetails.market}
                    onChange={(e) => setCurveDetails(prev => ({ ...prev, market: e.target.value }))}
                    disabled={useCustomInput.market}
                  >
                    <option value="">Select Market</option>
                    {MARKETS.map(mkt => (
                      <option key={mkt} value={mkt}>{mkt}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customMarket"
                      checked={useCustomInput.market}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, market: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customMarket" className="text-sm text-gray-600">
                      Enter custom market
                    </label>
                  </div>
                  {useCustomInput.market && (
                    <input
                      type="text"
                      value={curveDetails.market}
                      onChange={(e) => setCurveDetails({ ...curveDetails, market: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom market"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mark Case</label>
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.markCase ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.markCase ? '' : curveDetails.markCase}
                    onChange={(e) => {
                      const markCase = e.target.value;
                      setCurveDetails(prev => ({
                        ...prev,
                        markCase: markCase,
                        markType: `${prev.location}_${markCase}`
                      }));
                    }}
                    disabled={useCustomInput.markCase}
                  >
                    <option value="">Select Mark Case</option>
                    {MARK_CASES.map(markCase => (
                      <option key={markCase} value={markCase}>{markCase}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customMarkCase"
                      checked={useCustomInput.markCase}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, markCase: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customMarkCase" className="text-sm text-gray-600">
                      Enter custom mark case
                    </label>
                  </div>
                  {useCustomInput.markCase && (
                    <input
                      type="text"
                      value={curveDetails.markCase}
                      onChange={(e) => {
                        const markCase = e.target.value;
                        setCurveDetails(prev => ({
                          ...prev,
                          markCase: markCase,
                          markType: `${prev.location}_${markCase}`
                        }));
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom mark case"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Granularity</label>
                <select
                  id="granularity"
                  name="granularity"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.granularity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setCurveDetails(prev => ({ ...prev, granularity: e.target.value }));
                  }}
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
                  value={curveDetails.markDate}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, markDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Curve Creator</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.curveCreator}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, curveCreator: e.target.value }))}
                >
                  <option value="">Select Curve Creator</option>
                  {CURVE_CREATORS.map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Value Type</label>
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.valueType ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.valueType ? '' : curveDetails.valueType}
                    onChange={(e) => setCurveDetails(prev => ({ ...prev, valueType: e.target.value }))}
                    disabled={useCustomInput.valueType}
                  >
                    <option value="">Select Value Type</option>
                    {VALUE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customValueType"
                      checked={useCustomInput.valueType}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, valueType: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customValueType" className="text-sm text-gray-600">
                      Enter custom value type
                    </label>
                  </div>
                  {useCustomInput.valueType && (
                    <input
                      type="text"
                      value={curveDetails.valueType}
                      onChange={(e) => setCurveDetails({ ...curveDetails, valueType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom value type"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fundamentals Description</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.markFundamentalsDesc || ''}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, markFundamentalsDesc: e.target.value }))}
                  placeholder="Enter fundamentals description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Model Type Description</label>
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.modelType ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.modelType ? '' : curveDetails.markModelTypeDesc}
                    onChange={(e) => setCurveDetails(prev => ({ ...prev, markModelTypeDesc: e.target.value }))}
                    disabled={useCustomInput.modelType}
                  >
                    <option value="">Select Model Type</option>
                    {MODEL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customModelType"
                      checked={useCustomInput.modelType}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, modelType: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customModelType" className="text-sm text-gray-600">
                      Enter custom model type
                    </label>
                  </div>
                  {useCustomInput.modelType && (
                    <input
                      type="text"
                      value={curveDetails.markModelTypeDesc}
                      onChange={(e) => setCurveDetails({ ...curveDetails, markModelTypeDesc: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom model type"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GridStor Purpose</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.gridstorPurpose || ''}
                  onChange={(e) => setCurveDetails(prev => ({ ...prev, gridstorPurpose: e.target.value }))}
                  placeholder="Enter GridStor purpose"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Dispatch Optimization Description</label>
                <div className="space-y-2">
                  <select
                    className={`w-full px-3 py-2 border rounded-md ${!useCustomInput.dispatchOptimization ? 'bg-white' : 'bg-gray-100'}`}
                    value={useCustomInput.dispatchOptimization ? '' : curveDetails.markDispatchOptimizationDesc}
                    onChange={(e) => setCurveDetails(prev => ({ ...prev, markDispatchOptimizationDesc: e.target.value }))}
                    disabled={useCustomInput.dispatchOptimization}
                  >
                    <option value="">Select Dispatch Optimization</option>
                    {DISPATCH_OPTIMIZATIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="customDispatchOpt"
                      checked={useCustomInput.dispatchOptimization}
                      onChange={(e) => setUseCustomInput({ ...useCustomInput, dispatchOptimization: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="customDispatchOpt" className="text-sm text-gray-600">
                      Enter custom dispatch optimization
                    </label>
                  </div>
                  {useCustomInput.dispatchOptimization && (
                    <input
                      type="text"
                      value={curveDetails.markDispatchOptimizationDesc}
                      onChange={(e) => setCurveDetails({ ...curveDetails, markDispatchOptimizationDesc: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter custom dispatch optimization"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">BESS Duration (hours)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={curveDetails.curve_bess_duration || ''}
                  onChange={(e) => setCurveDetails(prev => ({ 
                    ...prev, 
                    curve_bess_duration: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  placeholder="Enter BESS duration in hours"
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
                  <dd className="flex items-center space-x-2">
                    {editingMarkType ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tempMarkType}
                          onChange={(e) => setTempMarkType(e.target.value)}
                          className="px-2 py-1 border rounded w-full"
                          placeholder="Enter mark type"
                        />
                        <button
                          onClick={handleMarkTypeUpdate}
                          className="text-green-600 hover:text-green-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMarkType(false);
                            setTempMarkType('');
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{curveDetails.markType}</span>
                        <button
                          onClick={() => {
                            setEditingMarkType(true);
                            setTempMarkType(curveDetails.markType);
                          }}
                          className="text-blue-600 hover:text-blue-800 ml-2"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mark Case:</dt>
                  <dd>{curveDetails.markCase}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Granularity:</dt>
                  <dd>{curveDetails.granularity}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Mark Date:</dt>
                  <dd>{curveDetails.markDate}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Market Dispatch Optimization:</dt>
                  <dd>{curveDetails.markDispatchOptimizationDesc || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">BESS Duration:</dt>
                  <dd>{curveDetails.curve_bess_duration ? `${curveDetails.curve_bess_duration} hours` : 'Not specified'}</dd>
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
                      <td>{point.flow_date_start}</td>
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
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : 'Upload Curve'}
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
        {renderStep()}
      </div>
    </div>
  );
};

export default StepByStepUploader;