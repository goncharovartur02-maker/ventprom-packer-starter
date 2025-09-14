'use client';

import ThreeDViewer from './ThreeDViewer';

interface PackResult {
  success: boolean;
  items: any[];
  vehicle: any;
  totalWeight: number;
  utilization: number;
  message?: string;
}

interface PackingResultsProps {
  result: PackResult;
}

export default function PackingResults({ result }: PackingResultsProps) {
  if (!result.success) {
    return (
      <div className="text-red-600 p-4">
        {result.message || 'Packing failed'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Items Packed</h3>
          <p className="text-2xl font-bold text-blue-600">{result.items.length}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Total Weight</h3>
          <p className="text-2xl font-bold text-green-600">{result.totalWeight.toFixed(1)} kg</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Vehicle</h3>
          <p className="text-2xl font-bold text-purple-600">{result.vehicle.name}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Utilization</h3>
          <p className="text-2xl font-bold text-orange-600">{result.utilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">3D Visualization</h3>
        <div className="h-96">
          <ThreeDViewer result={result} />
        </div>
      </div>

      {/* Message */}
      {result.message && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800">{result.message}</p>
        </div>
      )}
    </div>
  );
}







