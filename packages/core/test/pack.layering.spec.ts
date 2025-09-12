import { LayerRules } from '../src/heuristics/layer_rules';
import { DuctItem } from '../src/models';

describe('LayerRules', () => {
  let layerRules: LayerRules;

  beforeEach(() => {
    layerRules = new LayerRules();
  });

  it('should sort items by size (big items first)', () => {
    const items: DuctItem[] = [
      {
        id: 'small',
        type: 'rect',
        w: 100,
        h: 100,
        length: 500,
        qty: 1,
        weightKg: 5,
      },
      {
        id: 'large',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        weightKg: 20,
      },
      {
        id: 'medium',
        type: 'rect',
        w: 300,
        h: 300,
        length: 800,
        qty: 1,
        weightKg: 10,
      },
    ];

    const sorted = layerRules.sortForLayering(items);

    expect(sorted[0].id).toBe('large');
    expect(sorted[1].id).toBe('medium');
    expect(sorted[2].id).toBe('small');
  });

  it('should sort round items by diameter', () => {
    const items: DuctItem[] = [
      {
        id: 'small-round',
        type: 'round',
        d: 100,
        length: 500,
        qty: 1,
        weightKg: 3,
      },
      {
        id: 'large-round',
        type: 'round',
        d: 300,
        length: 1000,
        qty: 1,
        weightKg: 15,
      },
    ];

    const sorted = layerRules.sortForLayering(items);

    expect(sorted[0].id).toBe('large-round');
    expect(sorted[1].id).toBe('small-round');
  });

  it('should consider weight in sorting', () => {
    const items: DuctItem[] = [
      {
        id: 'light-large',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        weightKg: 5, // Light but large
      },
      {
        id: 'heavy-small',
        type: 'rect',
        w: 200,
        h: 200,
        length: 500,
        qty: 1,
        weightKg: 20, // Heavy but small
      },
    ];

    const sorted = layerRules.sortForLayering(items);

    // The heavy-small item should come first due to weight
    expect(sorted[0].id).toBe('heavy-small');
    expect(sorted[1].id).toBe('light-large');
  });

  it('should check if items can stack on top of each other', () => {
    const bottomItem: DuctItem = {
      id: 'bottom',
      type: 'rect',
      w: 500,
      h: 500,
      length: 1000,
      qty: 1,
      weightKg: 20,
    };

    const topItem: DuctItem = {
      id: 'top',
      type: 'rect',
      w: 300,
      h: 300,
      length: 800,
      qty: 1,
      weightKg: 10,
    };

    const tooLargeItem: DuctItem = {
      id: 'too-large',
      type: 'rect',
      w: 600,
      h: 600,
      length: 1200,
      qty: 1,
      weightKg: 15,
    };

    expect(layerRules.canStackOnTop(bottomItem, topItem)).toBe(true);
    expect(layerRules.canStackOnTop(bottomItem, tooLargeItem)).toBe(false);
  });

  it('should group items into layers', () => {
    const items: DuctItem[] = [
      {
        id: 'large1',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        weightKg: 20,
      },
      {
        id: 'large2',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        weightKg: 20,
      },
      {
        id: 'small1',
        type: 'rect',
        w: 200,
        h: 200,
        length: 500,
        qty: 1,
        weightKg: 5,
      },
      {
        id: 'small2',
        type: 'rect',
        w: 200,
        h: 200,
        length: 500,
        qty: 1,
        weightKg: 5,
      },
    ];

    const layers = layerRules.groupIntoLayers(items);

    expect(layers).toHaveLength(2);
    
    // First layer should contain large items
    expect(layers[0]).toHaveLength(2);
    expect(layers[0].every(item => item.id.startsWith('large'))).toBe(true);
    
    // Second layer should contain small items
    expect(layers[1]).toHaveLength(2);
    expect(layers[1].every(item => item.id.startsWith('small'))).toBe(true);
  });

  it('should calculate layer stability score', () => {
    const items: DuctItem[] = [
      {
        id: 'item1',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        weightKg: 20,
      },
      {
        id: 'item2',
        type: 'rect',
        w: 400,
        h: 400,
        length: 800,
        qty: 1,
        weightKg: 15,
      },
    ];

    const stabilityScore = layerRules.calculateLayerStability(items);

    expect(stabilityScore).toBeGreaterThan(0);
    expect(typeof stabilityScore).toBe('number');
  });

  it('should handle empty item list', () => {
    const items: DuctItem[] = [];

    const sorted = layerRules.sortForLayering(items);
    const layers = layerRules.groupIntoLayers(items);
    const stabilityScore = layerRules.calculateLayerStability(items);

    expect(sorted).toHaveLength(0);
    expect(layers).toHaveLength(0);
    expect(stabilityScore).toBe(0);
  });

  it('should handle items without weight', () => {
    const items: DuctItem[] = [
      {
        id: 'no-weight',
        type: 'rect',
        w: 500,
        h: 500,
        length: 1000,
        qty: 1,
        // weightKg is undefined
      },
    ];

    const sorted = layerRules.sortForLayering(items);
    const stabilityScore = layerRules.calculateLayerStability(items);

    expect(sorted).toHaveLength(1);
    expect(stabilityScore).toBe(0); // No weight = 0 stability
  });
});