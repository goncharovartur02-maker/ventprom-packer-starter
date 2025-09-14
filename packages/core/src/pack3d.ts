import { PackRequest, PackResult, PackingResult, Vehicle, DuctItem, Placement, MM } from './models';
import { fitsWithin, collide } from './constraints';
import { BeamSearch } from './heuristics/beam';
import { LayerRules } from './heuristics/layer_rules';
import { FlangeRules } from './flange-rules';
import { MultiScenarioOptimizer, ScenarioResult } from './optimization/multi-scenario';
import { StabilityAnalyzer, StabilityReport } from './stability-analyzer';
import { ItemRegistry } from './item-registry';

export class Pack3D {
  private readonly GRID_SIZE: MM = 5; // 5mm grid
  private beamSearch: BeamSearch;
  private layerRules: LayerRules;
  private flangeRules: FlangeRules;
  private scenarioOptimizer: MultiScenarioOptimizer;
  private stabilityAnalyzer: StabilityAnalyzer;
  private itemRegistry = new ItemRegistry();

  constructor() {
    this.beamSearch = new BeamSearch();
    this.layerRules = new LayerRules();
    this.flangeRules = new FlangeRules();
    this.scenarioOptimizer = new MultiScenarioOptimizer();
    this.stabilityAnalyzer = new StabilityAnalyzer();
  }

  pack(vehicle: Vehicle, items: DuctItem[]): PackingResult {
    console.log('Pack3D: Начинаем упаковку с профессиональными правилами для воздуховодов');
    
    // Регистрируем элементы для правильных расчетов
    this.itemRegistry.registerItems(items);
    
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

    // Validate flange constraints
    const flangeValidation = this.validateFlangeConstraints(sortedItems, vehicle);
    
    if (flangeValidation.violations.length > 0) {
      console.warn('Pack3D: Нарушения фланцевых ограничений:', flangeValidation.violations.length);
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
  packBasic(vehicle: Vehicle, items: DuctItem[]): PackingResult {
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
    return this.itemRegistry.getItemDimensions(placement);
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

  private calculateMetrics(vehicle: Vehicle, placements: Placement[]): PackingResult['metrics'] {
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

  // Валидация фланцевых ограничений
  private validateFlangeConstraints(items: DuctItem[], vehicle: Vehicle): {
    violations: Array<{
      item1Id: string;
      item2Id: string;
      flangeType1: string;
      flangeType2: string;
      requiredDistance: number;
      message: string;
    }>;
    recommendations: string[];
  } {
    const violations: Array<{
      item1Id: string;
      item2Id: string;
      flangeType1: string;
      flangeType2: string;
      requiredDistance: number;
      message: string;
    }> = [];
    
    const recommendations: string[] = [];

    // Анализ типов фланцев в грузе
    const flangeTypes = new Map<string, number>();
    items.forEach(item => {
      const flangeType = (item as any).flangeType || 'DEFAULT';
      flangeTypes.set(flangeType, (flangeTypes.get(flangeType) || 0) + 1);
    });

    // Рекомендации по фланцам
    if (flangeTypes.has('TDC') && flangeTypes.get('TDC')! > 5) {
      recommendations.push('Много воздуховодов с фланцами TDC - требуется 43мм зазор между ними');
    }

    if (flangeTypes.has('SHINA_30') || flangeTypes.has('SHINA_20')) {
      recommendations.push('Шинорейки требуют особого внимания при размещении рядом с другими воздуховодами');
    }

    // Проверка совместимости фланцев
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        const flangeType1 = (item1 as any).flangeType || 'DEFAULT';
        const flangeType2 = (item2 as any).flangeType || 'DEFAULT';
        
        const requiredDistance = this.flangeRules.getFlangeMinDistance(flangeType1) + 
                                this.flangeRules.getFlangeMinDistance(flangeType2);

        // Проверка особых случаев
        if (flangeType1 === 'TDC' && flangeType2 === 'TDC') {
          violations.push({
            item1Id: item1.id,
            item2Id: item2.id,
            flangeType1,
            flangeType2,
            requiredDistance: 43,
            message: 'Два воздуховода с фланцами TDC требуют минимум 43мм зазора'
          });
        }

        if ((flangeType1.startsWith('SHINA') || flangeType2.startsWith('SHINA')) && 
            requiredDistance > 25) {
          violations.push({
            item1Id: item1.id,
            item2Id: item2.id,
            flangeType1,
            flangeType2,
            requiredDistance,
            message: 'Шинорейки требуют увеличенного зазора при размещении'
          });
        }
      }
    }

    // Рекомендации по оптимизации размещения
    if (violations.length > 0) {
      recommendations.push('Рассмотрите изменение ориентации воздуховодов для соблюдения фланцевых ограничений');
    }

    const tdcCount = flangeTypes.get('TDC') || 0;
    if (tdcCount > 3) {
      recommendations.push('При большом количестве TDC фланцев рекомендуется групповое размещение');
    }

    console.log(`Pack3D: Фланцевый анализ - нарушений: ${violations.length}, рекомендаций: ${recommendations.length}`);
    
    return {
      violations,
      recommendations
    };
  }

  // Получение информации о поддерживаемых фланцах
  getSupportedFlangeTypes(): string[] {
    return this.flangeRules.getSupportedFlangeTypes();
  }

  // Расчет рекомендуемого расстояния для доступа при монтаже
  getMaintenanceDistance(item: DuctItem): MM {
    return this.flangeRules.getMaintenanceDistance(item);
  }

  // Многосценарная оптимизация упаковки
  async packWithScenarios(vehicle: Vehicle, items: DuctItem[]): Promise<{
    bestScenario: ScenarioResult;
    allScenarios: ScenarioResult[];
    recommendation: string;
  }> {
    console.log('Pack3D: Запуск многосценарной оптимизации');
    
    try {
      const scenarios = await this.scenarioOptimizer.analyzeScenarios(vehicle, items);
      const bestScenario = scenarios[0]; // Первый = лучший после ранжирования
      
      const recommendation = this.generateRecommendation(scenarios, vehicle, items);
      
      console.log(`Pack3D: Лучший сценарий: ${bestScenario.name} (score: ${bestScenario.score.toFixed(1)})`);
      
      return {
        bestScenario,
        allScenarios: scenarios,
        recommendation
      };
      
    } catch (error) {
      console.error('Pack3D: Ошибка многосценарной оптимизации:', error);
      
      // Fallback к обычной упаковке
      const fallbackResult = this.pack(vehicle, items);
      
      return {
        bestScenario: {
          id: 'fallback',
          name: 'Стандартная упаковка',
          description: 'Fallback к стандартному алгоритму',
          packResult: fallbackResult,
          metrics: this.createFallbackMetrics(fallbackResult, vehicle, items),
          priority: 'efficiency',
          score: 75,
          warnings: ['Многосценарная оптимизация недоступна'],
          recommendations: ['Используется стандартный алгоритм упаковки']
        } as ScenarioResult,
        allScenarios: [],
        recommendation: 'Использована стандартная упаковка из-за ошибки многосценарного анализа'
      };
    }
  }

  private generateRecommendation(scenarios: ScenarioResult[], vehicle: Vehicle, items: DuctItem[]): string {
    const best = scenarios[0];
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0) * item.qty, 0);
    
    let recommendation = `🎯 РЕКОМЕНДАЦИЯ ДЛЯ УПАКОВКИ:\n\n`;
    
    recommendation += `📊 Анализ груза:\n`;
    recommendation += `• Воздуховодов: ${itemCount} шт\n`;
    recommendation += `• Общий вес: ${totalWeight.toFixed(1)} кг\n`;
    recommendation += `• Транспорт: ${vehicle.name}\n\n`;
    
    recommendation += `🏆 Лучший сценарий: ${best.name}\n`;
    recommendation += `📝 ${best.description}\n`;
    recommendation += `⭐ Оценка: ${best.score.toFixed(1)}/100\n\n`;
    
    recommendation += `📈 Ключевые метрики:\n`;
    recommendation += `• Утилизация пространства: ${best.metrics.spaceUtilization.toFixed(1)}%\n`;
    recommendation += `• Безопасность: ${best.metrics.safetyScore.toFixed(1)}/100\n`;
    recommendation += `• Время разгрузки: ${best.metrics.unloadingTime.toFixed(0)} мин\n`;
    recommendation += `• Соблюдение фланцев: ${best.metrics.flangeCompliance.toFixed(1)}%\n\n`;
    
    if (best.warnings.length > 0) {
      recommendation += `⚠️ Предупреждения:\n`;
      best.warnings.forEach(warning => recommendation += `• ${warning}\n`);
      recommendation += `\n`;
    }
    
    recommendation += `💡 Рекомендации:\n`;
    best.recommendations.forEach(rec => recommendation += `• ${rec}\n`);
    
    // Альтернативные сценарии
    if (scenarios.length > 1) {
      recommendation += `\n🔄 Альтернативы:\n`;
      scenarios.slice(1, 3).forEach((scenario, index) => {
        recommendation += `${index + 2}. ${scenario.name} (${scenario.score.toFixed(1)})\n`;
      });
    }
    
    // Специальные рекомендации в зависимости от приоритета
    switch (best.priority) {
      case 'safety':
        recommendation += `\n🛡️ Приоритет: БЕЗОПАСНОСТЬ\n`;
        recommendation += `• Рекомендуется для дальних перевозок\n`;
        recommendation += `• Минимальный риск повреждений\n`;
        break;
        
      case 'efficiency':
        recommendation += `\n💰 Приоритет: ЭКОНОМИЧНОСТЬ\n`;
        recommendation += `• Минимальные транспортные расходы\n`;
        recommendation += `• Максимальная загрузка транспорта\n`;
        break;
        
      case 'speed':
        recommendation += `\n⚡ Приоритет: СКОРОСТЬ\n`;
        recommendation += `• Быстрая разгрузка на объекте\n`;
        recommendation += `• Оптимизировано для срочных поставок\n`;
        break;
        
      case 'protection':
        recommendation += `\n🛡️ Приоритет: ЗАЩИТА\n`;
        recommendation += `• Максимальная защита хрупких элементов\n`;
        recommendation += `• Рекомендуется для дорогих материалов\n`;
        break;
    }
    
    return recommendation;
  }

  private createFallbackMetrics(packResult: PackingResult, vehicle: Vehicle, items: DuctItem[]): any {
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0) * item.qty, 0);
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    const usedVolume = items.reduce((sum, item) => {
      const itemVolume = (item.w || item.d || 100) * (item.h || item.d || 100) * item.length;
      return sum + itemVolume * item.qty;
    }, 0);
    
    return {
      vehiclesUsed: 1,
      totalWeight,
      weightDistribution: {
        frontAxle: totalWeight * 0.4,
        rearAxle: totalWeight * 0.6,
        centerOfGravityHeight: 400
      },
      spaceUtilization: (usedVolume / vehicleVolume) * 100,
      loadingTime: items.length * 2,
      unloadingTime: items.length * 1.5,
      safetyScore: 80,
      costEfficiency: 75,
      flangeCompliance: 85
    };
  }

  // Быстрый анализ сценариев (без полной упаковки)
  async quickScenarioAnalysis(vehicle: Vehicle, items: DuctItem[]): Promise<{
    recommendation: string;
    priorityScores: { [key: string]: number };
    suggestedScenario: string;
  }> {
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0) * item.qty, 0);
    const avgWeight = totalWeight / itemCount;
    
    // Анализ характеристик груза
    const heavyItems = items.filter(item => (item.weightKg || 0) > 25).length;
    const fragileItems = items.filter(item => this.isFragileItem(item)).length;
    const flangeVariety = this.countFlangeTypes(items);
    
    // Оценка приоритетов
    const priorityScores = {
      safety: this.calculateSafetyPriority(totalWeight, vehicle.maxPayloadKg, heavyItems, itemCount),
      efficiency: this.calculateEfficiencyPriority(totalWeight, vehicle.maxPayloadKg, itemCount),
      speed: this.calculateSpeedPriority(itemCount, avgWeight),
      protection: this.calculateProtectionPriority(fragileItems, itemCount)
    };
    
    // Определяем рекомендуемый сценарий
    const topPriority = Object.entries(priorityScores)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const scenarios = {
      safety: 'optimal_weight',
      efficiency: 'min_vehicles', 
      speed: 'priority_unloading',
      protection: 'fragile_protection'
    };
    
    const suggestedScenario = scenarios[topPriority as keyof typeof scenarios];
    
    let recommendation = `🔍 БЫСТРЫЙ АНАЛИЗ ГРУЗА:\n\n`;
    recommendation += `📊 Характеристики:\n`;
    recommendation += `• Элементов: ${itemCount} шт\n`;
    recommendation += `• Общий вес: ${totalWeight.toFixed(1)} кг\n`;
    recommendation += `• Средний вес: ${avgWeight.toFixed(1)} кг\n`;
    recommendation += `• Тяжелых элементов: ${heavyItems}\n`;
    recommendation += `• Хрупких элементов: ${fragileItems}\n`;
    recommendation += `• Типов фланцев: ${flangeVariety}\n\n`;
    
    recommendation += `🎯 Приоритеты (0-100):\n`;
    Object.entries(priorityScores).forEach(([priority, score]) => {
      const emoji = { safety: '🛡️', efficiency: '💰', speed: '⚡', protection: '🛡️' };
      recommendation += `${emoji[priority as keyof typeof emoji]} ${priority}: ${score.toFixed(0)}\n`;
    });
    
    recommendation += `\n🏆 Рекомендуемый сценарий: ${this.getScenarioName(suggestedScenario)}`;
    
    return {
      recommendation,
      priorityScores,
      suggestedScenario
    };
  }

  private isFragileItem(item: DuctItem): boolean {
    const material = (item as any).material || 'galvanized';
    return material.includes('оцинк') || (item.w || 0) > 600 || (item.h || 0) > 600;
  }

  private countFlangeTypes(items: DuctItem[]): number {
    const flangeTypes = new Set();
    items.forEach(item => {
      const flangeType = (item as any).flangeType || 'DEFAULT';
      flangeTypes.add(flangeType);
    });
    return flangeTypes.size;
  }

  private calculateSafetyPriority(totalWeight: number, maxWeight: number, heavyItems: number, totalItems: number): number {
    let score = 50;
    
    // Высокий вес увеличивает приоритет безопасности
    const weightRatio = totalWeight / maxWeight;
    if (weightRatio > 0.8) score += 30;
    else if (weightRatio > 0.6) score += 20;
    else if (weightRatio > 0.4) score += 10;
    
    // Много тяжелых элементов
    const heavyRatio = heavyItems / totalItems;
    if (heavyRatio > 0.5) score += 20;
    else if (heavyRatio > 0.3) score += 10;
    
    return Math.min(100, score);
  }

  private calculateEfficiencyPriority(totalWeight: number, maxWeight: number, itemCount: number): number {
    let score = 50;
    
    // Высокая загрузка повышает эффективность
    const weightRatio = totalWeight / maxWeight;
    if (weightRatio > 0.7) score += 30;
    else if (weightRatio > 0.5) score += 20;
    
    // Много элементов = потенциал для плотной упаковки
    if (itemCount > 20) score += 15;
    else if (itemCount > 10) score += 10;
    
    return Math.min(100, score);
  }

  private calculateSpeedPriority(itemCount: number, avgWeight: number): number {
    let score = 50;
    
    // Много легких элементов = приоритет скорости
    if (avgWeight < 15 && itemCount > 15) score += 25;
    else if (avgWeight < 20 && itemCount > 10) score += 15;
    
    // Средний размер партии
    if (itemCount > 5 && itemCount < 25) score += 10;
    
    return Math.min(100, score);
  }

  private calculateProtectionPriority(fragileItems: number, totalItems: number): number {
    let score = 30; // Базовый уровень
    
    const fragileRatio = fragileItems / totalItems;
    if (fragileRatio > 0.6) score += 40;
    else if (fragileRatio > 0.4) score += 25;
    else if (fragileRatio > 0.2) score += 15;
    
    return Math.min(100, score);
  }

  private getScenarioName(scenarioId: string): string {
    const names = {
      min_vehicles: 'Минимальное количество машин',
      optimal_weight: 'Оптимальное распределение веса',
      fragile_protection: 'Защита хрупких элементов',
      priority_unloading: 'Быстрая разгрузка',
      flange_optimal: 'Оптимизация фланцев'
    };
    
    return names[scenarioId as keyof typeof names] || scenarioId;
  }

  // Анализ стабильности транспорта
  analyzeStability(vehicle: Vehicle, items: DuctItem[], placements?: Placement[]): StabilityReport {
    console.log('Pack3D: Запуск анализа стабильности транспорта');
    
    // Если размещения не переданы, выполняем упаковку
    if (!placements || placements.length === 0) {
      console.log('Pack3D: Выполняем упаковку для анализа стабильности');
      const packResult = this.pack(vehicle, items);
      placements = packResult.placements || [];
    }
    
    // Выполняем анализ стабильности
    const stabilityReport = this.stabilityAnalyzer.analyzeTransportStability(placements, vehicle);
    
    console.log(`Pack3D: Анализ стабильности завершен, общая оценка: ${stabilityReport.overallRating}`);
    console.log(`Pack3D: Безопасность: ${stabilityReport.safetyScore}/100`);
    
    if (stabilityReport.warnings.length > 0) {
      console.warn('Pack3D: Предупреждения по безопасности:', stabilityReport.warnings);
    }
    
    return stabilityReport;
  }

  // Упаковка с анализом стабильности
  packWithStabilityAnalysis(vehicle: Vehicle, items: DuctItem[]): {
    packResult: PackingResult;
    stabilityReport: StabilityReport;
    recommendation: string;
  } {
    console.log('Pack3D: Упаковка с анализом стабильности');
    
    // Выполняем упаковку
    const packResult = this.pack(vehicle, items);
    
    // Анализируем стабильность
    const stabilityReport = this.analyzeStability(vehicle, items, packResult.placements);
    
    // Генерируем рекомендации
    const recommendation = this.generateStabilityRecommendation(packResult, stabilityReport);
    
    return {
      packResult,
      stabilityReport,
      recommendation
    };
  }

  // Быстрая проверка безопасности
  quickSafetyCheck(vehicle: Vehicle, items: DuctItem[]): {
    isSafe: boolean;
    safetyScore: number;
    criticalIssues: string[];
    quickRecommendations: string[];
  } {
    console.log('Pack3D: Быстрая проверка безопасности');
    
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg || 0) * item.qty, 0);
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const avgWeight = totalWeight / itemCount;
    
    const criticalIssues: string[] = [];
    const quickRecommendations: string[] = [];
    let safetyScore = 100;
    
    // Проверка перегрузки
    if (totalWeight > vehicle.maxPayloadKg * 0.9) {
      safetyScore -= 30;
      criticalIssues.push('Превышение допустимой нагрузки');
      quickRecommendations.push('Уменьшить количество груза');
    }
    
    // Проверка тяжелых элементов
    const heavyItems = items.filter(item => (item.weightKg || 0) > 30).length;
    if (heavyItems > itemCount * 0.3) {
      safetyScore -= 20;
      criticalIssues.push('Много тяжелых элементов');
      quickRecommendations.push('Распределить по нескольким поездкам');
    }
    
    // Проверка хрупких элементов
    const fragileItems = items.filter(item => this.isFragileItem(item)).length;
    if (fragileItems > itemCount * 0.5) {
      safetyScore -= 15;
      criticalIssues.push('Много хрупких элементов');
      quickRecommendations.push('Усилить упаковку и крепления');
    }
    
    // Проверка типа транспорта
    if (vehicle.name.toLowerCase().includes('газель') && totalWeight > 1500) {
      safetyScore -= 25;
      criticalIssues.push('Тяжелый груз для малогабаритного транспорта');
      quickRecommendations.push('Использовать более крупный транспорт');
    }
    
    const isSafe = safetyScore >= 70 && criticalIssues.length === 0;
    
    console.log(`Pack3D: Быстрая проверка завершена, безопасность: ${isSafe ? 'ОК' : 'ПРОБЛЕМЫ'} (${safetyScore}/100)`);
    
    return {
      isSafe,
      safetyScore: Math.max(0, safetyScore),
      criticalIssues,
      quickRecommendations
    };
  }

  private generateStabilityRecommendation(packResult: PackingResult, stabilityReport: StabilityReport): string {
    let recommendation = `🛡️ АНАЛИЗ СТАБИЛЬНОСТИ ТРАНСПОРТА\n\n`;
    
    recommendation += `📊 Общая оценка: ${stabilityReport.overallRating.toUpperCase()}\n`;
    recommendation += `🎯 Безопасность: ${stabilityReport.safetyScore}/100\n\n`;
    
    // Центр тяжести
    recommendation += `⚖️ Центр тяжести:\n`;
    recommendation += `• Высота: ${stabilityReport.centerOfGravity.y.toFixed(0)}мм\n`;
    recommendation += `• Боковое смещение: ${Math.abs(stabilityReport.centerOfGravity.x).toFixed(0)}мм\n`;
    recommendation += `• Продольное смещение: ${Math.abs(stabilityReport.centerOfGravity.z).toFixed(0)}мм\n\n`;
    
    // Риск опрокидывания
    recommendation += `🚨 Риск опрокидывания: ${stabilityReport.tippingRisk.level.toUpperCase()}\n`;
    if (stabilityReport.tippingRisk.factors.length > 0) {
      recommendation += `Факторы риска:\n`;
      stabilityReport.tippingRisk.factors.forEach(factor => {
        recommendation += `• ${factor}\n`;
      });
    }
    recommendation += `\n`;
    
    // Стабильность при торможении
    recommendation += `🛑 Стабильность торможения: ${stabilityReport.brakeStability.isStable ? 'СТАБИЛЬНО' : 'НЕСТАБИЛЬНО'}\n`;
    recommendation += `Оценка: ${stabilityReport.brakeStability.score}/100\n\n`;
    
    // Безопасность поворотов
    recommendation += `🔄 Безопасность поворотов:\n`;
    recommendation += `• Макс. скорость: ${stabilityReport.turnStability.maxSafeSpeed} км/ч\n`;
    recommendation += `• Сопротивление силам: ${stabilityReport.turnStability.lateralForceResistance}/100\n\n`;
    
    // Предупреждения
    if (stabilityReport.warnings.length > 0) {
      recommendation += `⚠️ ПРЕДУПРЕЖДЕНИЯ:\n`;
      stabilityReport.warnings.forEach(warning => {
        recommendation += `• ${warning}\n`;
      });
      recommendation += `\n`;
    }
    
    // Рекомендации
    if (stabilityReport.recommendations.length > 0) {
      recommendation += `💡 РЕКОМЕНДАЦИИ:\n`;
      stabilityReport.recommendations.forEach(rec => {
        recommendation += `• ${rec}\n`;
      });
    }
    
    // Итоговое заключение
    recommendation += `\n📋 ЗАКЛЮЧЕНИЕ:\n`;
    switch (stabilityReport.overallRating) {
      case 'excellent':
        recommendation += `✅ Отличная стабильность, перевозка безопасна`;
        break;
      case 'good':
        recommendation += `✅ Хорошая стабильность, соблюдайте осторожность`;
        break;
      case 'fair':
        recommendation += `⚠️ Удовлетворительная стабильность, следуйте рекомендациям`;
        break;
      case 'poor':
        recommendation += `❌ Плохая стабильность, рекомендуется перепаковка`;
        break;
      case 'dangerous':
        recommendation += `🚫 ОПАСНО! Перевозка запрещена без исправления проблем`;
        break;
    }
    
    return recommendation;
  }
}

// Legacy function for backward compatibility
export function pack3d(req: PackRequest): PackingResult {
  const packer = new Pack3D();
  return packer.pack(req.vehicle, req.items);
}
