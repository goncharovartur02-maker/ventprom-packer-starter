import { DuctItem, Placement, MM } from './models';

export class FlangeRules {
  // Минимальные зазоры между воздуховодами по типу фланца (в мм)
  private static readonly FLANGE_CLEARANCES = {
    'TDC': 43,        // TDC фланец требует 43мм зазора
    'SHINA_20': 20,   // Шина 20мм требует 20мм зазора
    'SHINA_30': 30,   // Шина 30мм требует 30мм зазора
    'REYКА': 15,      // Рейка требует 15мм зазора
    'NONE': 10        // Без фланца минимум 10мм
  } as const;

  // Дополнительный зазор для разных комбинаций фланцев
  private static readonly FLANGE_COMBINATIONS = {
    'TDC_TDC': 50,           // Два TDC фланца рядом
    'TDC_SHINA_30': 45,      // TDC рядом с шиной 30
    'SHINA_30_SHINA_30': 35, // Две шины 30 рядом
  } as const;

  /**
   * Проверяет соблюдение минимального расстояния между воздуховодами
   */
  public checkMinDistance(
    item1: DuctItem,
    item2: DuctItem,
    placement1: Placement,
    placement2: Placement
  ): boolean {
    const requiredDistance = this.getRequiredDistance(item1, item2);
    const actualDistance = this.calculateActualDistance(
      item1, item2, placement1, placement2
    );
    
    return actualDistance >= requiredDistance;
  }

  /**
   * Получает требуемое минимальное расстояние между воздуховодами
   */
  public getRequiredDistance(item1: DuctItem, item2: DuctItem): MM {
    const flange1 = item1.flangeType || 'NONE';
    const flange2 = item2.flangeType || 'NONE';
    
    // Проверяем специальные комбинации
    const combination = `${flange1}_${flange2}` as keyof typeof FlangeRules.FLANGE_COMBINATIONS;
    const reverseCombination = `${flange2}_${flange1}` as keyof typeof FlangeRules.FLANGE_COMBINATIONS;
    
    if (FlangeRules.FLANGE_COMBINATIONS[combination]) {
      return FlangeRules.FLANGE_COMBINATIONS[combination];
    }
    if (FlangeRules.FLANGE_COMBINATIONS[reverseCombination]) {
      return FlangeRules.FLANGE_COMBINATIONS[reverseCombination];
    }
    
    // Берем максимальное требование из двух фланцев
    return Math.max(
      FlangeRules.FLANGE_CLEARANCES[flange1],
      FlangeRules.FLANGE_CLEARANCES[flange2]
    );
  }

  /**
   * Рассчитывает фактическое расстояние между воздуховодами
   */
  private calculateActualDistance(
    item1: DuctItem,
    item2: DuctItem,
    placement1: Placement,
    placement2: Placement
  ): MM {
    // Получаем границы первого воздуховода
    const bounds1 = this.getItemBounds(item1, placement1);
    // Получаем границы второго воздуховода
    const bounds2 = this.getItemBounds(item2, placement2);
    
    // Рассчитываем минимальное расстояние между границами
    const xDistance = Math.max(0, 
      Math.max(bounds2.minX - bounds1.maxX, bounds1.minX - bounds2.maxX)
    );
    const yDistance = Math.max(0,
      Math.max(bounds2.minY - bounds1.maxY, bounds1.minY - bounds2.maxY)
    );
    const zDistance = Math.max(0,
      Math.max(bounds2.minZ - bounds1.maxZ, bounds1.minZ - bounds2.maxZ)
    );
    
    // Если воздуховоды пересекаются, расстояние = 0
    if (xDistance === 0 && yDistance === 0 && zDistance === 0) {
      // Проверяем действительное пересечение
      if (this.checkOverlap(bounds1, bounds2)) {
        return 0;
      }
    }
    
    // Возвращаем минимальное расстояние по любой оси
    return Math.min(xDistance, yDistance, zDistance);
  }

  /**
   * Получает границы воздуховода с учетом его размеров и поворота
   */
  private getItemBounds(item: DuctItem, placement: Placement): ItemBounds {
    let width: MM, height: MM, length: MM;
    
    if (item.type === 'rect') {
      width = item.w || 100;
      height = item.h || 100;
    } else {
      width = item.d || 100;
      height = item.d || 100;
    }
    length = item.length;
    
    // Применяем поворот к размерам
    const rotated = this.applyRotation(width, height, length, placement.rot);
    
    return {
      minX: placement.x,
      maxX: placement.x + rotated.width,
      minY: placement.y,
      maxY: placement.y + rotated.height,
      minZ: placement.z,
      maxZ: placement.z + rotated.length
    };
  }

  /**
   * Применяет поворот к размерам воздуховода
   */
  private applyRotation(
    width: MM,
    height: MM,
    length: MM,
    rotation: [0|90, 0|90, 0|90]
  ) {
    // Простая реализация для основных поворотов
    const [rotX, rotY, rotZ] = rotation;
    
    let w = width, h = height, l = length;
    
    // Поворот вокруг Z (в плоскости XY)
    if (rotZ === 90) {
      [w, h] = [h, w];
    }
    
    // Поворот вокруг Y (в плоскости XZ)
    if (rotY === 90) {
      [w, l] = [l, w];
    }
    
    // Поворот вокруг X (в плоскости YZ)
    if (rotX === 90) {
      [h, l] = [l, h];
    }
    
    return { width: w, height: h, length: l };
  }

  /**
   * Проверяет пересечение двух прямоугольных областей
   */
  private checkOverlap(bounds1: ItemBounds, bounds2: ItemBounds): boolean {
    return !(
      bounds1.maxX <= bounds2.minX || bounds2.maxX <= bounds1.minX ||
      bounds1.maxY <= bounds2.minY || bounds2.maxY <= bounds1.minY ||
      bounds1.maxZ <= bounds2.minZ || bounds2.maxZ <= bounds1.minZ
    );
  }

  /**
   * Оптимизирует расположение с учетом фланцев
   */
  public optimizePlacementForFlanges(
    items: DuctItem[],
    placements: Placement[]
  ): Placement[] {
    const optimized = [...placements];
    
    // Группируем воздуховоды по типу фланца
    const flangeGroups = this.groupByFlangeType(items);
    
    // Размещаем сначала воздуховоды с большими фланцами (TDC)
    // Они требуют больше места
    const sortedGroups = [
      flangeGroups['TDC'] || [],
      flangeGroups['SHINA_30'] || [],
      flangeGroups['SHINA_20'] || [],
      flangeGroups['REYКА'] || [],
      flangeGroups['NONE'] || []
    ].flat();
    
    // Пересортировываем placements согласно приоритету фланцев
    return this.rearrangePlacements(sortedGroups, optimized);
  }

  /**
   * Группирует воздуховоды по типу фланца
   */
  private groupByFlangeType(items: DuctItem[]): Record<string, DuctItem[]> {
    const groups: Record<string, DuctItem[]> = {};
    
    items.forEach(item => {
      const flangeType = item.flangeType || 'NONE';
      if (!groups[flangeType]) {
        groups[flangeType] = [];
      }
      groups[flangeType].push(item);
    });
    
    return groups;
  }

  /**
   * Перестраивает размещения согласно приоритету
   */
  private rearrangePlacements(
    sortedItems: DuctItem[],
    placements: Placement[]
  ): Placement[] {
    // Создаем карту для быстрого поиска
    const placementMap = new Map<string, Placement>();
    placements.forEach(p => placementMap.set(p.itemId, p));
    
    // Возвращаем отсортированные размещения
    return sortedItems
      .map(item => placementMap.get(item.id))
      .filter(p => p !== undefined) as Placement[];
  }

  /**
   * Валидирует все размещения на соблюдение правил фланцев
   */
  public validateAllPlacements(
    items: DuctItem[],
    placements: Placement[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Создаем карту для быстрого поиска
    const itemMap = new Map<string, DuctItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    // Проверяем каждую пару воздуховодов
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const placement1 = placements[i];
        const placement2 = placements[j];
        const item1 = itemMap.get(placement1.itemId);
        const item2 = itemMap.get(placement2.itemId);
        
        if (!item1 || !item2) continue;
        
        const actualDistance = this.calculateActualDistance(
          item1, item2, placement1, placement2
        );
        const requiredDistance = this.getRequiredDistance(item1, item2);
        
        if (actualDistance < requiredDistance) {
          const shortage = requiredDistance - actualDistance;
          errors.push(
            `Недостаточное расстояние между ${item1.id} и ${item2.id}: ` +
            `требуется ${requiredDistance}мм, фактически ${actualDistance.toFixed(1)}мм ` +
            `(не хватает ${shortage.toFixed(1)}мм)`
          );
        } else if (actualDistance < requiredDistance * 1.2) {
          warnings.push(
            `Минимальное расстояние между ${item1.id} и ${item2.id}: ` +
            `${actualDistance.toFixed(1)}мм (рекомендуется ${(requiredDistance * 1.2).toFixed(1)}мм)`
          );
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Получает поддерживаемые типы фланцев
   */
  public getSupportedFlangeTypes(): string[] {
    return Object.keys(FlangeRules.FLANGE_CLEARANCES);
  }

  /**
   * Получает минимальное расстояние для конкретного типа фланца
   */
  public getFlangeMinDistance(flangeType: string): MM {
    return FlangeRules.FLANGE_CLEARANCES[flangeType as keyof typeof FlangeRules.FLANGE_CLEARANCES] || 10;
  }

  /**
   * Проверяет возможность размещения элемента рядом с существующими
   */
  public canPlaceNear(
    item: DuctItem,
    placement: Placement,
    existingItems: DuctItem[],
    existingPlacements: Placement[]
  ): boolean {
    for (let i = 0; i < existingItems.length; i++) {
      if (!this.checkMinDistance(item, existingItems[i], placement, existingPlacements[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Валидирует конфигурацию размещения
   */
  public validatePlacementConfiguration(
    items: DuctItem[],
    placements: Placement[]
  ): {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const result = this.validateAllPlacements(items, placements);
    
    const recommendations: string[] = [];
    
    // Анализируем типы фланцев для рекомендаций
    const flangeStats = this.analyzeFlangeDistribution(items);
    
    if (flangeStats.TDC > 0) {
      recommendations.push('Элементы с TDC фланцами требуют максимального зазора 43мм');
    }
    
    if (flangeStats.SHINA_30 > 0) {
      recommendations.push('Шины 30мм требуют зазора 30мм');
    }
    
    if (result.warnings.length > 5) {
      recommendations.push('Рассмотрите увеличение габаритов транспорта');
    }
    
    return {
      isValid: result.valid,
      violations: result.errors,
      recommendations
    };
  }

  /**
   * Анализирует распределение типов фланцев
   */
  private analyzeFlangeDistribution(items: DuctItem[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    items.forEach(item => {
      const flangeType = item.flangeType || 'NONE';
      stats[flangeType] = (stats[flangeType] || 0) + item.qty;
    });
    
    return stats;
  }

  /**
   * Рассчитывает расстояние для технического обслуживания
   */
  public getMaintenanceDistance(item: DuctItem): MM {
    const flangeType = item.flangeType || 'NONE';
    const baseDistance = this.getFlangeMinDistance(flangeType);
    
    // Добавляем 50% для удобства обслуживания
    return Math.round(baseDistance * 1.5);
  }
}

// Интерфейсы
interface ItemBounds {
  minX: MM;
  maxX: MM;
  minY: MM;
  maxY: MM;
  minZ: MM;
  maxZ: MM;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}