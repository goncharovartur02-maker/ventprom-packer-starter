import { DuctItem, MM } from '../models';

export class LayerRules {
  sortForLayering(items: DuctItem[]): DuctItem[] {
    return [...items].sort((a, b) => {
      const scoreA = this.calculateItemScore(a);
      const scoreB = this.calculateItemScore(b);
      
      // Higher score = bigger item = should be placed first (at bottom)
      return scoreB - scoreA;
    });
  }

  private calculateItemScore(item: DuctItem): number {
    const baseArea = this.getBaseArea(item);
    const volume = this.getVolume(item);
    const weight = item.weightKg || 0;
    
    // Combine base area, volume, and weight for scoring
    // Bigger items get higher scores
    return baseArea * 0.4 + volume * 0.3 + weight * 0.3;
  }

  private getBaseArea(item: DuctItem): number {
    if (item.type === 'rect' && item.w && item.h) {
      return item.w * item.h;
    } else if (item.type === 'round' && item.d) {
      return Math.PI * (item.d / 2) ** 2;
    }
    return 0;
  }

  private getVolume(item: DuctItem): number {
    const baseArea = this.getBaseArea(item);
    return baseArea * item.length;
  }

  // Check if an item can be placed on top of another
  canStackOnTop(bottomItem: DuctItem, topItem: DuctItem): boolean {
    const bottomBaseArea = this.getBaseArea(bottomItem);
    const topBaseArea = this.getBaseArea(topItem);
    
    // Top item should have smaller or equal base area
    return topBaseArea <= bottomBaseArea;
  }

  // Calculate stability score for a layer
  calculateLayerStability(items: DuctItem[]): number {
    if (items.length === 0) return 0;
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0), 0);
    const avgBaseArea = items.reduce((sum, item) => sum + this.getBaseArea(item), 0) / items.length;
    
    // Higher weight and base area = more stable
    return totalWeight * avgBaseArea;
  }

  // Group items into layers based on size compatibility
  groupIntoLayers(items: DuctItem[]): DuctItem[][] {
    const layers: DuctItem[][] = [];
    const sortedItems = this.sortForLayering(items);
    
    for (const item of sortedItems) {
      let placed = false;
      
      // Try to place in existing layers
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const canStack = layer.every(layerItem => this.canStackOnTop(layerItem, item));
        
        if (canStack) {
          layer.push(item);
          placed = true;
          break;
        }
      }
      
      // If couldn't place in any existing layer, create new layer
      if (!placed) {
        layers.push([item]);
      }
    }
    
    return layers;
  }
}
