import { useCallback } from 'react';
import { updateFreshnessPeriods } from '../queries/curveTracking';

interface UploadTrackingOptions {
  onUpdateSuccess?: (curveId: number) => void;
  onUpdateError?: (error: Error) => void;
}

export function useCurveUploadTracking(options: UploadTrackingOptions = {}) {
  const handleCurveUpload = useCallback(async (
    curveId: number,
    uploadMetadata: {
      uploadDate: Date;
      fileName: string;
      uploadedBy: string;
    }
  ) => {
    try {
      // Update the curve's tracking information
      await updateFreshnessPeriods(curveId);

      // Create an audit log entry
      await fetch('/api/curves/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          curveId,
          action: 'FILE_UPLOAD',
          metadata: {
            ...uploadMetadata,
            source: 'FILE_UPLOAD',
            automaticUpdate: true
          }
        })
      });

      options.onUpdateSuccess?.(curveId);
    } catch (error) {
      console.error('Error updating curve tracking after upload:', error);
      options.onUpdateError?.(error as Error);
    }
  }, [options]);

  return {
    handleCurveUpload
  };
} 