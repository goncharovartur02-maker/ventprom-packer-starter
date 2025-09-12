import { PackResult, Vehicle, Placement, DuctItem } from './models';

export class Evaluator {
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

  calculatePackingEfficiency(result: PackResult): number {
    const volumeScore = result.metrics.volumeFill;
    const stabilityScore = result.metrics.stabilityScore || 0;
    const binsPenalty = 1 / result.binsUsed; // Fewer bins = better
    
    return volumeScore * 0.5 + stabilityScore * 0.3 + binsPenalty * 0.2;
  }

  compareResults(result1: PackResult, result2: PackResult): number {
    const score1 = this.calculatePackingEfficiency(result1);
    const score2 = this.calculatePackingEfficiency(result2);
    
    return score1 - score2; // Positive = result1 is better
  }

  private getItemDimensions(placement: Placement): { w: number; h: number; l: number } {
    // This would need to be implemented based on the original item data
    // For now, return default dimensions
    return { w: 100, h: 100, l: 100 };
  }

  private getItemWeight(placement: Placement): number | null {
    // This would need to be implemented based on the original item data
    // For now, return default weight
    return 10;
  }
}

// Legacy function for backward compatibility
export function score(result: PackResult): number {
  const evaluator = new Evaluator();
  return evaluator.calculatePackingEfficiency(result);
}
