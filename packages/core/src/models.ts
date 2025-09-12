export type MM = number; // millimeters

export interface Vehicle {
  id: string; name: string;
  width: MM; height: MM; length: MM;
  maxPayloadKg?: number;
}

// Universal item interface for any type of item
export interface UniversalItem {
  id: string;
  name?: string;
  type?: string;
  category?: string;
  dimensions: {
    width?: MM;
    height?: MM;
    depth?: MM;
    length?: MM;
    diameter?: MM;
    [key: string]: MM | undefined; // Allow any dimension
  };
  qty: number;
  weightKg?: number;
  material?: string;
  notes?: string;
  [key: string]: any; // Allow any additional properties
}

// Legacy interface for backward compatibility
export interface DuctItem {
  id: string;
  type: 'rect'|'round';
  w?: MM; h?: MM; d?: MM; // rect: w,h,length; round: d,length
  length: MM;
  qty: number;
  weightKg?: number;
}

export interface Placement {
  itemId: string; index: number;
  x: MM; y: MM; z: MM;
  rot: [0|90,0|90,0|90];
  layer: number; row: number;
}

export interface PackRequest { vehicle: Vehicle; items: DuctItem[]; }
export interface PackResult {
  placements: Placement[];
  binsUsed: number;
  rows: Record<number, Placement[]>;
  metrics: {
    volumeFill: number;
    weightPerLayer?: number[];
    stabilityScore?: number;
  };
  snapshots: string[];
}
