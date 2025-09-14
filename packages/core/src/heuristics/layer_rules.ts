import { DuctItem, MM, Placement, Vehicle } from '../models';

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

  // Улучшенная сортировка с учетом правил для воздуховодов
  sortForVentilationLayering(items: DuctItem[]): DuctItem[] {
    return [...items].sort((a, b) => {
      // 1. Тяжелые элементы всегда внизу
      const weightDiff = (b.weightKg || 0) - (a.weightKg || 0);
      if (Math.abs(weightDiff) > 5) return weightDiff; // Разница больше 5кг - решающий фактор
      
      // 2. Прямоугольные воздуховоды предпочтительнее круглых для основания
      if (a.type === 'rect' && b.type === 'round') return -1;
      if (a.type === 'round' && b.type === 'rect') return 1;
      
      // 3. Большие площади основания внизу
      const areaA = this.getBaseArea(a);
      const areaB = this.getBaseArea(b);
      const areaDiff = areaB - areaA;
      if (Math.abs(areaDiff) > 10000) return areaDiff; // Разница больше 100см² - важно
      
      // 4. Длинные воздуховоды внизу для стабильности
      return (b.length || 0) - (a.length || 0);
    });
  }

  // Проверка устойчивости круглых воздуховодов
  checkRoundStability(item: DuctItem, surroundingItems: DuctItem[]): boolean {
    if (item.type !== 'round') return true;
    
    // Круглый воздуховод должен быть зафиксирован минимум с двух сторон
    let fixationPoints = 0;
    
    for (const other of surroundingItems) {
      if (this.isAdjacent(item, other)) {
        fixationPoints++;
      }
    }
    
    return fixationPoints >= 2;
  }

  // Проверка смежности элементов (упрощенная)
  private isAdjacent(item1: DuctItem, item2: DuctItem): boolean {
    // В реальной реализации здесь была бы проверка координат
    // Пока возвращаем true для демонстрации
    return true;
  }

  // Максимальная высота стопки в зависимости от материала
  getMaxStackHeight(bottomItem: DuctItem): number {
    const material = (bottomItem as any).material || 'galvanized';
    
    switch(material) {
      case 'galvanized':
        return 2000; // 2 метра для оцинкованной стали
      case 'stainless':
        return 2500; // 2.5 метра для нержавейки
      case 'aluminum':
        return 1800; // 1.8 метра для алюминия
      default:
        return 1500; // 1.5 метра по умолчанию
    }
  }

  // Проверка максимального веса для стопки
  getMaxStackWeight(bottomItem: DuctItem): number {
    const material = (bottomItem as any).material || 'galvanized';
    const baseArea = this.getBaseArea(bottomItem);
    
    // Максимальная нагрузка на единицу площади (кг/м²)
    const maxPressure = material === 'galvanized' ? 500 : 
                       material === 'stainless' ? 700 : 400;
    
    return (baseArea / 1000000) * maxPressure; // Переводим мм² в м²
  }

  // Распределение веса по осям транспорта
  calculateAxleLoad(placements: Placement[], vehicle: Vehicle): {front: number, rear: number} {
    const totalWeight = placements.reduce((sum, p) => sum + ((p as any).weight || 0), 0);
    const centerOfGravity = this.calculateCenterOfGravity(placements);
    
    // Распределение веса между осями (упрощенная формула)
    const vehicleLength = vehicle.length;
    const frontAxlePosition = vehicleLength * 0.2; // 20% от начала
    const rearAxlePosition = vehicleLength * 0.8; // 80% от начала
    
    const distanceToFront = Math.abs(centerOfGravity.z - frontAxlePosition);
    const distanceToRear = Math.abs(centerOfGravity.z - rearAxlePosition);
    const totalDistance = distanceToFront + distanceToRear;
    
    return {
      front: totalWeight * (distanceToRear / totalDistance),
      rear: totalWeight * (distanceToFront / totalDistance)
    };
  }

  // Расчет центра тяжести груза
  private calculateCenterOfGravity(placements: Placement[]): {x: number, y: number, z: number} {
    if (placements.length === 0) return {x: 0, y: 0, z: 0};
    
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;
    
    for (const placement of placements) {
      const weight = (placement as any).weight || 1;
      totalWeight += weight;
      weightedX += placement.x * weight;
      weightedY += placement.y * weight;
      weightedZ += placement.z * weight;
    }
    
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      z: weightedZ / totalWeight
    };
  }

  // Проверка хрупкости оцинкованной стали
  checkFragilityRules(item: DuctItem, stackedItems: DuctItem[]): boolean {
    const material = (item as any).material || 'galvanized';
    
    if (material === 'galvanized') {
      // Оцинкованная сталь требует бережного обращения
      const totalStackWeight = stackedItems.reduce((sum, stackItem) => sum + (stackItem.weightKg || 0), 0);
      const maxAllowedWeight = this.getMaxStackWeight(item);
      
      if (totalStackWeight > maxAllowedWeight) {
        console.warn(`Превышен максимальный вес стопки: ${totalStackWeight}кг > ${maxAllowedWeight}кг`);
        return false;
      }
    }
    
    return true;
  }

  // Оптимизированная группировка в слои с учетом правил воздуховодов
  groupIntoVentilationLayers(items: DuctItem[]): DuctItem[][] {
    const layers: DuctItem[][] = [];
    const sortedItems = this.sortForVentilationLayering(items);
    
    for (const item of sortedItems) {
      let placed = false;
      
      // Пытаемся разместить в существующих слоях
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        
        // Проверяем все правила размещения
        if (this.canPlaceInLayer(item, layer)) {
          layer.push(item);
          placed = true;
          break;
        }
      }
      
      // Если не удалось разместить, создаем новый слой
      if (!placed) {
        layers.push([item]);
      }
    }
    
    return layers;
  }

  // Комплексная проверка возможности размещения в слое
  private canPlaceInLayer(item: DuctItem, layer: DuctItem[]): boolean {
    if (layer.length === 0) return true;
    
    const bottomItem = layer[0]; // Предполагаем, что первый элемент - основание слоя
    
    // 1. Проверка возможности стекирования
    if (!this.canStackOnTop(bottomItem, item)) return false;
    
    // 2. Проверка максимальной высоты стопки
    const currentHeight = layer.reduce((sum, layerItem) => sum + (layerItem.h || layerItem.d || 100), 0);
    const itemHeight = item.h || item.d || 100;
    const maxHeight = this.getMaxStackHeight(bottomItem);
    
    if (currentHeight + itemHeight > maxHeight) return false;
    
    // 3. Проверка хрупкости
    if (!this.checkFragilityRules(bottomItem, [...layer, item])) return false;
    
    // 4. Для круглых воздуховодов - проверка устойчивости
    if (item.type === 'round' && !this.checkRoundStability(item, layer)) {
      return false;
    }
    
    return true;
  }

  // Валидация всей конфигурации упаковки
  validatePackingConfiguration(layers: DuctItem[][], vehicle: Vehicle): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Проверяем каждый слой
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      
      // Проверка устойчивости круглых воздуховодов
      const roundItems = layer.filter(item => item.type === 'round');
      for (const roundItem of roundItems) {
        if (!this.checkRoundStability(roundItem, layer.filter(item => item !== roundItem))) {
          warnings.push(`Круглый воздуховод ${roundItem.id} может быть неустойчив в слое ${i + 1}`);
        }
      }
      
      // Проверка превышения максимального веса
      if (layer.length > 1) {
        const bottomItem = layer[0];
        const stackWeight = layer.slice(1).reduce((sum, item) => sum + (item.weightKg || 0), 0);
        const maxWeight = this.getMaxStackWeight(bottomItem);
        
        if (stackWeight > maxWeight) {
          errors.push(`Превышен максимальный вес в слое ${i + 1}: ${stackWeight}кг > ${maxWeight}кг`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
