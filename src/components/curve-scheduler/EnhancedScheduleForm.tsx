import React, { useState } from 'react';

interface EnhancedScheduleFormProps {
  curveDefinition: {
    id: number;
    curveName: string;
    market: string;
    location: string;
    product: string;
    commodity: string;
    units: string;
    granularity: string;
    timezone: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface FormData {
  scheduleType: 'REGULAR' | 'AD_HOC' | 'TRIGGERED' | 'EVENT_BASED';
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ON_DEMAND';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  leadTimeDays: number;
  freshnessHours: number;
  responsibleTeam: string;
  importance: number;
  metadata: {
    deliveryMonths?: number[];
    forecastHorizon?: string;
    requiredInputs?: string[];
  };
}

const defaultFormData: FormData = {
  scheduleType: 'REGULAR',
  frequency: 'MONTHLY',
  dayOfMonth: 15,
  timeOfDay: '09:00',
  leadTimeDays: 0,
  freshnessHours: 720, // 30 days for monthly
  responsibleTeam: 'Market Analysis',
  importance: 3,
  metadata: {
    deliveryMonths: [1, 2, 3], // Next 3 months
    forecastHorizon: 'YEAR_AHEAD',
    requiredInputs: []
  }
};

export default function EnhancedScheduleForm({ 
  curveDefinition, 
  onSuccess, 
  onError, 
  onCancel 
}: EnhancedScheduleFormProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [selectedInputs, setSelectedInputs] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fundamental inputs for energy curves
  const availableInputs = [
    { type: 'WEATHER_FORECAST', source: 'NOAA', identifier: 'temperature_forecast' },
    { type: 'WEATHER_FORECAST', source: 'NOAA', identifier: 'wind_speed_forecast' },
    { type: 'DEMAND_FORECAST', source: 'ISO', identifier: 'load_forecast' },
    { type: 'GENERATION_FORECAST', source: 'ISO', identifier: 'renewable_generation' },
    { type: 'FUEL_PRICES', source: 'EIA', identifier: 'natural_gas_prices' },
    { type: 'TRANSMISSION_LIMITS', source: 'ISO', identifier: 'transmission_constraints' },
    { type: 'HYDRO_CONDITIONS', source: 'USGS', identifier: 'reservoir_levels' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In the new architecture, this would create a CurveSchedule record
      const scheduleData = {
        curveDefinitionId: curveDefinition.id,
        scheduleType: formData.scheduleType,
        frequency: formData.frequency,
        dayOfWeek: formData.dayOfWeek,
        dayOfMonth: formData.dayOfMonth,
        timeOfDay: formData.timeOfDay,
        leadTimeDays: formData.leadTimeDays,
        freshnessHours: formData.freshnessHours,
        responsibleTeam: formData.responsibleTeam,
        importance: formData.importance,
        isActive: true,
        metadata: {
          ...formData.metadata,
          requiredInputs: Array.from(selectedInputs)
        }
      };

      const response = await fetch('/api/curve-schedule/create-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create schedule');
      }

      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFreshnessHours = (frequency: string): number => {
    const freshnessMap: Record<string, number> = {
      'HOURLY': 1,
      'DAILY': 24,
      'WEEKLY': 168,
      'MONTHLY': 720,
      'QUARTERLY': 2160,
      'ON_DEMAND': 24
    };
    return freshnessMap[frequency] || 24;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Create Enhanced Schedule</h3>
      
      {/* Curve Definition Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-sm text-blue-900 mb-2">Curve Definition</h4>
        <div className="text-sm space-y-1 text-blue-800">
          <div><span className="font-medium">Name:</span> {curveDefinition.curveName}</div>
          <div><span className="font-medium">Market:</span> {curveDefinition.market}</div>
          <div><span className="font-medium">Location:</span> {curveDefinition.location}</div>
          <div><span className="font-medium">Product:</span> {curveDefinition.product}</div>
          <div><span className="font-medium">Granularity:</span> {curveDefinition.granularity}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Schedule Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.scheduleType}
            onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as any })}
          >
            <option value="REGULAR">Regular Schedule</option>
            <option value="AD_HOC">Ad Hoc</option>
            <option value="TRIGGERED">Event Triggered</option>
            <option value="EVENT_BASED">Event Based</option>
          </select>
        </div>

        {/* Update Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Update Frequency
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.frequency}
            onChange={(e) => {
              const frequency = e.target.value as any;
              setFormData({ 
                ...formData, 
                frequency,
                freshnessHours: calculateFreshnessHours(frequency)
              });
            }}
          >
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ON_DEMAND">On Demand</option>
          </select>
        </div>

        {/* Schedule Timing */}
        {formData.frequency === 'WEEKLY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of Week
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.dayOfWeek || 1}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
        )}

        {(formData.frequency === 'MONTHLY' || formData.frequency === 'QUARTERLY') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of Month
            </label>
            <input
              type="number"
              min="1"
              max="31"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.dayOfMonth || 15}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time of Day ({curveDefinition.timezone})
          </label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.timeOfDay}
            onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
          />
        </div>

        {/* Advanced Settings */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Advanced Settings</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (days)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">Days before delivery to run forecast</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Freshness Period (hours)
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.freshnessHours}
                onChange={(e) => setFormData({ ...formData, freshnessHours: parseInt(e.target.value) || 24 })}
              />
              <p className="text-xs text-gray-500 mt-1">How long forecast remains active</p>
            </div>
          </div>
        </div>

        {/* Required Inputs */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Required Fundamental Inputs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableInputs.map((input) => {
              const inputKey = `${input.type}:${input.source}:${input.identifier}`;
              return (
                <label key={inputKey} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    className="mr-3"
                    checked={selectedInputs.has(inputKey)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedInputs);
                      if (e.target.checked) {
                        newSelected.add(inputKey);
                      } else {
                        newSelected.delete(inputKey);
                      }
                      setSelectedInputs(newSelected);
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{input.identifier.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500">{input.type} from {input.source}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Team and Importance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsible Team
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.responsibleTeam}
              onChange={(e) => setFormData({ ...formData, responsibleTeam: e.target.value })}
            >
              <option value="Market Analysis">Market Analysis</option>
              <option value="Risk Management">Risk Management</option>
              <option value="Trading">Trading</option>
              <option value="Operations">Operations</option>
              <option value="Quantitative Research">Quantitative Research</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importance
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
            >
              <option value={1}>1 - Critical</option>
              <option value={2}>2 - High</option>
              <option value={3}>3 - Medium</option>
              <option value={4}>4 - Low</option>
              <option value={5}>5 - Minimal</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Enhanced Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
} 