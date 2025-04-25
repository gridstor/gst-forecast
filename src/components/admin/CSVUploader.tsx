import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

interface UploadHistory {
  fileName: string;
  status: 'success' | 'error';
  message: string;
  timestamp: Date;
}

const CSVUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);

  const validateCSV = async (file: File): Promise<boolean> => {
    const text = await file.text();
    const lines = text.split('\n');
    if (lines.length < 2) return false;

    const headers = lines[0].toLowerCase().split(',');
    const requiredColumns = [
      'flow_start_date',
      'granularity',
      'mark_date',
      'mark_type',
      'mark_case',
      'value',
      'units',
      'location',
      'market'
    ];

    return requiredColumns.every(col => 
      headers.some(header => header.trim() === col)
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Validate file type
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }

      // Validate CSV structure
      const isValid = await validateCSV(file);
      if (!isValid) {
        throw new Error('Invalid CSV format. Please check the required columns.');
      }

      // Create FormData and upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/curves/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update history
      setUploadHistory(prev => [{
        fileName: file.name,
        status: 'success',
        message: 'Upload successful',
        timestamp: new Date()
      }, ...prev]);

      toast.success('File uploaded successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadHistory(prev => [{
        fileName: file.name,
        status: 'error',
        message,
        timestamp: new Date()
      }, ...prev]);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14M24 4v24m-8-8l8 8 8-8"
            />
          </svg>
          <div className="text-lg">
            {isDragActive ? (
              <p className="text-blue-500">Drop the CSV file here</p>
            ) : (
              <p>Drag and drop your CSV file here, or click to select</p>
            )}
          </div>
          <p className="text-sm text-gray-500">CSV files only</p>
        </div>
      </div>

      {isUploading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Uploading...</p>
        </div>
      )}

      {uploadHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Upload History</h3>
          <div className="bg-white rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.timestamp.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUploader; 