'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@ventprom/core';

interface VehicleSelectorProps {
  onSelect: (vehicle: Vehicle) => void;
  selected: Vehicle | null;
}

export default function VehicleSelector({ onSelect, selected }: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:3001/presets');
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

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selected?.id === vehicle.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelect(vehicle)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
              <p className="text-sm text-gray-600">
                {vehicle.width} × {vehicle.height} × {vehicle.length} mm
              </p>
              {vehicle.maxPayloadKg && (
                <p className="text-sm text-gray-600">
                  Max payload: {vehicle.maxPayloadKg} kg
                </p>
              )}
            </div>
            {selected?.id === vehicle.id && (
              <div className="text-blue-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}




