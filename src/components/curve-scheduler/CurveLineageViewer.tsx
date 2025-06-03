import React, { useState } from 'react';

interface InputLineage {
  id: number;
  inputType: string;
  inputSource: string;
  inputIdentifier: string;
  inputVersion?: string;
  inputTimestamp: Date;
  usageType: 'PRIMARY' | 'VALIDATION' | 'REFERENCE' | 'FALLBACK';
  weight?: number;
  metadata?: any;
}

interface VersionHistory {
  id: number;
  changeType: 'INITIAL' | 'UPDATE' | 'CORRECTION' | 'REVISION' | 'FINAL' | 'ROLLBACK';
  changeReason: string;
  changedBy: string;
  changedAt: Date;
  previousInstanceId?: number;
}

interface CurveInstance {
  id: number;
  instanceVersion: string;
  deliveryPeriodStart: Date;
  deliveryPeriodEnd: Date;
  forecastRunDate: Date;
  freshnessStartDate: Date;
  freshnessEndDate?: Date;
  status: string;
  modelType?: string;
  notes?: string;
  inputLineage: InputLineage[];
  versionHistory: VersionHistory[];
  _count?: {
    priceForecasts: number;
  };
}

interface CurveLineageViewerProps {
  curveInstance: CurveInstance;
  allVersions?: CurveInstance[];
  onVersionSelect?: (instanceId: number) => void;
}

export default function CurveLineageViewer({ 
  curveInstance, 
  allVersions = [],
  onVersionSelect 
}: CurveLineageViewerProps) {
  const [activeTab, setActiveTab] = useState<'inputs' | 'history' | 'comparison'>('inputs');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Group inputs by type
  const groupedInputs = curveInstance.inputLineage.reduce((acc, input) => {
    if (!acc[input.inputType]) {
      acc[input.inputType] = [];
    }
    acc[input.inputType].push(input);
    return acc;
  }, {} as Record<string, InputLineage[]>);

  const inputTypeColors: Record<string, string> = {
    'WEATHER_FORECAST': 'bg-blue-100 text-blue-800',
    'DEMAND_FORECAST': 'bg-green-100 text-green-800',
    'GENERATION_FORECAST': 'bg-yellow-100 text-yellow-800',
    'FUEL_PRICES': 'bg-red-100 text-red-800',
    'TRANSMISSION_LIMITS': 'bg-purple-100 text-purple-800',
    'MARKET_FUNDAMENTALS': 'bg-indigo-100 text-indigo-800'
  };

  const getInputTypeColor = (type: string) => {
    return inputTypeColors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Curve Instance Lineage</h2>
            <p className="text-gray-600 mt-1">Version {curveInstance.instanceVersion}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Forecast Run Date</div>
            <div className="font-medium">{formatDate(curveInstance.forecastRunDate)}</div>
          </div>
        </div>
        
        {/* Instance Metadata */}
        <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Delivery Period</div>
            <div className="font-medium">
              {formatDate(curveInstance.deliveryPeriodStart)} - {formatDate(curveInstance.deliveryPeriodEnd)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Freshness Period</div>
            <div className="font-medium">
              {formatDate(curveInstance.freshnessStartDate)} - 
              {curveInstance.freshnessEndDate ? formatDate(curveInstance.freshnessEndDate) : 'Current'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Model Type</div>
            <div className="font-medium">{curveInstance.modelType || 'Not specified'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inputs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inputs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Input Lineage ({curveInstance.inputLineage.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Version History ({curveInstance.versionHistory.length})
          </button>
          {allVersions.length > 1 && (
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Version Comparison
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'inputs' && (
        <div className="space-y-6">
          {Object.entries(groupedInputs).map(([inputType, inputs]) => (
            <div key={inputType} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${getInputTypeColor(inputType)}`}>
                  {inputType.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-500 text-sm">({inputs.length} inputs)</span>
              </h3>
              
              <div className="space-y-3">
                {inputs.map((input) => (
                  <div key={input.id} className="flex items-start p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{input.inputIdentifier}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Source: {input.inputSource} 
                        {input.inputVersion && ` • Version: ${input.inputVersion}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Generated: {formatDate(input.inputTimestamp)}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-xs font-medium px-2 py-1 rounded ${
                        input.usageType === 'PRIMARY' ? 'bg-green-100 text-green-800' :
                        input.usageType === 'VALIDATION' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {input.usageType}
                      </div>
                      {input.weight && (
                        <div className="text-xs text-gray-500 mt-1">Weight: {(input.weight * 100).toFixed(0)}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {curveInstance.inputLineage.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No input lineage recorded for this instance
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {curveInstance.versionHistory.map((history) => (
            <div key={history.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      history.changeType === 'INITIAL' ? 'bg-green-100 text-green-800' :
                      history.changeType === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      history.changeType === 'CORRECTION' ? 'bg-yellow-100 text-yellow-800' :
                      history.changeType === 'ROLLBACK' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {history.changeType}
                    </span>
                    <span className="ml-3 font-medium">{history.changeReason}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Changed by: {history.changedBy} • {formatDate(history.changedAt)}
                  </div>
                </div>
                {history.previousInstanceId && onVersionSelect && (
                  <button
                    onClick={() => onVersionSelect(history.previousInstanceId!)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Previous →
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {curveInstance.versionHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No version history recorded
            </div>
          )}
        </div>
      )}

      {activeTab === 'comparison' && allVersions.length > 1 && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare with version:
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={selectedVersion || ''}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
            >
              <option value="">Select a version to compare</option>
              {allVersions
                .filter(v => v.id !== curveInstance.id)
                .map(version => (
                  <option key={version.id} value={version.id}>
                    {version.instanceVersion} - {formatDate(version.forecastRunDate)}
                  </option>
                ))}
            </select>
          </div>
          
          {selectedVersion && (
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Current Version</h4>
                <div className="text-sm space-y-1">
                  <div>Version: {curveInstance.instanceVersion}</div>
                  <div>Points: {curveInstance._count?.priceForecasts || 0}</div>
                  <div>Inputs: {curveInstance.inputLineage.length}</div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Comparison Version</h4>
                {/* Would fetch and display comparison data here */}
                <div className="text-sm text-gray-500">
                  Comparison data would be loaded here
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 