import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CurveDefinition {
  curve_id: number;
  mark_type: string;
  location: string;
  market: string;
  mark_date: string;
  price_points: number;
}

interface PricePoint {
  id: number;
  curve_id: number;
  flow_date_start: string;
  value: number;
}

const CurveManager: React.FC = () => {
  const [curves, setCurves] = useState<CurveDefinition[]>([]);
  const [selectedCurve, setSelectedCurve] = useState<CurveDefinition | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPoint, setEditingPoint] = useState<PricePoint | null>(null);
  const [deletingCurve, setDeletingCurve] = useState<CurveDefinition | null>(null);

  // Fetch curves
  const fetchCurves = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/curves/list.json', {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch curves');
      }
      const data = await response.json();
      setCurves(data);
    } catch (error) {
      console.error('Error fetching curves:', error);
      toast.error('Failed to load curves');
    } finally {
      setLoading(false);
    }
  };

  // Fetch price points for a curve
  const fetchPricePoints = async (curveId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/curves/${curveId}/prices.json`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch price points');
      }
      const data = await response.json();
      setPricePoints(data);
    } catch (error) {
      console.error('Error fetching price points:', error);
      toast.error('Failed to load price points');
    } finally {
      setLoading(false);
    }
  };

  // Delete curve
  const handleDeleteCurve = async (curve: CurveDefinition) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/curves/${curve.curve_id}.json`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete curve');
      }
      
      toast.success('Curve deleted successfully');
      fetchCurves();
      if (selectedCurve?.curve_id === curve.curve_id) {
        setSelectedCurve(null);
        setPricePoints([]);
      }
      setDeletingCurve(null);
    } catch (error) {
      console.error('Error deleting curve:', error);
      toast.error('Failed to delete curve');
    } finally {
      setLoading(false);
    }
  };

  // Update price point
  const handleUpdatePricePoint = async (point: PricePoint) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/curves/${point.curve_id}/prices/${point.id}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ value: point.value })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update price point');
      }
      
      toast.success('Price point updated successfully');
      setEditingPoint(null);
      fetchPricePoints(point.curve_id);
    } catch (error) {
      console.error('Error updating price point:', error);
      toast.error('Failed to update price point');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurves();
  }, []);

  const filteredCurves = curves.filter(curve => 
    curve.mark_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curve.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curve.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search curves..."
          className="w-full px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCurve && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Confirm Curve Deletion</h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">Are you sure you want to delete this curve?</p>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <p><span className="font-medium">Curve ID:</span> {deletingCurve.curve_id}</p>
                <p><span className="font-medium">Mark Type:</span> {deletingCurve.mark_type}</p>
                <p><span className="font-medium">Location:</span> {deletingCurve.location}</p>
                <p><span className="font-medium">Market:</span> {deletingCurve.market}</p>
                <p><span className="font-medium">Mark Date:</span> {format(new Date(deletingCurve.mark_date), 'yyyy-MM-dd')}</p>
                <p><span className="font-medium">Price Points:</span> {deletingCurve.price_points}</p>
              </div>
              <p className="text-red-600 text-sm">This action cannot be undone. All associated price points will also be deleted.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingCurve(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCurve(deletingCurve)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Curve
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curves List */}
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Curves</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCurves.map(curve => (
              <div
                key={curve.curve_id}
                className={`p-3 rounded-md cursor-pointer hover:bg-gray-50 ${
                  selectedCurve?.curve_id === curve.curve_id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => {
                  setSelectedCurve(curve);
                  fetchPricePoints(curve.curve_id);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{curve.mark_type}</div>
                    <div className="text-sm text-gray-500">
                      {curve.location} - {curve.market}
                    </div>
                    <div className="text-xs text-gray-400">
                      Mark Date: {format(new Date(curve.mark_date), 'yyyy-MM-dd')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Curve ID: {curve.curve_id}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCurve(curve);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Points */}
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Price Points</h3>
          {selectedCurve ? (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Value</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricePoints.map(point => (
                    <tr key={point.id}>
                      <td className="py-2">{format(new Date(point.flow_date_start), 'yyyy-MM-dd')}</td>
                      <td className="py-2">
                        {editingPoint?.id === point.id ? (
                          <input
                            type="number"
                            value={editingPoint.value}
                            onChange={(e) => setEditingPoint({
                              ...editingPoint,
                              value: parseFloat(e.target.value)
                            })}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        ) : (
                          `$${point.value.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-2">
                        {editingPoint?.id === point.id ? (
                          <div className="space-x-2">
                            <button
                              onClick={() => handleUpdatePricePoint(editingPoint)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPoint(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingPoint(point)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Select a curve to view price points
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurveManager; 