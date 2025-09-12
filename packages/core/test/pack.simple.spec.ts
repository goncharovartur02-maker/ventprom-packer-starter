import { Pack3D } from '../src/pack3d';
import { Vehicle, DuctItem } from '../src/models';

describe('Pack3D - Simple Tests', () => {
  let packer: Pack3D;
  let vehicle: Vehicle;
  let items: DuctItem[];

  beforeEach(() => {
    packer = new Pack3D();
    vehicle = {
      id: 'test-vehicle',
      name: 'Test Vehicle',
      width: 2400,
      height: 2500,
      length: 12000,
      maxPayloadKg: 20000,
    };
  });

  it('should pack a single rectangular item', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 500,
        h: 300,
        length: 1000,
        qty: 1,
        weightKg: 10,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(1);
    expect(result.binsUsed).toBe(1);
    expect(result.placements[0].itemId).toBe('R1');
    expect(result.placements[0].x).toBe(0);
    expect(result.placements[0].y).toBe(0);
    expect(result.placements[0].z).toBe(0);
  });

  it('should pack multiple rectangular items', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 500,
        h: 300,
        length: 1000,
        qty: 1,
        weightKg: 10,
      },
      {
        id: 'R2',
        type: 'rect',
        w: 400,
        h: 200,
        length: 800,
        qty: 1,
        weightKg: 8,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(2);
    expect(result.binsUsed).toBe(1);
    expect(result.placements.map(p => p.itemId)).toContain('R1');
    expect(result.placements.map(p => p.itemId)).toContain('R2');
  });

  it('should pack round items', () => {
    items = [
      {
        id: 'C1',
        type: 'round',
        d: 200,
        length: 1000,
        qty: 1,
        weightKg: 5,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(1);
    expect(result.binsUsed).toBe(1);
    expect(result.placements[0].itemId).toBe('C1');
  });

  it('should handle items with quantity > 1', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 500,
        h: 300,
        length: 1000,
        qty: 3,
        weightKg: 10,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(3);
    expect(result.binsUsed).toBe(1);
    
    // All placements should have the same base item ID
    const itemIds = result.placements.map(p => p.itemId);
    expect(itemIds.every(id => id.startsWith('R1_'))).toBe(true);
  });

  it('should use multiple bins when items do not fit in one', () => {
    // Create items that are too large to fit in one bin
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 2000,
        h: 2000,
        length: 6000,
        qty: 1,
        weightKg: 1000,
      },
      {
        id: 'R2',
        type: 'rect',
        w: 2000,
        h: 2000,
        length: 6000,
        qty: 1,
        weightKg: 1000,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(2);
    expect(result.binsUsed).toBe(2);
  });

  it('should organize placements by rows', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 500,
        h: 300,
        length: 1000,
        qty: 1,
        weightKg: 10,
      },
      {
        id: 'R2',
        type: 'rect',
        w: 400,
        h: 200,
        length: 800,
        qty: 1,
        weightKg: 8,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.rows).toBeDefined();
    expect(Object.keys(result.rows).length).toBeGreaterThan(0);
    
    // Check that all placements are in rows
    const totalPlacementsInRows = Object.values(result.rows).reduce((sum, row) => sum + row.length, 0);
    expect(totalPlacementsInRows).toBe(result.placements.length);
  });

  it('should calculate volume fill metrics', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 500,
        h: 300,
        length: 1000,
        qty: 1,
        weightKg: 10,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    expect(result.metrics).toBeDefined();
    expect(result.metrics.volumeFill).toBeGreaterThan(0);
    expect(result.metrics.volumeFill).toBeLessThanOrEqual(1);
  });

  it('should handle empty item list', () => {
    items = [];

    const result = packer.packBasic(vehicle, items);

    expect(result.placements).toHaveLength(0);
    expect(result.binsUsed).toBe(0);
    expect(result.rows).toEqual({});
    expect(result.metrics.volumeFill).toBe(0);
  });

  it('should handle items that are too large for vehicle', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 3000, // Larger than vehicle width (2400)
        h: 3000, // Larger than vehicle height (2500)
        length: 15000, // Larger than vehicle length (12000)
        qty: 1,
        weightKg: 10,
      },
    ];

    const result = packer.packBasic(vehicle, items);

    // Should not be able to place the item
    expect(result.placements).toHaveLength(0);
    expect(result.binsUsed).toBe(0);
  });
});