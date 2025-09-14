import { DuctItem, Placement, MM } from './models';

/**
 * Реестр элементов для связи Placement с реальными данными DuctItem
 * Решает проблему захардкоженных размеров и весов
 */
export class ItemRegistry {
  private itemMap = new Map<string, DuctItem>();
  private placementMap = new Map<string, Placement>();

  /**
   * Регистрирует элементы для использования в алгоритмах
   */
  registerItems(items: DuctItem[]): void {
    this.itemMap.clear();
    items.forEach(item => {
      this.itemMap.set(item.id, item);
    });
    console.log(`ItemRegistry: Зарегистрировано ${items.length} элементов`);
  }

  /**
   * Регистрирует размещения
   */
  registerPlacements(placements: Placement[]): void {
    this.placementMap.clear();
    placements.forEach(placement => {
      this.placementMap.set(placement.itemId, placement);
    });
    console.log(`ItemRegistry: Зарегистрировано ${placements.length} размещений`);
  }

  /**
   * Получает реальные размеры элемента по placement
   */
  getItemDimensions(placement: Placement): { w: MM; h: MM; l: MM } {
    const item = this.itemMap.get(placement.itemId);
    if (!item) {
      console.warn(`ItemRegistry: Элемент ${placement.itemId} не найден, используем значения по умолчанию`);
      return { w: 100, h: 100, l: 1000 };
    }

    // Базовые размеры
    let w: MM, h: MM, l: MM;
    
    if (item.type === 'rect') {
      w = item.w || 100;
      h = item.h || 100;
      l = item.length;
    } else {
      // Круглый воздуховод
      w = item.d || 100;
      h = item.d || 100;
      l = item.length;
    }

    // Применяем поворот
    return this.applyRotation(w, h, l, placement.rot);
  }

  /**
   * Получает реальный вес элемента
   */
  getItemWeight(placement: Placement): number {
    const item = this.itemMap.get(placement.itemId);
    if (!item) {
      console.warn(`ItemRegistry: Элемент ${placement.itemId} не найден, используем вес по умолчанию`);
      return 10;
    }

    // Если вес не задан, рассчитываем по ГОСТ
    if (item.weightKg) {
      return item.weightKg;
    }

    return this.calculateWeight(item);
  }

  /**
   * Получает элемент по ID
   */
  getItemById(itemId: string): DuctItem | null {
    return this.itemMap.get(itemId) || null;
  }

  /**
   * Получает все элементы для указанных размещений
   */
  getItemsForPlacements(placements: Placement[]): DuctItem[] {
    return placements
      .map(p => this.itemMap.get(p.itemId))
      .filter(item => item !== undefined) as DuctItem[];
  }

  /**
   * Рассчитывает объем элемента с учетом поворота
   */
  getItemVolume(placement: Placement): number {
    const item = this.itemMap.get(placement.itemId);
    if (!item) return 100 * 100 * 1000; // Значение по умолчанию

    if (item.type === 'rect') {
      return (item.w || 100) * (item.h || 100) * item.length;
    } else {
      const radius = (item.d || 100) / 2;
      return Math.PI * radius * radius * item.length;
    }
  }

  /**
   * Получает материал элемента
   */
  getItemMaterial(placement: Placement): string {
    const item = this.itemMap.get(placement.itemId);
    return item?.material || 'galvanized';
  }

  /**
   * Получает тип фланца элемента
   */
  getItemFlangeType(placement: Placement): string {
    const item = this.itemMap.get(placement.itemId);
    return item?.flangeType || 'NONE';
  }

  /**
   * Проверяет, является ли элемент хрупким
   */
  isItemFragile(placement: Placement): boolean {
    const item = this.itemMap.get(placement.itemId);
    return item?.material === 'galvanized' || item?.material === 'aluminum';
  }

  /**
   * Применяет поворот к размерам
   */
  private applyRotation(
    w: MM, h: MM, l: MM,
    rotation: [0|90, 0|90, 0|90]
  ): { w: MM; h: MM; l: MM } {
    const [rotX, rotY, rotZ] = rotation;
    
    let width = w, height = h, length = l;
    
    // Поворот вокруг Z (в плоскости XY)
    if (rotZ === 90) {
      [width, height] = [height, width];
    }
    
    // Поворот вокруг Y (в плоскости XZ)
    if (rotY === 90) {
      [width, length] = [length, width];
    }
    
    // Поворот вокруг X (в плоскости YZ)
    if (rotX === 90) {
      [height, length] = [length, height];
    }
    
    return { w: width, h: height, l: length };
  }

  /**
   * Рассчитывает вес воздуховода по ГОСТ
   */
  private calculateWeight(item: DuctItem): number {
    // Толщина стали по умолчанию (ГОСТ)
    const thickness = item.thickness || this.getDefaultThickness(item);
    
    // Плотность стали (кг/м³)
    const density = this.getMaterialDensity(item.material || 'galvanized');
    
    let surfaceArea: number; // м²
    
    if (item.type === 'rect') {
      // Прямоугольный воздуховод
      const w = (item.w || 100) / 1000; // мм -> м
      const h = (item.h || 100) / 1000; // мм -> м
      const l = item.length / 1000; // мм -> м
      
      // Площадь поверхности: 2*(w*l + h*l) - без торцов
      surfaceArea = 2 * (w * l + h * l);
    } else {
      // Круглый воздуховод
      const d = (item.d || 100) / 1000; // мм -> м
      const l = item.length / 1000; // мм -> м
      
      // Площадь боковой поверхности: π*d*l
      surfaceArea = Math.PI * d * l;
    }
    
    // Объем металла = площадь * толщина
    const metalVolume = surfaceArea * (thickness / 1000); // мм -> м
    
    // Вес = объем * плотность
    const weight = metalVolume * density;
    
    return Math.round(weight * 100) / 100; // Округляем до 2 знаков
  }

  /**
   * Получает толщину стенки по умолчанию по ГОСТ
   */
  private getDefaultThickness(item: DuctItem): number {
    if (item.type === 'rect') {
      const maxDimension = Math.max(item.w || 100, item.h || 100);
      
      if (maxDimension <= 250) return 0.5;      // до 250мм - 0.5мм
      if (maxDimension <= 500) return 0.7;      // до 500мм - 0.7мм  
      if (maxDimension <= 1000) return 0.9;     // до 1000мм - 0.9мм
      return 1.2;                               // свыше 1000мм - 1.2мм
    } else {
      const diameter = item.d || 100;
      
      if (diameter <= 200) return 0.5;          // до 200мм - 0.5мм
      if (diameter <= 400) return 0.7;          // до 400мм - 0.7мм
      if (diameter <= 800) return 0.9;          // до 800мм - 0.9мм
      return 1.2;                               // свыше 800мм - 1.2мм
    }
  }

  /**
   * Получает плотность материала
   */
  private getMaterialDensity(material: string): number {
    switch (material) {
      case 'galvanized': return 7850;      // Оцинкованная сталь
      case 'stainless': return 8000;       // Нержавеющая сталь
      case 'black_steel': return 7850;     // Черная сталь
      case 'aluminum': return 2700;        // Алюминий
      default: return 7850;                // По умолчанию - оцинкованная сталь
    }
  }

  /**
   * Получает статистику по зарегистрированным элементам
   */
  getStats(): {
    totalItems: number;
    totalPlacements: number;
    materialStats: Record<string, number>;
    flangeStats: Record<string, number>;
    weightStats: { min: number; max: number; avg: number; total: number };
  } {
    const materials: Record<string, number> = {};
    const flanges: Record<string, number> = {};
    const weights: number[] = [];

    this.itemMap.forEach(item => {
      // Статистика материалов
      const material = item.material || 'galvanized';
      materials[material] = (materials[material] || 0) + item.qty;

      // Статистика фланцев
      const flange = item.flangeType || 'NONE';
      flanges[flange] = (flanges[flange] || 0) + item.qty;

      // Статистика весов
      const weight = item.weightKg || this.calculateWeight(item);
      weights.push(weight * item.qty);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const avgWeight = weights.length > 0 ? totalWeight / weights.length : 0;

    return {
      totalItems: this.itemMap.size,
      totalPlacements: this.placementMap.size,
      materialStats: materials,
      flangeStats: flanges,
      weightStats: {
        min: Math.min(...weights, 0),
        max: Math.max(...weights, 0),
        avg: avgWeight,
        total: totalWeight
      }
    };
  }

  /**
   * Очищает реестр
   */
  clear(): void {
    this.itemMap.clear();
    this.placementMap.clear();
  }
}
