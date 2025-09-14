// Simple types for API without external dependencies
export interface UniversalItem {
  id: string;
  type: string;
  dimensions: { [key: string]: number };
  qty: number;
  weightKg: number;
}

export interface Vehicle {
  id: string;
  name: string;
  width: number;
  height: number;
  length: number;
  maxPayloadKg: number;
}

export interface DuctItem {
  id: string;
  type: string;
  w?: number;
  h?: number;
  d?: number;
  length?: number;
  qty: number;
  weightKg: number;
}

export interface PackRequest {
  vehicle: Vehicle;
  items: DuctItem[];
}

export interface PackResult {
  success: boolean;
  items: DuctItem[];
  vehicle: Vehicle;
  totalWeight: number;
  utilization: number;
  message?: string;
}
