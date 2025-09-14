import { Injectable } from '@nestjs/common';
import { Vehicle, DuctItem, PackResult } from '../types';

@Injectable()
export class PackService {
  async pack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    console.log(`PackService: Упаковка ${items.length} воздуховодов в ${vehicle.name}`);
    
    // Применяем алгоритм матрешки
    const optimizedItems = this.optimizeWithNesting(items);
    
    // Рассчитываем метрики
    const totalWeight = optimizedItems.reduce((sum, item) => sum + (item.weightKg * item.qty), 0);
    const utilization = vehicle.maxPayloadKg ? (totalWeight / vehicle.maxPayloadKg) * 100 : 0;
    
    // Рассчитываем объемную эффективность
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    const itemsVolume = optimizedItems.reduce((sum, item) => sum + this.calculateVolume(item) * item.qty, 0);
    const volumeUtilization = (itemsVolume / vehicleVolume) * 100;
    
    // Создаем сообщение с деталями оптимизации
    const originalCount = items.reduce((sum, item) => sum + item.qty, 0);
    const optimizedCount = optimizedItems.reduce((sum, item) => sum + item.qty, 0);
    const spaceSaved = originalCount - optimizedCount;
    
    // Анализ правил укладки
    const safetyAnalysis = this.analyzeSafetyRules(optimizedItems, vehicle);
    
    let message = `Упаковка завершена:
• ${originalCount} воздуховодов → ${optimizedCount} позиций
• Экономия места: ${spaceSaved} позиций благодаря матрешке
• Вес: ${totalWeight.toFixed(1)} кг (${utilization.toFixed(1)}% от грузоподъемности)
• Объем: ${volumeUtilization.toFixed(1)}% от кузова
• Правила безопасности: ${safetyAnalysis.status}`;

    if (spaceSaved > 0) {
      message += `\n🎯 Матрешка: ${spaceSaved} воздуховодов вложено в другие!`;
    }
    
    if (safetyAnalysis.warnings.length > 0) {
      message += `\n⚠️ Предупреждения: ${safetyAnalysis.warnings.join(', ')}`;
    }
    
    if (safetyAnalysis.recommendations.length > 0) {
      message += `\n💡 Рекомендации: ${safetyAnalysis.recommendations.join(', ')}`;
    }
    
    return {
      success: true,
      items: optimizedItems,
      vehicle,
      totalWeight,
      utilization: Math.max(utilization, volumeUtilization), // Используем максимальную утилизацию
      message
    };
  }

  // Алгоритм матрешки для воздуховодов
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
        // Создаем композитный элемент
        nested.push({
          ...outer,
          id: `nested_${outer.id}`,
          weightKg: (outer.weightKg || 0) + innerItems.reduce((sum, item) => sum + (item.weightKg || 0), 0),
          qty: 1 // Один композитный элемент
        });
        
        console.log(`Матрешка: ${outer.id} содержит ${innerItems.length} вложенных воздуховодов`);
      } else {
        nested.push(outer);
      }
    }
    
    return nested;
  }

  // Проверка возможности вложения (матрешка)
  private checkNesting(outer: DuctItem, inner: DuctItem): boolean {
    const clearance = 10; // 10mm зазор
    
    // Круглый в круглый
    if (outer.type === 'rect' && outer.w && outer.h && inner.type === 'rect' && inner.w && inner.h) {
      return inner.w + clearance < outer.w && 
             inner.h + clearance < outer.h && 
             inner.length <= outer.length;
    }
    
    // Круглый в прямоугольный
    if (outer.type === 'rect' && outer.w && outer.h && inner.type === 'round' && inner.d) {
      const minDimension = Math.min(outer.w, outer.h);
      return inner.d + clearance < minDimension && inner.length <= outer.length;
    }
    
    return false;
  }

  // Расчет объема воздуховода
  private calculateVolume(item: DuctItem): number {
    if (item.type === 'rect' && item.w && item.h) {
      return item.w * item.h * item.length;
    }
    return 100 * 100 * 1000; // Fallback volume
  }

  // Анализ правил безопасности укладки
  private analyzeSafetyRules(items: DuctItem[], vehicle: Vehicle): {
    status: string;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Анализ типов воздуховодов
    const roundItems = items.filter(item => item.type === 'round');
    const rectItems = items.filter(item => item.type === 'rect');
    
    // Проверка круглых воздуховодов
    if (roundItems.length > 0) {
      const heavyRounds = roundItems.filter(item => (item.weightKg || 0) > 20);
      if (heavyRounds.length > 0) {
        warnings.push('Тяжелые круглые воздуховоды требуют дополнительной фиксации');
        recommendations.push('Использовать распорки между круглыми воздуховодами');
      }
    }
    
    // Проверка распределения веса
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg * item.qty), 0);
    const avgWeight = totalWeight / items.length;
    
    if (avgWeight > 30) {
      warnings.push('Высокий средний вес элементов');
      recommendations.push('Размещать тяжелые элементы равномерно по кузову');
    }
    
    // Проверка материалов
    const galvanizedItems = items.filter(item => 
      (item as any).material === 'galvanized' || !((item as any).material));
    
    if (galvanizedItems.length > items.length * 0.8) {
      recommendations.push('Оцинкованная сталь - осторожно с царапинами');
    }
    
    // Проверка максимальной высоты стопки
    const tallItems = items.filter(item => {
      const height = item.h || item.d || 100;
      return height > 300; // Более 30см
    });
    
    if (tallItems.length > 3) {
      warnings.push('Много высоких элементов - ограничить высоту стопки');
      recommendations.push('Максимум 2м в высоту для оцинкованной стали');
    }
    
    // Общий статус
    let status = '✅ Соблюдены';
    if (warnings.length > 0) {
      status = '⚠️ С предупреждениями';
    }
    
    return {
      status,
      warnings,
      recommendations
    };
  }
}







