import { Vehicle, DuctItem, Placement, PackingResult } from '../models';
import { BeamSearch } from '../heuristics/beam';
import { LayerRules } from '../heuristics/layer_rules';
import { FlangeRules } from '../flange-rules';

export interface ScenarioConfig {
  name: string;
  description: string;
  priority: 'vehicles' | 'safety' | 'fragile' | 'unloading' | 'balanced';
  weights: {
    vehicleCount: number;    // Вес минимизации количества машин
    weightBalance: number;    // Вес равномерности распределения веса
    centerOfGravity: number;  // Вес оптимизации центра тяжести
    fragileProtection: number; // Вес защиты хрупких элементов
    unloadingOrder: number;   // Вес удобства разгрузки
  };
}

export interface ScenarioResult {
  config: ScenarioConfig;
  packResult: PackingResult;
  metrics: {
    vehiclesUsed: number;
    totalWeight: number;
    avgUtilization: number;
    centerOfGravityHeight: number; // % от высоты кузова
    weightDistribution: {
      front: number; // % веса на переднюю ось
      rear: number;  // % веса на заднюю ось
      left: number;  // % веса на левую сторону
      right: number; // % веса на правую сторону
    };
    stabilityScore: number; // 0-100
    fragileProtectionScore: number; // 0-100
    unloadingEfficiency: number; // 0-100
    transportSafety: {
      brakeStability: boolean;
      turnStability: boolean;
      vibrationResistance: boolean;
      tippingRisk: 'low' | 'medium' | 'high';
    };
  };
  warnings: string[];
  recommendations: string[];
}

export class MultiScenarioOptimizer {
  private beamSearch = new BeamSearch();
  private layerRules = new LayerRules();
  private flangeRules = new FlangeRules();

  /**
   * Анализирует несколько сценариев упаковки и возвращает ранжированный список
   */
  async analyzeScenarios(
    vehicle: Vehicle,
    items: DuctItem[],
    customScenarios?: ScenarioConfig[]
  ): Promise<ScenarioResult[]> {
    const scenarios = customScenarios || this.getDefaultScenarios();
    const results: ScenarioResult[] = [];
    
    for (const scenario of scenarios) {
      console.log(`Анализ сценария: ${scenario.name}`);
      const result = await this.runScenario(vehicle, items, scenario);
      results.push(result);
    }
    
    // Сортируем результаты по общей оценке
    return this.rankResults(results);
  }

  /**
   * Запускает один сценарий упаковки
   */
  private async runScenario(
    vehicle: Vehicle,
    items: DuctItem[],
    config: ScenarioConfig
  ): Promise<ScenarioResult> {
    // Сортируем элементы согласно приоритету сценария
    const sortedItems = this.sortItemsByScenario(items, config);
    
    // Запускаем упаковку с учетом весов оптимизации
    const packResult = await this.packWithWeights(vehicle, sortedItems, config);
    
    // Рассчитываем метрики
    const metrics = this.calculateMetrics(packResult, vehicle, items);
    
    // Генерируем предупреждения и рекомендации
    const { warnings, recommendations } = this.analyzeResult(packResult, metrics, config);
    
    return {
      config,
      packResult,
      metrics,
      warnings,
      recommendations
    };
  }

  /**
   * Стандартные сценарии упаковки
   */
  private getDefaultScenarios(): ScenarioConfig[] {
    return [
      {
        name: 'Минимум машин',
        description: 'Минимизация количества используемых транспортных средств',
        priority: 'vehicles',
        weights: {
          vehicleCount: 1.0,
          weightBalance: 0.3,
          centerOfGravity: 0.2,
          fragileProtection: 0.3,
          unloadingOrder: 0.2
        }
      },
      {
        name: 'Максимальная безопасность',
        description: 'Оптимальное распределение веса для безопасной транспортировки',
        priority: 'safety',
        weights: {
          vehicleCount: 0.3,
          weightBalance: 1.0,
          centerOfGravity: 0.9,
          fragileProtection: 0.5,
          unloadingOrder: 0.2
        }
      },
      {
        name: 'Защита хрупких',
        description: 'Максимальная защита оцинкованных и хрупких элементов',
        priority: 'fragile',
        weights: {
          vehicleCount: 0.4,
          weightBalance: 0.5,
          centerOfGravity: 0.4,
          fragileProtection: 1.0,
          unloadingOrder: 0.3
        }
      },
      {
        name: 'Быстрая разгрузка',
        description: 'Оптимизация порядка для быстрой разгрузки на объекте',
        priority: 'unloading',
        weights: {
          vehicleCount: 0.5,
          weightBalance: 0.4,
          centerOfGravity: 0.3,
          fragileProtection: 0.4,
          unloadingOrder: 1.0
        }
      },
      {
        name: 'Сбалансированный',
        description: 'Баланс всех параметров',
        priority: 'balanced',
        weights: {
          vehicleCount: 0.6,
          weightBalance: 0.6,
          centerOfGravity: 0.6,
          fragileProtection: 0.6,
          unloadingOrder: 0.6
        }
      }
    ];
  }

  /**
   * Сортирует элементы согласно приоритету сценария
   */
  private sortItemsByScenario(
    items: DuctItem[],
    config: ScenarioConfig
  ): DuctItem[] {
    const sorted = [...items];
    
    switch (config.priority) {
      case 'vehicles':
        // Сортируем по объему - большие первыми для плотной упаковки
        return sorted.sort((a, b) => {
          const volA = this.calculateVolume(a);
          const volB = this.calculateVolume(b);
          return volB - volA;
        });
        
      case 'safety':
        // Тяжелые внизу, равномерное распределение
        return this.layerRules.sortForVentilationLayering(sorted);
        
      case 'fragile':
        // Хрупкие элементы упаковываем последними (сверху)
        return sorted.sort((a, b) => {
          const fragileA = this.getFragilityScore(a);
          const fragileB = this.getFragilityScore(b);
          return fragileA - fragileB; // Менее хрупкие первыми
        });
        
      case 'unloading':
        // Сортируем по приоритету разгрузки (если есть)
        return sorted.sort((a, b) => {
          const priorityA = (a as any).unloadPriority || 999;
          const priorityB = (b as any).unloadPriority || 999;
          return priorityA - priorityB;
        });
        
      case 'balanced':
      default:
        // Используем стандартную сортировку по слоям
        return this.layerRules.sortForLayering(sorted);
    }
  }

  /**
   * Упаковка с учетом весов оптимизации
   */
  private async packWithWeights(
    vehicle: Vehicle,
    items: DuctItem[],
    config: ScenarioConfig
  ): Promise<PackingResult> {
    // Используем стандартный BeamSearch
    return this.beamSearch.search(vehicle, items, 5);
  }

  private calculateVolume(item: DuctItem): number {
    if (item.type === 'rect') {
      return (item.w || 100) * (item.h || 100) * item.length;
    } else {
      const radius = (item.d || 100) / 2;
      return Math.PI * radius * radius * item.length;
    }
  }

  private getFragilityScore(item: DuctItem): number {
    // Оцинкованная сталь - самая хрупкая
    if (item.material === 'galvanized') return 100;
    if (item.material === 'aluminum') return 80;
    if (item.material === 'stainless') return 40;
    if (item.material === 'black_steel') return 20;
    return 50; // По умолчанию
  }

  /**
   * Рассчитывает все метрики для результата упаковки
   */
  private calculateMetrics(
    packResult: PackingResult,
    vehicle: Vehicle,
    items: DuctItem[]
  ): ScenarioResult['metrics'] {
    const placements = packResult.placements;
    
    // Центр тяжести
    const cog = this.calculateCenterOfGravity(placements, items);
    const cogHeightPercent = (cog.y / vehicle.height) * 100;
    
    // Распределение веса
    const weightDist = this.calculateWeightDistribution(placements, vehicle, items);
    
    // Стабильность
    const stabilityScore = this.calculateStabilityScore(placements, vehicle, cog, weightDist);
    
    // Защита хрупких
    const fragileScore = this.calculateFragileProtectionScore(placements, items);
    
    // Эффективность разгрузки
    const unloadingScore = this.calculateUnloadingEfficiency(placements);
    
    // Безопасность транспортировки
    const transportSafety = this.analyzeTransportSafety(placements, vehicle, cog, weightDist);
    
    return {
      vehiclesUsed: packResult.binsUsed,
      totalWeight: this.getTotalWeight(placements, items),
      avgUtilization: packResult.metrics.volumeFill * 100,
      centerOfGravityHeight: cogHeightPercent,
      weightDistribution: weightDist,
      stabilityScore,
      fragileProtectionScore: fragileScore,
      unloadingEfficiency: unloadingScore,
      transportSafety
    };
  }

  private calculateCenterOfGravity(
    placements: Placement[],
    items: DuctItem[]
  ): { x: number; y: number; z: number } {
    if (placements.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    
    const itemMap = new Map<string, DuctItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;
    
    placements.forEach(placement => {
      const item = itemMap.get(placement.itemId);
      const weight = item?.weightKg || 10;
      totalWeight += weight;
      
      const itemWidth = item?.type === 'rect' ? (item.w || 100) : (item?.d || 100);
      const itemHeight = item?.type === 'rect' ? (item.h || 100) : (item?.d || 100);
      const itemLength = item?.length || 1000;
      
      const itemCenterX = placement.x + itemWidth / 2;
      const itemCenterY = placement.y + itemHeight / 2;
      const itemCenterZ = placement.z + itemLength / 2;
      
      weightedX += itemCenterX * weight;
      weightedY += itemCenterY * weight;
      weightedZ += itemCenterZ * weight;
    });
    
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      z: weightedZ / totalWeight
    };
  }

  private calculateWeightDistribution(
    placements: Placement[],
    vehicle: Vehicle,
    items: DuctItem[]
  ): ScenarioResult['metrics']['weightDistribution'] {
    const totalWeight = this.getTotalWeight(placements, items);
    if (totalWeight === 0) {
      return { front: 50, rear: 50, left: 50, right: 50 };
    }
    
    const itemMap = new Map<string, DuctItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    let frontWeight = 0;
    let rearWeight = 0;
    let leftWeight = 0;
    let rightWeight = 0;
    
    const vehicleCenterZ = vehicle.length / 2;
    const vehicleCenterX = vehicle.width / 2;
    
    placements.forEach(placement => {
      const item = itemMap.get(placement.itemId);
      const weight = item?.weightKg || 10;
      
      if (placement.z < vehicleCenterZ) {
        frontWeight += weight;
      } else {
        rearWeight += weight;
      }
      
      if (placement.x < vehicleCenterX) {
        leftWeight += weight;
      } else {
        rightWeight += weight;
      }
    });
    
    return {
      front: (frontWeight / totalWeight) * 100,
      rear: (rearWeight / totalWeight) * 100,
      left: (leftWeight / totalWeight) * 100,
      right: (rightWeight / totalWeight) * 100
    };
  }

  private calculateStabilityScore(
    placements: Placement[],
    vehicle: Vehicle,
    cog: { x: number; y: number; z: number },
    weightDist: any
  ): number {
    let score = 100;
    
    // Штраф за высокий центр тяжести
    if (cog.y > vehicle.height * 0.5) {
      score -= (cog.y / vehicle.height - 0.5) * 100;
    }
    
    // Штраф за неравномерное распределение
    const frontRearDiff = Math.abs(weightDist.front - weightDist.rear);
    if (frontRearDiff > 20) {
      score -= frontRearDiff - 20;
    }
    
    const leftRightDiff = Math.abs(weightDist.left - weightDist.right);
    if (leftRightDiff > 10) {
      score -= (leftRightDiff - 10) * 2;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getTotalWeight(placements: Placement[], items: DuctItem[]): number {
    const itemMap = new Map<string, DuctItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    return placements.reduce((total, placement) => {
      const item = itemMap.get(placement.itemId);
      return total + (item?.weightKg || 10);
    }, 0);
  }

  private calculateFragileProtectionScore(placements: Placement[], items: DuctItem[]): number {
    const itemMap = new Map<string, DuctItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    let totalFragileItems = 0;
    let protectedFragileItems = 0;
    
    placements.forEach(placement => {
      const item = itemMap.get(placement.itemId);
      if (item?.material === 'galvanized' || this.getFragilityScore(item || {} as DuctItem) > 70) {
        totalFragileItems++;
        if (placement.y > 0) protectedFragileItems++;
        if (placement.y > 500) protectedFragileItems += 0.5;
      }
    });
    
    if (totalFragileItems === 0) return 100;
    return Math.min(100, (protectedFragileItems / totalFragileItems) * 100);
  }

  private calculateUnloadingEfficiency(placements: Placement[]): number {
    let score = 100;
    
    const layers = new Map<number, Placement[]>();
    placements.forEach(placement => {
      const layer = placement.layer;
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer)!.push(placement);
    });
    
    if (layers.size > 3) score -= (layers.size - 3) * 10;
    
    layers.forEach(layerPlacements => {
      if (layerPlacements.length > 10) {
        score -= (layerPlacements.length - 10) * 2;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  private analyzeTransportSafety(
    placements: Placement[],
    vehicle: Vehicle,
    cog: { x: number; y: number; z: number },
    weightDist: any
  ): ScenarioResult['metrics']['transportSafety'] {
    const brakeStability = weightDist.rear >= 55 && weightDist.rear <= 70;
    const turnStability = Math.abs(weightDist.left - weightDist.right) <= 15;
    const vibrationResistance = cog.y < vehicle.height * 0.45;
    
    let tippingRisk: 'low' | 'medium' | 'high';
    if (cog.y < vehicle.height * 0.35) {
      tippingRisk = 'low';
    } else if (cog.y < vehicle.height * 0.5) {
      tippingRisk = 'medium';
    } else {
      tippingRisk = 'high';
    }
    
    return { brakeStability, turnStability, vibrationResistance, tippingRisk };
  }

  private analyzeResult(
    packResult: PackingResult,
    metrics: ScenarioResult['metrics'],
    config: ScenarioConfig
  ): { warnings: string[]; recommendations: string[] } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (metrics.centerOfGravityHeight > 50) {
      warnings.push(`⚠️ Высокий центр тяжести: ${metrics.centerOfGravityHeight.toFixed(1)}%`);
      recommendations.push('💡 Переместите тяжелые элементы в нижние слои');
    }
    
    if (metrics.transportSafety.tippingRisk === 'high') {
      warnings.push('🚨 Высокий риск опрокидывания');
      recommendations.push('💡 Снизьте скорость на поворотах');
    }
    
    if (!metrics.transportSafety.brakeStability) {
      warnings.push('⚠️ Недостаточная стабильность при торможении');
      recommendations.push('💡 Переместите больше веса на заднюю ось');
    }
    
    return { warnings, recommendations };
  }

  private rankResults(results: ScenarioResult[]): ScenarioResult[] {
    return results.sort((a, b) => {
      const scoreA = this.calculateOverallScore(a);
      const scoreB = this.calculateOverallScore(b);
      return scoreB - scoreA;
    });
  }

  private calculateOverallScore(result: ScenarioResult): number {
    const weights = result.config.weights;
    const metrics = result.metrics;
    
    let score = 0;
    score += weights.vehicleCount * (100 / Math.max(1, metrics.vehiclesUsed));
    score += weights.weightBalance * metrics.stabilityScore;
    score += weights.centerOfGravity * (100 - Math.min(100, metrics.centerOfGravityHeight));
    score += weights.fragileProtection * metrics.fragileProtectionScore;
    score += weights.unloadingOrder * metrics.unloadingEfficiency;
    
    const maxPossibleScore = Object.values(weights).reduce((a, b) => a + b, 0) * 100;
    return (score / maxPossibleScore) * 100;
  }

  /**
   * Выбирает лучший сценарий на основе требований пользователя
   */
  selectBestScenario(
    results: ScenarioResult[],
    userPreferences?: {
      maxVehicles?: number;
      prioritizeSafety?: boolean;
      hasFragileItems?: boolean;
      needQuickUnloading?: boolean;
    }
  ): ScenarioResult {
    let filtered = [...results];
    
    if (userPreferences?.maxVehicles) {
      filtered = filtered.filter(r => r.metrics.vehiclesUsed <= userPreferences.maxVehicles!);
    }
    
    if (filtered.length === 0) filtered = [...results];
    
    if (userPreferences?.prioritizeSafety) {
      filtered.sort((a, b) => b.metrics.stabilityScore - a.metrics.stabilityScore);
      return filtered[0];
    }
    
    if (userPreferences?.hasFragileItems) {
      filtered.sort((a, b) => b.metrics.fragileProtectionScore - a.metrics.fragileProtectionScore);
      return filtered[0];
    }
    
    if (userPreferences?.needQuickUnloading) {
      filtered.sort((a, b) => b.metrics.unloadingEfficiency - a.metrics.unloadingEfficiency);
      return filtered[0];
    }
    
    return filtered[0];
  }
}