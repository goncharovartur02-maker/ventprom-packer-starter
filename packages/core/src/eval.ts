import { PackingResult, Vehicle, Placement, DuctItem } from './models';
import { ItemRegistry } from './item-registry';

export class Evaluator {
  private itemRegistry = new ItemRegistry();
  calculateVolumeFill(vehicle: Vehicle, placements: Placement[]): number {
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    let usedVolume = 0;
    
    for (const placement of placements) {
      const dims = this.getItemDimensions(placement);
      usedVolume += dims.w * dims.h * dims.l;
    }
    
    return usedVolume / vehicleVolume;
  }

  calculateStabilityScore(placements: Placement[]): number {
    if (placements.length === 0) return 0;
    
    // Calculate center of gravity
    const totalWeight = placements.reduce((sum, p) => sum + (this.getItemWeight(p) || 0), 0);
    if (totalWeight === 0) return 0;
    
    const centerOfGravityY = placements.reduce((sum, p) => {
      const weight = this.getItemWeight(p) || 0;
      return sum + (p.y * weight);
    }, 0) / totalWeight;
    
    // Lower center of gravity = more stable
    const maxHeight = Math.max(...placements.map(p => p.y));
    return 1 - (centerOfGravityY / maxHeight);
  }

  calculateWeightDistribution(placements: Placement[]): number[] {
    // Calculate weight per layer (assuming 100mm layer height)
    const layerHeight = 100;
    const maxLayer = Math.max(...placements.map(p => Math.floor(p.y / layerHeight)));
    const weightPerLayer: number[] = new Array(maxLayer + 1).fill(0);
    
    for (const placement of placements) {
      const layer = Math.floor(placement.y / layerHeight);
      const weight = this.getItemWeight(placement) || 0;
      weightPerLayer[layer] += weight;
    }
    
    return weightPerLayer;
  }

  calculatePackingEfficiency(result: PackingResult, items: DuctItem[]): number {
    // Регистрируем элементы для правильных расчетов
    this.itemRegistry.registerItems(items);
    this.itemRegistry.registerPlacements(result.placements);
    
    const volumeScore = result.metrics.volumeFill;
    const stabilityScore = result.metrics.stabilityScore || 0;
    const binsPenalty = 1 / result.binsUsed; // Fewer bins = better
    
    // Дополнительные метрики на основе реальных данных
    const weightBalance = this.calculateWeightBalance(result.placements);
    const flangeCompliance = this.calculateFlangeCompliance(result.placements);
    
    return volumeScore * 0.4 + stabilityScore * 0.25 + binsPenalty * 0.15 + weightBalance * 0.1 + flangeCompliance * 0.1;
  }

  compareResults(result1: PackingResult, result2: PackingResult, items: DuctItem[] = []): number {
    const score1 = this.calculatePackingEfficiency(result1, items);
    const score2 = this.calculatePackingEfficiency(result2, items);
    
    return score1 - score2; // Positive = result1 is better
  }

  private getItemDimensions(placement: Placement): { w: number; h: number; l: number } {
    return this.itemRegistry.getItemDimensions(placement);
  }

  private getItemWeight(placement: Placement): number {
    return this.itemRegistry.getItemWeight(placement);
  }

  /**
   * Рассчитывает баланс распределения веса
   */
  private calculateWeightBalance(placements: Placement[]): number {
    if (placements.length === 0) return 1;

    const weights = placements.map(p => this.itemRegistry.getItemWeight(p));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const avgWeight = totalWeight / weights.length;
    
    // Рассчитываем стандартное отклонение
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;
    const stdDev = Math.sqrt(variance);
    
    // Нормализуем к 0-1 (меньше отклонение = лучше баланс)
    return Math.max(0, 1 - (stdDev / avgWeight));
  }

  /**
   * Рассчитывает соблюдение правил фланцев
   */
  private calculateFlangeCompliance(placements: Placement[]): number {
    if (placements.length < 2) return 1;

    let violations = 0;
    let totalPairs = 0;

    // Проверяем все пары размещений
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        totalPairs++;
        
        const flangeType1 = this.itemRegistry.getItemFlangeType(placements[i]);
        const flangeType2 = this.itemRegistry.getItemFlangeType(placements[j]);
        
        // Простая проверка - если есть TDC фланцы, они должны быть дальше друг от друга
        if ((flangeType1 === 'TDC' || flangeType2 === 'TDC')) {
          const distance = this.calculateDistance(placements[i], placements[j]);
          if (distance < 50) { // 50мм минимум для TDC
            violations++;
          }
        }
      }
    }

    return totalPairs > 0 ? 1 - (violations / totalPairs) : 1;
  }

  /**
   * Рассчитывает расстояние между размещениями
   */
  private calculateDistance(p1: Placement, p2: Placement): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    const dz = Math.abs(p1.z - p2.z);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// Legacy function for backward compatibility
export function score(result: PackingResult, items: DuctItem[] = []): number {
  const evaluator = new Evaluator();
  return evaluator.calculatePackingEfficiency(result, items);
}
