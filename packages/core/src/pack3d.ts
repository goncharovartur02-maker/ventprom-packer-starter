import { PackRequest, PackResult, Vehicle, DuctItem, Placement, MM } from './models';
import { fitsWithin, collide } from './constraints';
import { BeamSearch } from './heuristics/beam';
import { LayerRules } from './heuristics/layer_rules';

export class Pack3D {
  private readonly GRID_SIZE: MM = 5; // 5mm grid
  private beamSearch: BeamSearch;
  private layerRules: LayerRules;

  constructor() {
    this.beamSearch = new BeamSearch();
    this.layerRules = new LayerRules();
  }

  pack(vehicle: Vehicle, items: DuctItem[]): PackResult {
    console.log('Pack3D: Начинаем упаковку с профессиональными правилами для воздуховодов');
    
    // Expand items by quantity
    const expandedItems = this.expandItems(items);
    
    // Optimize with nesting (матрешка)
    const nestedItems = this.optimizeWithNesting(expandedItems);
    
    // Sort items by ventilation-specific layer rules
    const sortedItems = this.layerRules.sortForVentilationLayering(nestedItems);
    
    // Group into layers with safety checks
    const layers = this.layerRules.groupIntoVentilationLayers(sortedItems);
    
    // Validate packing configuration
    const validation = this.layerRules.validatePackingConfiguration(layers, vehicle);
    
    if (!validation.isValid) {
      console.error('Pack3D: Ошибки в конфигурации упаковки:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Pack3D: Предупреждения:', validation.warnings);
    }
    
    // Use beam search for optimal packing
    const result = this.beamSearch.search(vehicle, sortedItems, this.GRID_SIZE);
    
    // Add validation info to result
    (result as any).validation = validation;
    (result as any).layersCount = layers.length;
    
    console.log(`Pack3D: Упаковка завершена. Слоев: ${layers.length}, Предупреждений: ${validation.warnings.length}`);
    
    return result;
  }

  private expandItems(items: DuctItem[]): DuctItem[] {
    const expanded: DuctItem[] = [];
    
    for (const item of items) {
      for (let i = 0; i < item.qty; i++) {
        expanded.push({
          ...item,
          id: `${item.id}_${i}`,
          qty: 1,
        });
      }
    }
    
    return expanded;
  }

  // Basic FFD (First Fit Decreasing) algorithm
  packBasic(vehicle: Vehicle, items: DuctItem[]): PackResult {
    const expandedItems = this.expandItems(items);
    const sortedItems = this.layerRules.sortForLayering(expandedItems);
    
    const placements: Placement[] = [];
    const bins: Placement[][] = [];
    let currentBin: Placement[] = [];
    
    for (const item of sortedItems) {
      let placed = false;
      
      // Try to place in current bin first
      const placement = this.findPlacement(vehicle, item, currentBin);
      if (placement) {
        currentBin.push(placement);
        placements.push(placement);
        placed = true;
      } else {
        // Try existing bins
        for (let binIndex = 0; binIndex < bins.length; binIndex++) {
          const placement = this.findPlacement(vehicle, item, bins[binIndex]);
          if (placement) {
            bins[binIndex].push(placement);
            placements.push(placement);
            placed = true;
            break;
          }
        }
      }
      
      // If couldn't place in any existing bin, create new bin
      if (!placed) {
        const placement = this.findPlacement(vehicle, item, []);
        if (placement) {
          currentBin = [placement];
          bins.push(currentBin);
          placements.push(placement);
        }
      }
    }
    
    // Organize by rows and layers
    const rows = this.organizeByRows(placements);
    const metrics = this.calculateMetrics(vehicle, placements);
    
    return {
      placements,
      binsUsed: bins.length + (currentBin.length > 0 ? 1 : 0),
      rows,
      metrics,
      snapshots: [], // Will be populated by 3D renderer
    };
  }

  private findPlacement(vehicle: Vehicle, item: DuctItem, existingPlacements: Placement[]): Placement | null {
    const orientations = this.getOrientations(item);
    
    for (const orientation of orientations) {
      const { w, h, l } = orientation;
      
      // Try all grid positions
      for (let x = 0; x <= vehicle.width - w; x += this.GRID_SIZE) {
        for (let y = 0; y <= vehicle.height - h; y += this.GRID_SIZE) {
          for (let z = 0; z <= vehicle.length - l; z += this.GRID_SIZE) {
            const placement: Placement = {
              itemId: item.id,
              index: 0,
              x,
              y,
              z,
              rot: orientation.rot,
              layer: 0,
              row: 0,
            };
            
            // Check if placement fits and doesn't collide
            if (fitsWithin(vehicle, placement, w, h, l) && 
                !this.hasCollision(placement, w, h, l, existingPlacements)) {
              return placement;
            }
          }
        }
      }
    }
    
    return null;
  }

  private getOrientations(item: DuctItem): Array<{ w: MM; h: MM; l: MM; rot: [0|90, 0|90, 0|90] }> {
    const orientations: Array<{ w: MM; h: MM; l: MM; rot: [0|90, 0|90, 0|90] }> = [];
    
    if (item.type === 'rect' && item.w && item.h) {
      // 6 orientations for rectangular items
      orientations.push(
        { w: item.w, h: item.h, l: item.length, rot: [0, 0, 0] },
        { w: item.h, h: item.w, l: item.length, rot: [0, 0, 90] },
        { w: item.w, h: item.length, l: item.h, rot: [0, 90, 0] },
        { w: item.length, h: item.w, l: item.h, rot: [0, 90, 90] },
        { w: item.h, h: item.length, l: item.w, rot: [90, 0, 0] },
        { w: item.length, h: item.h, l: item.w, rot: [90, 0, 90] },
      );
    } else if (item.type === 'round' && item.d) {
      // 2 orientations for round items (diameter is same in all directions)
      orientations.push(
        { w: item.d, h: item.d, l: item.length, rot: [0, 0, 0] },
        { w: item.d, h: item.length, l: item.d, rot: [0, 90, 0] },
      );
    }
    
    return orientations;
  }

  private hasCollision(
    placement: Placement, 
    w: MM, h: MM, l: MM, 
    existingPlacements: Placement[]
  ): boolean {
    for (const existing of existingPlacements) {
      const existingItem = this.getItemDimensions(existing);
      if (collide(placement, w, h, l, existing, existingItem.w, existingItem.h, existingItem.l)) {
        return true;
      }
    }
    return false;
  }

  private getItemDimensions(placement: Placement): { w: MM; h: MM; l: MM } {
    // This would need to be implemented based on the original item data
    // For now, return default dimensions
    return { w: 100, h: 100, l: 100 };
  }

  private organizeByRows(placements: Placement[]): Record<number, Placement[]> {
    const rows: Record<number, Placement[]> = {};
    
    for (const placement of placements) {
      const row = Math.floor(placement.z / 1000); // Group by 1m sections
      if (!rows[row]) {
        rows[row] = [];
      }
      rows[row].push(placement);
    }
    
    return rows;
  }

  private calculateMetrics(vehicle: Vehicle, placements: Placement[]): PackResult['metrics'] {
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    let usedVolume = 0;
    
    for (const placement of placements) {
      const dims = this.getItemDimensions(placement);
      usedVolume += dims.w * dims.h * dims.l;
    }
    
    return {
      volumeFill: usedVolume / vehicleVolume,
    };
  }

  // Матрешка алгоритм - проверка возможности вложения
  private checkNesting(outer: DuctItem, inner: DuctItem): boolean {
    // Проверка возможности вложения inner в outer
    if (outer.type === 'round' && inner.type === 'round') {
      const outerRadius = outer.d! / 2;
      const innerRadius = inner.d! / 2;
      const clearance = 10; // 10mm зазор
      return innerRadius + clearance < outerRadius && inner.length <= outer.length;
    }
    
    if (outer.type === 'rect' && inner.type === 'rect') {
      const clearance = 10;
      return inner.w! + clearance < outer.w! && 
             inner.h! + clearance < outer.h! && 
             inner.length <= outer.length;
    }
    
    if (outer.type === 'rect' && inner.type === 'round') {
      const clearance = 10;
      const minDimension = Math.min(outer.w!, outer.h!);
      return inner.d! + clearance < minDimension && inner.length <= outer.length;
    }
    
    return false;
  }

  // Оптимизация упаковки с учетом вложенности (матрешка)
  private optimizeWithNesting(items: DuctItem[]): DuctItem[] {
    const nested: DuctItem[] = [];
    const remaining: DuctItem[] = [...items];
    
    // Сортируем по размеру (большие первыми)
    remaining.sort((a, b) => {
      const volumeA = this.calculateVolume(a);
      const volumeB = this.calculateVolume(b);
      return volumeB - volumeA;
    });
    
    for (let i = 0; i < remaining.length; i++) {
      const outer = remaining[i];
      const innerItems: DuctItem[] = [];
      
      for (let j = i + 1; j < remaining.length; j++) {
        const inner = remaining[j];
        if (this.checkNesting(outer, inner)) {
          innerItems.push(inner);
          remaining.splice(j, 1);
          j--;
        }
      }
      
      if (innerItems.length > 0) {
        // Создаем композитный элемент с вложенными воздуховодами
        nested.push({
          ...outer,
          id: `nested_${outer.id}`,
          weightKg: (outer.weightKg || 0) + innerItems.reduce((sum, item) => sum + (item.weightKg || 0), 0),
          // Добавляем информацию о вложенных элементах
          nestedItems: innerItems
        } as DuctItem & { nestedItems: DuctItem[] });
        
        console.log(`Матрешка: ${outer.id} содержит ${innerItems.length} вложенных воздуховодов:`, 
                   innerItems.map(item => item.id));
      } else {
        nested.push(outer);
      }
    }
    
    console.log(`Оптимизация матрешка: ${items.length} → ${nested.length} элементов 
                (экономия ${items.length - nested.length} мест)`);
    
    return nested;
  }

  // Вспомогательный метод для расчета объема воздуховода
  private calculateVolume(item: DuctItem): number {
    if (item.type === 'round' && item.d) {
      const radius = item.d / 2;
      return Math.PI * radius * radius * item.length;
    } else if (item.type === 'rect' && item.w && item.h) {
      return item.w * item.h * item.length;
    }
    return 0;
  }
}

// Legacy function for backward compatibility
export function pack3d(req: PackRequest): PackResult {
  const packer = new Pack3D();
  return packer.pack(req.vehicle, req.items);
}
