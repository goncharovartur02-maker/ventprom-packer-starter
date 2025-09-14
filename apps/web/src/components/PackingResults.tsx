'use client';

interface PackResult {
  success: boolean;
  items: any[];
  vehicle: any;
  totalWeight: number;
  utilization: number;
  message?: string;
}
import ThreeDViewer from './ThreeDViewer';

interface PackingResultsProps {
  result: PackResult;
}

export default function PackingResults({ result }: PackingResultsProps) {
  const totalItems = result.placements.length;
  const volumeFill = (result.metrics.volumeFill * 100).toFixed(1);
  const stabilityScore = result.metrics.stabilityScore 
    ? (result.metrics.stabilityScore * 100).toFixed(1) 
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Items Packed</h3>
          <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Bins Used</h3>
          <p className="text-2xl font-bold text-green-600">{result.binsUsed}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Volume Fill</h3>
          <p className="text-2xl font-bold text-purple-600">{volumeFill}%</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900">Stability</h3>
          <p className="text-2xl font-bold text-orange-600">{stabilityScore}%</p>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">3D Visualization</h3>
        <div className="h-96">
          <ThreeDViewer result={result} />
        </div>
      </div>

      {/* Rows Summary */}
      {Object.keys(result.rows).length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Rows Summary</h3>
          <div className="space-y-2">
            {Object.entries(result.rows).map(([rowIndex, placements]) => (
              <div key={rowIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Row {rowIndex}</span>
                <span className="text-sm text-gray-600">
                  {placements.length} items
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight Distribution */}
      {result.metrics.weightPerLayer && result.metrics.weightPerLayer.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Weight Distribution</h3>
          <div className="space-y-2">
            {result.metrics.weightPerLayer.map((weight, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Layer {index}</span>
                <span className="text-sm text-gray-600">
                  {weight.toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}







