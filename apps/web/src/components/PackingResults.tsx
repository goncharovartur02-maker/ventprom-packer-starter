'use client';

import ThreeDViewer from './ThreeDViewer';
import type { PackResult } from '@ventprom/core';

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
      {/* Modern Summary Stats with Glassmorphism */}
      <div className="grid grid-cols-2 gap-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-300">
          <h3 className="font-semibold text-white/80 text-sm">📦 Элементов упаковано</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">{result.items.length}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-300">
          <h3 className="font-semibold text-white/80 text-sm">⚖️ Общий вес</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">{result.totalWeight.toFixed(1)} кг</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-300">
          <h3 className="font-semibold text-white/80 text-sm">🚚 Транспорт</h3>
          <p className="text-2xl font-bold text-purple-400 mt-2">{result.vehicle.name}</p>
        </div>
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-300">
          <h3 className="font-semibold text-white/80 text-sm">📊 Загрузка</h3>
          <p className="text-3xl font-bold text-orange-400 mt-2">{result.utilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* Modern 3D Viewer */}
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 shadow-2xl">
        <h3 className="font-bold text-white mb-4 text-xl flex items-center">
          🎨 3D Визуализация
          <span className="ml-auto text-sm text-white/60 font-normal">Интерактивный просмотр</span>
        </h3>
        <div className="h-96 rounded-2xl overflow-hidden border border-white/10">
          <ThreeDViewer result={result} />
        </div>
      </div>

      {/* Modern Message Display */}
      {result.message && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl border border-blue-400/30 p-6 shadow-lg">
          <h3 className="font-bold text-white mb-3 flex items-center">
            📋 Детальный отчет
          </h3>
          <pre className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-xl border border-white/10 overflow-x-auto">
            {result.message}
          </pre>
        </div>
      )}
    </div>
  );
}







