import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CurveTemplate {
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

interface CurveTemplateManagerProps {
  onGenerateTemplate: (templates: CurveTemplate[]) => void;
}

const CurveTemplateManager: React.FC<CurveTemplateManagerProps> = ({ onGenerateTemplate }) => {
  const [templates, setTemplates] = useState<CurveTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<CurveTemplate>({
    location: '',
    market: '',
    markCase: 'P50',
    markType: '',
    granularity: 'ANNUAL',
    curveCreator: '',
    markDate: format(new Date(), 'yyyy-MM-dd'),
    valueType: '',
    markFundamentalsDesc: '',
    markModelTypeDesc: '',
    markDispatchOptimizationDesc: '',
    gridstorPurpose: '',
    curve_bess_duration: null
  });

  const addTemplate = () => {
    if (!currentTemplate.location || !currentTemplate.market || !currentTemplate.valueType) {
      toast.error('Please fill in at least Location, Market, and Value Type');
      return;
    }

    // Generate mark type if not manually set
    const markType = currentTemplate.markType || 
      `${currentTemplate.curveCreator}_${currentTemplate.location}_${currentTemplate.granularity}_${currentTemplate.valueType}_${currentTemplate.markDate}`;

    const newTemplate = {
      ...currentTemplate,
      markType
    };

    setTemplates([...templates, newTemplate]);
    toast.success('Template added to batch');
  };

  const removeTemplate = (index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  };

  const generateCSVTemplate = () => {
    if (templates.length === 0) {
      toast.error('Please add at least one curve template');
      return;
    }

    onGenerateTemplate(templates);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.location}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, location: e.target.value })}
          >
            <option value="">Select Location</option>
            <option value="NP15">NP15</option>
            <option value="SP15">SP15</option>
            <option value="Goleta">Goleta</option>
            <option value="Hidden Lakes">Hidden Lakes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Market</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.market}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, market: e.target.value })}
          >
            <option value="">Select Market</option>
            <option value="CAISO">CAISO</option>
            <option value="ERCOT">ERCOT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Value Type</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.valueType}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, valueType: e.target.value })}
          >
            <option value="">Select Value Type</option>
            <option value="Revenue">Revenue</option>
            <option value="Energy Arb">Energy Arbitrage</option>
            <option value="AS">Ancillary Services</option>
            <option value="TB2">TB2</option>
            <option value="TB4">TB4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">BESS Duration (hours)</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.curve_bess_duration || ''}
            onChange={(e) => setCurrentTemplate({ 
              ...currentTemplate, 
              curve_bess_duration: e.target.value ? parseFloat(e.target.value) : null 
            })}
            placeholder="e.g., 4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mark Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.markDate}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, markDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Curve Creator</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={currentTemplate.curveCreator}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, curveCreator: e.target.value })}
          >
            <option value="">Select Creator</option>
            <option value="Gridstor">Gridstor</option>
            <option value="Aurora">Aurora</option>
            <option value="Actual">Actual</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={addTemplate}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add to Batch
        </button>
      </div>

      {templates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Staged Templates</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BESS Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{template.location}</td>
                    <td className="px-4 py-2 text-sm">{template.market}</td>
                    <td className="px-4 py-2 text-sm">{template.valueType}</td>
                    <td className="px-4 py-2 text-sm">{template.curve_bess_duration || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">{template.markDate}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => removeTemplate(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={generateCSVTemplate}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Generate CSV Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurveTemplateManager; 