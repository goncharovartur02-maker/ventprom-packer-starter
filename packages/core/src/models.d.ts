export type MM = number;
export interface Vehicle {
    id: string;
    name: string;
    width: MM;
    height: MM;
    length: MM;
    maxPayloadKg?: number;
}
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
        [key: string]: MM | undefined;
    };
    qty: number;
    weightKg?: number;
    material?: string;
    notes?: string;
    [key: string]: any;
}
export interface DuctItem {
    id: string;
    type: 'rect' | 'round';
    w?: MM;
    h?: MM;
    d?: MM;
    length: MM;
    qty: number;
    weightKg?: number;
}
export interface Placement {
    itemId: string;
    index: number;
    x: MM;
    y: MM;
    z: MM;
    rot: [0 | 90, 0 | 90, 0 | 90];
    layer: number;
    row: number;
}
export interface PackRequest {
    vehicle: Vehicle;
    items: DuctItem[];
}
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
//# sourceMappingURL=models.d.ts.map