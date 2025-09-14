import { Injectable } from '@nestjs/common';
import { Vehicle, DuctItem, PackResult } from '../types';
import { MultiScenarioOptimizer, Pack3D, ItemRegistry } from '@ventprom/core';

@Injectable()
export class PackService {
  private optimizer = new MultiScenarioOptimizer();
  private pack3d = new Pack3D();
  private itemRegistry = new ItemRegistry();
  
  async pack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    console.log(`PackService: Многосценарный анализ для ${items.length} воздуховодов в ${vehicle.name}`);
    
    try {
      // Регистрируем элементы в реестре
      this.itemRegistry.registerItems(items);
      
      // Используем реальный алгоритм упаковки
      const packingResult = this.pack3d.pack(vehicle, items);
      
      // Регистрируем размещения
      this.itemRegistry.registerPlacements(packingResult.placements);
      
      // Анализируем все сценарии упаковки на основе реального результата
      const scenarios = await this.optimizer.analyzeScenarios(vehicle, items);
      
      // Выбираем лучший сценарий с учетом приоритетов
      const hasFragileItems = items.some(item => (item as any).material === 'galvanized');
      const best = this.optimizer.selectBestScenario(scenarios, {
        prioritizeSafety: true, // Приоритет безопасности
        hasFragileItems
      });
      
      // Логируем результаты анализа
      console.log(`Выбран сценарий: ${best.config.name}`);
      console.log(`Предупреждения: ${best.warnings.length}`);
      console.log(`Рекомендации: ${best.recommendations.length}`);
      
      // Применяем дополнительную оптимизацию матрешки
      const optimizedItems = this.optimizeWithNesting(items);
      
      // Рассчитываем реальные метрики
      const totalWeight = this.itemRegistry.getStats().weightStats.total;
      
      // Получаем статистику элементов
      const stats = this.itemRegistry.getStats();
      
      // Создаем расширенное сообщение с реальными данными
      let message = `🎯 Профессиональная упаковка завершена:
📊 Выбран сценарий: "${best.config.name}"
📦 Реальные данные:
  • Воздуховодов: ${stats.totalItems} типов, ${packingResult.placements.length} позиций
  • Машин использовано: ${packingResult.binsUsed}
  • Загрузка: ${(packingResult.metrics.volumeFill * 100).toFixed(1)}%
  • Вес: ${totalWeight.toFixed(1)} кг
  • Центр тяжести: ${best.metrics.centerOfGravityHeight.toFixed(1)}% высоты
  • Стабильность: ${best.metrics.stabilityScore.toFixed(1)}/100
  • Защита хрупких: ${best.metrics.fragileProtectionScore.toFixed(1)}/100
  • Эффективность разгрузки: ${best.metrics.unloadingEfficiency.toFixed(1)}/100

📋 Материалы: ${Object.entries(stats.materialStats).map(([mat, count]) => `${mat}: ${count}`).join(', ')}
🔧 Фланцы: ${Object.entries(stats.flangeStats).map(([flange, count]) => `${flange}: ${count}`).join(', ')}`;

      // Добавляем информацию о безопасности транспортировки
      const safety = best.metrics.transportSafety;
      message += `\n🛡️ Безопасность транспортировки:
  • Стабильность торможения: ${safety.brakeStability ? '✅' : '❌'}
  • Стабильность поворотов: ${safety.turnStability ? '✅' : '❌'}
  • Устойчивость к вибрации: ${safety.vibrationResistance ? '✅' : '❌'}
  • Риск опрокидывания: ${this.getRiskEmoji(safety.tippingRisk)} ${safety.tippingRisk}`;

      // Добавляем предупреждения
      if (best.warnings.length > 0) {
        message += `\n⚠️ Предупреждения:\n${best.warnings.map(w => `  ${w}`).join('\n')}`;
      }
      
      // Добавляем рекомендации
      if (best.recommendations.length > 0) {
        message += `\n💡 Рекомендации:\n${best.recommendations.map(r => `  ${r}`).join('\n')}`;
      }

      // Информация о других сценариях
      if (scenarios.length > 1) {
        message += `\n\n📋 Альтернативные сценарии:`;
        scenarios.slice(1, 3).forEach((scenario, index) => {
          message += `\n${index + 2}. "${scenario.config.name}" - машин: ${scenario.metrics.vehiclesUsed}, стабильность: ${scenario.metrics.stabilityScore.toFixed(1)}`;
        });
      }
      
      // Возвращаем результат с дополнительной информацией
      const result: PackResult = {
        success: true,
        items: optimizedItems,
        vehicle,
        totalWeight: totalWeight,
        utilization: packingResult.metrics.volumeFill * 100,
        message
      };

      // Добавляем реальные размещения для 3D визуализации
      (result as any).placements = packingResult.placements;
      (result as any).rows = packingResult.rows;

      // Добавляем мета-информацию о сценарии
      (result as any).scenario = {
        name: best.config.name,
        description: best.config.description,
        metrics: best.metrics,
        warnings: best.warnings,
        recommendations: best.recommendations,
        allScenarios: scenarios.map(s => ({
          name: s.config.name,
          vehiclesUsed: s.metrics.vehiclesUsed,
          stabilityScore: s.metrics.stabilityScore,
          utilization: s.metrics.avgUtilization
        }))
      };
      
      return result;
      
    } catch (error) {
      console.error('Ошибка многосценарного анализа:', error);
      // Fallback на простую упаковку
      return this.fallbackPack(vehicle, items);
    }
  }

  private getRiskEmoji(risk: 'low' | 'medium' | 'high'): string {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  }

  // Fallback метод при ошибке
  private async fallbackPack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    const optimizedItems = this.optimizeWithNesting(items);
    const totalWeight = optimizedItems.reduce((sum, item) => sum + (item.weightKg * item.qty), 0);
    const utilization = vehicle.maxPayloadKg ? (totalWeight / vehicle.maxPayloadKg) * 100 : 0;
    
    return {
      success: true,
      items: optimizedItems,
      vehicle,
      totalWeight,
      utilization,
      message: 'Упаковка выполнена в базовом режиме (многосценарный анализ недоступен)'
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







