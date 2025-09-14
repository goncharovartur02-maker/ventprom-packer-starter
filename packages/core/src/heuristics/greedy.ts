import { Vehicle, DuctItem, Placement, PackingResult, MM } from '../models';
import { fitsWithin, collide } from '../constraints';
import { LayerRules } from './layer_rules';
import { FlangeRules } from '../flange-rules';

/**
 * Greedy First Fit Decreasing (FFD) алгоритм упаковки
 * Быстрый алгоритм для простых случаев
 */
export class GreedyFFD {
  private layerRules = new LayerRules();
  private flangeRules = new FlangeRules();
  private readonly GRID_SIZE: MM = 10; // Более крупная сетка для скорости

  /**
   * Основной метод упаковки
   */
  pack(vehicle: Vehicle, items: DuctItem[]): PackingResult {
    console.log('GreedyFFD: Быстрая упаковка жадным алгоритмом');
    
    // Расширяем элементы по количеству
    const expandedItems = this.expandItems(items);
    
    // Сортируем по убыванию объема (FFD - First Fit Decreasing)
    const sortedItems = this.sortItemsByVolume(expandedItems);
    
    // Применяем правила слоев
    const layeredItems = this.layerRules.sortForVentilationLayering(sortedItems);
    
    const placements: Placement[] = [];
    let currentBin = 0;
    
    for (const item of layeredItems) {
      const placement = this.findFirstFit(vehicle, item, placements, currentBin);
      
      if (placement) {
        placements.push(placement);
      } else {
        // Не помещается в текущий бин - создаем новый
        currentBin++;
        const newBinPlacement = this.placeInNewBin(vehicle, item, currentBin);
        if (newBinPlacement) {
          placements.push(newBinPlacement);
        }
      }
    }
    
    return {
      placements,
      binsUsed: currentBin + 1,
      rows: this.organizeByRows(placements),
      metrics: this.calculateMetrics(vehicle, placements),
      snapshots: [`GreedyFFD: ${placements.length} элементов упаковано в ${currentBin + 1} машин`]
    };
  }

  /**
   * Расширяет элементы по количеству
   */
  private expandItems(items: DuctItem[]): DuctItem[] {
    const expanded: DuctItem[] = [];
    
    items.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        expanded.push({
          ...item,
          id: `${item.id}_${i + 1}`,
          qty: 1
        });
      }
    });
    
    return expanded;
  }

  /**
   * Сортирует элементы по объему (убывание)
   */
  private sortItemsByVolume(items: DuctItem[]): DuctItem[] {
    return items.sort((a, b) => {
      const volumeA = this.calculateVolume(a);
      const volumeB = this.calculateVolume(b);
      return volumeB - volumeA; // По убыванию
    });
  }

  /**
   * Рассчитывает объем элемента
   */
  private calculateVolume(item: DuctItem): number {
    if (item.type === 'rect') {
      return (item.w || 100) * (item.h || 100) * item.length;
    } else {
      const radius = (item.d || 100) / 2;
      return Math.PI * radius * radius * item.length;
    }
  }

  /**
   * Ищет первое подходящее место (First Fit)
   */
  private findFirstFit(
    vehicle: Vehicle,
    item: DuctItem,
    existingPlacements: Placement[],
    binNumber: number
  ): Placement | null {
    const orientations = this.getOrientations(item);
    
    // Фильтруем размещения только для текущего бина
    const currentBinPlacements = existingPlacements.filter(p => p.index === binNumber);
    
    for (const orientation of orientations) {
      const { w, h, l } = orientation;
      
      // Пробуем разместить с шагом сетки
      for (let x = 0; x <= vehicle.width - w; x += this.GRID_SIZE) {
        for (let y = 0; y <= vehicle.height - h; y += this.GRID_SIZE) {
          for (let z = 0; z <= vehicle.length - l; z += this.GRID_SIZE) {
            const placement: Placement = {
              itemId: item.id,
              index: binNumber,
              x, y, z,
              rot: orientation.rot,
              layer: Math.floor(y / 200), // Слой каждые 20см
              row: Math.floor(z / 1000),  // Ряд каждый метр
            };
            
            if (this.isValidPlacement(vehicle, item, placement, currentBinPlacements)) {
              return placement;
            }
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Размещает элемент в новом бине
   */
  private placeInNewBin(vehicle: Vehicle, item: DuctItem, binNumber: number): Placement | null {
    const orientations = this.getOrientations(item);
    
    for (const orientation of orientations) {
      const { w, h, l } = orientation;
      
      if (fitsWithin(vehicle, { x: 0, y: 0, z: 0 } as Placement, w, h, l)) {
        return {
          itemId: item.id,
          index: binNumber,
          x: 0, y: 0, z: 0,
          rot: orientation.rot,
          layer: 0,
          row: 0,
        };
      }
    }
    
    return null;
  }

  /**
   * Проверяет валидность размещения
   */
  private isValidPlacement(
    vehicle: Vehicle,
    item: DuctItem,
    placement: Placement,
    existingPlacements: Placement[]
  ): boolean {
    const orientation = this.getOrientationFromPlacement(item, placement);
    const { w, h, l } = orientation;
    
    // Проверяем границы кузова
    if (!fitsWithin(vehicle, placement, w, h, l)) {
      return false;
    }
    
    // Проверяем коллизии
    if (this.hasCollision(placement, w, h, l, existingPlacements)) {
      return false;
    }
    
    // Проверяем правила фланцев
    const existingItems = existingPlacements.map(p => this.getItemById(p.itemId, [item]));
    if (!this.flangeRules.canPlaceNear(item, placement, existingItems, existingPlacements)) {
      return false;
    }
    
    return true;
  }

  /**
   * Получает возможные ориентации элемента
   */
  private getOrientations(item: DuctItem): Array<{ w: MM; h: MM; l: MM; rot: [0|90, 0|90, 0|90] }> {
    const orientations = [];
    
    if (item.type === 'rect') {
      const w = item.w || 100;
      const h = item.h || 100;
      const l = item.length;
      
      // Основная ориентация
      orientations.push({ w, h, l, rot: [0, 0, 0] as [0|90, 0|90, 0|90] });
      
      // Поворот на 90° по Z (в плоскости XY)
      orientations.push({ w: h, h: w, l, rot: [0, 0, 90] as [0|90, 0|90, 0|90] });
      
      // Поворот на 90° по Y (в плоскости XZ) - только если длина меньше ширины/высоты
      if (l < Math.max(w, h)) {
        orientations.push({ w: l, h, l: w, rot: [0, 90, 0] as [0|90, 0|90, 0|90] });
        orientations.push({ w, h: l, l: h, rot: [90, 0, 0] as [0|90, 0|90, 0|90] });
      }
    } else {
      // Круглый воздуховод
      const d = item.d || 100;
      const l = item.length;
      
      orientations.push({ w: d, h: d, l, rot: [0, 0, 0] as [0|90, 0|90, 0|90] });
      
      // Поворот только если длина меньше диаметра
      if (l < d) {
        orientations.push({ w: l, h: d, l: d, rot: [0, 90, 0] as [0|90, 0|90, 0|90] });
      }
    }
    
    return orientations;
  }

  /**
   * Получает ориентацию из размещения
   */
  private getOrientationFromPlacement(item: DuctItem, placement: Placement): { w: MM; h: MM; l: MM } {
    const orientations = this.getOrientations(item);
    // Находим ориентацию по rotation
    const orientation = orientations.find(o => 
      o.rot[0] === placement.rot[0] && 
      o.rot[1] === placement.rot[1] && 
      o.rot[2] === placement.rot[2]
    );
    
    return orientation || orientations[0];
  }

  /**
   * Проверяет коллизии
   */
  private hasCollision(
    placement: Placement,
    w: MM, h: MM, l: MM,
    existingPlacements: Placement[]
  ): boolean {
    for (const existing of existingPlacements) {
      // Получаем размеры существующего элемента (временно используем фиксированные)
      const existingW = 100, existingH = 100, existingL = 1000;
      
      if (collide(
        placement, w, h, l,
        existing, existingW, existingH, existingL
      )) {
        return true;
      }
    }
    return false;
  }

  /**
   * Организует размещения по рядам
   */
  private organizeByRows(placements: Placement[]): Record<number, Placement[]> {
    const rows: Record<number, Placement[]> = {};
    
    placements.forEach(placement => {
      const row = placement.row;
      if (!rows[row]) {
        rows[row] = [];
      }
      rows[row].push(placement);
    });
    
    return rows;
  }

  /**
   * Рассчитывает метрики упаковки
   */
  private calculateMetrics(vehicle: Vehicle, placements: Placement[]): PackingResult['metrics'] {
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    let usedVolume = 0;
    
    placements.forEach(placement => {
      // Временно используем фиксированный объем
      usedVolume += 100 * 100 * 1000; // 100x100x1000mm
    });
    
    return {
      volumeFill: usedVolume / vehicleVolume,
      stabilityScore: 75 // Базовая оценка для жадного алгоритма
    };
  }

  /**
   * Получает элемент по ID (временная реализация)
   */
  private getItemById(itemId: string, items: DuctItem[]): DuctItem {
    return items.find(item => item.id === itemId) || {
      id: itemId,
      type: 'rect',
      w: 100, h: 100, length: 1000,
      qty: 1,
      weightKg: 10
    } as DuctItem;
  }
}

// Legacy function for backward compatibility
export function greedy(vehicle: Vehicle, items: DuctItem[]): PackingResult {
  const algorithm = new GreedyFFD();
  return algorithm.pack(vehicle, items);
}
