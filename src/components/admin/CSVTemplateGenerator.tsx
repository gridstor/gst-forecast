import React, { useState } from 'react';
import { format } from 'date-fns';

interface TemplateGeneratorProps {
  onGenerate?: (csvContent: string) => void;
}

const CSVTemplateGenerator: React.FC<TemplateGeneratorProps> = ({ onGenerate }) => {
  const [formData, setFormData] = useState({
    granularity: 'MONTHLY',
    markCase: 'Base',
    markDate: format(new Date(), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    location: '',
    market: ''
  });

  const generateTemplate = () => {
    const dates: Date[] = [];
    let currentDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    // Generate dates based on granularity
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      if (formData.granularity === 'MONTHLY') {
        currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      } else {
        currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      }
    }

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

    const rows = dates.map(date => {
      const markType = `${formData.location}_${formData.markCase}`;
      return [
        format(date, 'yyyy-MM-dd'),
        formData.granularity,
        formData.markDate,
        markType,
        formData.markCase,
        '', // value to be filled
        '$/kw-mn', // default units
        formData.location,
        formData.market
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price_curve_template_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    if (onGenerate) {
      onGenerate(csvContent);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Generate CSV Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., SP15, Houston"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Market</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., CAISO, ERCOT"
            value={formData.market}
            onChange={(e) => setFormData({ ...formData, market: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Granularity</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.granularity}
            onChange={(e) => setFormData({ ...formData, granularity: e.target.value })}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mark Case</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.markCase}
            onChange={(e) => setFormData({ ...formData, markCase: e.target.value })}
          >
            <option value="Base">Base</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mark Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.markDate}
            onChange={(e) => setFormData({ ...formData, markDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={generateTemplate}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={!formData.location || !formData.market}
        >
          Generate Template
        </button>
      </div>
    </div>
  );
};

export default CSVTemplateGenerator; 