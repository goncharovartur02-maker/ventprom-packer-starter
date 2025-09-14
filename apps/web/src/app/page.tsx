'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import VehicleSelector from '@/components/VehicleSelector';
import PackingResults from '@/components/PackingResults';
// Временно используем локальные типы
interface UniversalItem {
  id: string;
  type: string;
  dimensions: { [key: string]: number };
  qty: number;
  weightKg: number;
}

interface Vehicle {
  id: string;
  name: string;
  width: number;
  height: number;
  length: number;
  maxPayloadKg: number;
}

interface PackResult {
  success: boolean;
  items: UniversalItem[];
  vehicle: Vehicle;
  totalWeight: number;
  utilization: number;
  message?: string;
}

export default function Home() {
  const [items, setItems] = useState<UniversalItem[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse files');
      }

      const data = await response.json();
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePack = async () => {
    if (!selectedVehicle || items.length === 0) {
      setError('Please select a vehicle and upload items first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle: selectedVehicle,
          items: items,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to pack items');
      }

      const result = await response.json();
      setPackResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!packResult) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packResult: packResult,
          companyMeta: {
            title: 'Ventprom Packing Report',
            logoBase64: '', // Add logo if available
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'packing-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  const handleExportGlb = async () => {
    if (!packResult) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/export/glb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packResult: packResult,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export GLB');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'packing-model.glb';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export GLB');
    }
  };

  const handleExportHtml = async () => {
    if (!packResult) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/export/html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packResult: packResult,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export HTML');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'packing-viewer.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export HTML');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Modern header with glassmorphism */}
        <header className="text-center mb-12">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 animate-fade-in">
              Wentprom калькулятор
            </h1>
            <p className="text-xl text-white/80 font-light">
              🚚 3D упаковка воздуховодов для транспортных средств
            </p>
            <div className="flex justify-center mt-6 space-x-4">
              <div className="flex items-center text-white/70">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Система активна
              </div>
            </div>
          </div>
        </header>

        {/* Modern error display */}
        {error && (
          <div className="backdrop-blur-xl bg-red-500/20 border border-red-400/30 text-red-100 px-6 py-4 rounded-2xl mb-8 shadow-lg animate-slide-down">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left column - Modern glassmorphism controls */}
          <div className="space-y-6">
            {/* File Upload Card */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                📁 Загрузить файлы
              </h2>
              <FileUpload onUpload={handleFileUpload} loading={loading} />
              {items.length > 0 && (
                <div className="mt-6 p-4 bg-green-500/20 rounded-2xl border border-green-400/30">
                  <div className="flex items-center text-green-200">
                    <span className="text-2xl mr-3">✅</span>
                    Загружено {items.length} воздуховодов
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Selection Card */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                🚛 Выбрать транспорт
              </h2>
              <VehicleSelector
                onSelect={setSelectedVehicle}
                selected={selectedVehicle}
              />
            </div>

            {/* Actions Card */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                ⚡ Действия
              </h2>
              <div className="space-y-4">
                <button
                  onClick={handlePack}
                  disabled={!selectedVehicle || items.length === 0 || loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Упаковка...
                    </>
                  ) : (
                    <>
                      🎯 Упаковать предметы
                    </>
                  )}
                </button>

                {packResult && (
                  <div className="space-y-3 pt-4 border-t border-white/20">
                    <button
                      onClick={handleExportPdf}
                      className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
                    >
                      📄 Экспорт PDF
                    </button>
                    <button
                      onClick={handleExportGlb}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
                    >
                      🎨 Экспорт 3D
                    </button>
                    <button
                      onClick={handleExportHtml}
                      className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center"
                    >
                      🌐 Экспорт HTML
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Results with glassmorphism */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              📊 Результаты
            </h2>
            {packResult ? (
              <PackingResults result={packResult} />
            ) : (
              <div className="text-center text-white/70 py-16">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white/70 mb-4"></div>
                    <p className="text-lg">Обработка данных...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4 opacity-50">📦</div>
                    <p className="text-lg">Загрузите файлы и выберите транспорт</p>
                    <p className="text-sm text-white/50 mt-2">для просмотра результатов упаковки</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}







