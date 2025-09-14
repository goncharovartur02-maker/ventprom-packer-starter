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
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Wentprom калькулятор
          </h1>
          <p className="text-lg text-gray-600">
            3D truck packing optimization for duct systems
          </p>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
              <FileUpload onUpload={handleFileUpload} loading={loading} />
              {items.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  {items.length} items loaded
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Select Vehicle</h2>
              <VehicleSelector
                onSelect={setSelectedVehicle}
                selected={selectedVehicle}
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handlePack}
                  disabled={!selectedVehicle || items.length === 0 || loading}
                  className="btn btn-primary w-full"
                >
                  {loading ? 'Packing...' : 'Pack Items'}
                </button>

                {packResult && (
                  <div className="space-y-2">
                    <button
                      onClick={handleExportPdf}
                      className="btn btn-secondary w-full"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={handleExportGlb}
                      className="btn btn-secondary w-full"
                    >
                      Export GLB
                    </button>
                    <button
                      onClick={handleExportHtml}
                      className="btn btn-secondary w-full"
                    >
                      Export HTML
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            {packResult ? (
              <PackingResults result={packResult} />
            ) : (
              <div className="text-center text-gray-500 py-8">
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  'Upload files and select a vehicle to see packing results'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}







