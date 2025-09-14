'use client';

import { useState, useEffect } from 'react';
import type { Vehicle } from '@ventprom/core';

interface VehicleSelectorProps {
  onSelect: (vehicles: Vehicle[]) => void;
  selected: Vehicle[];
}

export default function VehicleSelector({ onSelect, selected }: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiBase}/presets`);
        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Error loading vehicles: {error}
      </div>
    );
  }

  const handleVehicleToggle = (vehicle: Vehicle) => {
    const isSelected = selected.some(v => v.id === vehicle.id);
    let newSelected: Vehicle[];
    
    if (isSelected) {
      newSelected = selected.filter(v => v.id !== vehicle.id);
    } else {
      newSelected = [...selected, vehicle];
    }
    
    onSelect(newSelected);
  };

  return (
    <div className="space-y-3">
      <div className="text-white/80 text-sm mb-4">
        Выберите транспортные средства для анализа (можно несколько):
      </div>
      {vehicles.map((vehicle) => {
        const isSelected = selected.some(v => v.id === vehicle.id);
        return (
          <div
            key={vehicle.id}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
              isSelected
                ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg'
                : 'bg-white/10 border-2 border-white/20 hover:bg-white/15 hover:border-white/30'
            }`}
            onClick={() => handleVehicleToggle(vehicle)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-white text-lg">{vehicle.name}</h3>
                <p className="text-white/70 text-sm">
                  {vehicle.width} × {vehicle.height} × {vehicle.length} мм
                </p>
                {vehicle.maxPayloadKg && (
                  <p className="text-white/70 text-sm">
                    Грузоподъемность: {vehicle.maxPayloadKg} кг
                  </p>
                )}
              </div>
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                isSelected 
                  ? 'bg-blue-500 border-blue-400' 
                  : 'border-white/40'
              }`}>
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-green-500/20 rounded-xl border border-green-400/30">
          <div className="text-green-200 text-sm">
            ✅ Выбрано машин для анализа: {selected.length}
          </div>
        </div>
      )}
    </div>
  );
}







