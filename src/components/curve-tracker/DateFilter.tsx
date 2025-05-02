import React, { useCallback } from 'react';

interface DateFilterProps {
  selectedDate: Date | null;
  onDateChange?: (date: Date | null) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedDate, onDateChange }) => {
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onDateChange) return;
    
    const value = e.target.value;
    if (!value) {
      onDateChange(null);
      return;
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date input:', value);
        return;
      }
      onDateChange(date);
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  }, [onDateChange]);

  const handleClear = useCallback(() => {
    if (onDateChange) {
      onDateChange(null);
    }
  }, [onDateChange]);

  return (
    <div className="flex items-center space-x-4">
      <label className="text-sm font-medium text-gray-700">
        Show curves that were fresh on:
      </label>
      <input
        type="date"
        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
      {selectedDate && (
        <button
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-700"
          type="button"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default DateFilter; 