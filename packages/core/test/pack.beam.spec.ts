import { BeamSearch } from '../src/heuristics/beam';
import { Vehicle, DuctItem } from '../src/models';

describe('BeamSearch', () => {
  let beamSearch: BeamSearch;
  let vehicle: Vehicle;
  let items: DuctItem[];

  beforeEach(() => {
    beamSearch = new BeamSearch();
    vehicle = {
      id: 'test-vehicle',
      name: 'Test Vehicle',
      width: 2400,
      height: 2500,
      length: 12000,
      maxPayloadKg: 20000,
    };
  });

  it('should pack a single item', () => {
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

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(1);
    expect(result.binsUsed).toBe(1);
    expect(result.placements[0].itemId).toBe('R1');
  });

  it('should pack multiple items optimally', () => {
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
      {
        id: 'R3',
        type: 'rect',
        w: 300,
        h: 150,
        length: 600,
        qty: 1,
        weightKg: 5,
      },
    ];

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(3);
    expect(result.binsUsed).toBe(1);
    expect(result.placements.map(p => p.itemId)).toContain('R1');
    expect(result.placements.map(p => p.itemId)).toContain('R2');
    expect(result.placements.map(p => p.itemId)).toContain('R3');
  });

  it('should use multiple bins when necessary', () => {
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

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(2);
    expect(result.binsUsed).toBe(2);
  });

  it('should handle round items', () => {
    items = [
      {
        id: 'C1',
        type: 'round',
        d: 200,
        length: 1000,
        qty: 1,
        weightKg: 5,
      },
      {
        id: 'C2',
        type: 'round',
        d: 150,
        length: 800,
        qty: 1,
        weightKg: 3,
      },
    ];

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(2);
    expect(result.binsUsed).toBe(1);
    expect(result.placements.map(p => p.itemId)).toContain('C1');
    expect(result.placements.map(p => p.itemId)).toContain('C2');
  });

  it('should organize results by rows', () => {
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

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.rows).toBeDefined();
    expect(Object.keys(result.rows).length).toBeGreaterThan(0);
    
    // Check that all placements are in rows
    const totalPlacementsInRows = Object.values(result.rows).reduce((sum, row) => sum + row.length, 0);
    expect(totalPlacementsInRows).toBe(result.placements.length);
  });

  it('should calculate metrics', () => {
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

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.metrics).toBeDefined();
    expect(result.metrics.volumeFill).toBeGreaterThan(0);
    expect(result.metrics.volumeFill).toBeLessThanOrEqual(1);
  });

  it('should handle empty item list', () => {
    items = [];

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(0);
    expect(result.binsUsed).toBe(1); // At least one bin is created
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

    expect(() => {
      beamSearch.search(vehicle, items, 5);
    }).toThrow('No valid packing found');
  });

  it('should try different orientations for rectangular items', () => {
    items = [
      {
        id: 'R1',
        type: 'rect',
        w: 1000, // This won't fit in width (2400) but will fit in length (12000)
        h: 300,
        length: 500,
        qty: 1,
        weightKg: 10,
      },
    ];

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(1);
    expect(result.placements[0].itemId).toBe('R1');
    // The item should be rotated to fit
    expect(result.placements[0].rot).not.toEqual([0, 0, 0]);
  });

  it('should handle mixed item types', () => {
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
        id: 'C1',
        type: 'round',
        d: 200,
        length: 800,
        qty: 1,
        weightKg: 5,
      },
    ];

    const result = beamSearch.search(vehicle, items, 5);

    expect(result.placements).toHaveLength(2);
    expect(result.binsUsed).toBe(1);
    expect(result.placements.map(p => p.itemId)).toContain('R1');
    expect(result.placements.map(p => p.itemId)).toContain('C1');
  });
});