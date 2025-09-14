import { Vehicle, DuctItem, Placement, MM } from './models';

export interface CenterOfGravity {
  x: MM; // Боковое смещение от центра
  y: MM; // Высота центра тяжести
  z: MM; // Продольное смещение от центра
}

export interface TippingRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100, где 100 = максимальный риск
  factors: string[];
}

export interface VibrationResistance {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100, где 100 = отличная стойкость
  vulnerableItems: string[];
}

export interface BrakeStability {
  isStable: boolean;
  score: number; // 0-100, где 100 = отличная стабильность
  riskFactors: string[];
  recommendations: string[];
}

export interface TurnStability {
  maxSafeSpeed: number; // км/ч
  lateralForceResistance: number; // 0-100
  criticalAngle: number; // градусы
  warnings: string[];
}

export interface StabilityReport {
  centerOfGravity: CenterOfGravity;
  tippingRisk: TippingRisk;
  vibrationResistance: VibrationResistance;
  brakeStability: BrakeStability;
  turnStability: TurnStability;
  overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
  safetyScore: number; // 0-100
  recommendations: string[];
  warnings: string[];
}

export class StabilityAnalyzer {
  private readonly GRAVITY_ACCELERATION = 9.81; // м/с²
  private readonly SAFETY_MARGIN = 0.8; // 20% запас безопасности

  analyzeTransportStability(placements: Placement[], vehicle: Vehicle): StabilityReport {
    console.log('StabilityAnalyzer: Анализ стабильности транспорта');
    console.log(`Анализируется ${placements.length} размещений в ${vehicle.name}`);

    const centerOfGravity = this.calculateCenterOfGravity(placements, vehicle);
    const tippingRisk = this.calculateTippingRisk(placements, vehicle, centerOfGravity);
    const vibrationResistance = this.analyzeVibrationResistance(placements);
    const brakeStability = this.analyzeBrakeStability(placements, vehicle, centerOfGravity);
    const turnStability = this.analyzeTurnStability(placements, vehicle, centerOfGravity);

    const overallRating = this.calculateOverallRating(
      tippingRisk.score,
      vibrationResistance.score,
      brakeStability.score,
      turnStability.lateralForceResistance
    );

    const safetyScore = this.calculateSafetyScore(
      tippingRisk.score,
      vibrationResistance.score,
      brakeStability.score,
      turnStability.lateralForceResistance
    );

    const recommendations = this.generateRecommendations(
      tippingRisk,
      vibrationResistance,
      brakeStability,
      turnStability,
      centerOfGravity,
      vehicle
    );

    const warnings = this.generateWarnings(
      tippingRisk,
      vibrationResistance,
      brakeStability,
      turnStability
    );

    console.log(`StabilityAnalyzer: Анализ завершен, общая оценка: ${overallRating}, безопасность: ${safetyScore}/100`);

    return {
      centerOfGravity,
      tippingRisk,
      vibrationResistance,
      brakeStability,
      turnStability,
      overallRating,
      safetyScore,
      recommendations,
      warnings
    };
  }

  private calculateCenterOfGravity(placements: Placement[], vehicle: Vehicle): CenterOfGravity {
    if (placements.length === 0) {
      return { x: 0, y: vehicle.height / 2, z: vehicle.length / 2 };
    }

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;

    placements.forEach(placement => {
      const weight = this.getPlacementWeight(placement);
      totalWeight += weight;
      
      // Смещения относительно центра транспорта
      weightedX += (placement.x - 0) * weight; // X относительно центра ширины
      weightedY += placement.y * weight; // Y от пола
      weightedZ += (placement.z - 0) * weight; // Z относительно центра длины
    });

    if (totalWeight === 0) {
      return { x: 0, y: vehicle.height / 2, z: vehicle.length / 2 };
    }

    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
      z: weightedZ / totalWeight
    };
  }

  private calculateTippingRisk(placements: Placement[], vehicle: Vehicle, cog: CenterOfGravity): TippingRisk {
    const factors: string[] = [];
    let riskScore = 0;

    // 1. Высота центра тяжести (основной фактор)
    const heightRatio = cog.y / vehicle.height;
    if (heightRatio > 0.7) {
      riskScore += 40;
      factors.push('Очень высокий центр тяжести (>70% высоты)');
    } else if (heightRatio > 0.5) {
      riskScore += 25;
      factors.push('Высокий центр тяжести (>50% высоты)');
    } else if (heightRatio > 0.3) {
      riskScore += 10;
      factors.push('Умеренно высокий центр тяжести');
    }

    // 2. Боковое смещение центра тяжести
    const lateralOffset = Math.abs(cog.x) / (vehicle.width / 2);
    if (lateralOffset > 0.3) {
      riskScore += 30;
      factors.push('Значительное боковое смещение груза');
    } else if (lateralOffset > 0.15) {
      riskScore += 15;
      factors.push('Умеренное боковое смещение груза');
    }

    // 3. Тип и размер транспорта
    const vehicleStabilityFactor = this.getVehicleStabilityFactor(vehicle);
    riskScore += vehicleStabilityFactor;
    if (vehicleStabilityFactor > 10) {
      factors.push('Малогабаритный транспорт повышает риск');
    }

    // 4. Наличие тяжелых элементов наверху
    const topHeavyRisk = this.analyzeTopHeavyRisk(placements, vehicle);
    riskScore += topHeavyRisk;
    if (topHeavyRisk > 15) {
      factors.push('Тяжелые элементы в верхней части');
    }

    // 5. Незакрепленные круглые воздуховоды
    const roundDuctRisk = this.analyzeRoundDuctStability(placements);
    riskScore += roundDuctRisk;
    if (roundDuctRisk > 10) {
      factors.push('Недостаточная фиксация круглых воздуховодов');
    }

    const level = this.getTippingRiskLevel(riskScore);

    return {
      level,
      score: Math.min(100, riskScore),
      factors
    };
  }

  private analyzeVibrationResistance(placements: Placement[]): VibrationResistance {
    let totalScore = 100;
    const vulnerableItems: string[] = [];

    placements.forEach(placement => {
      const item = this.getItemFromPlacement(placement);
      if (!item) return;

      // Анализ хрупкости материала
      const material = (item as any).material || 'galvanized';
      if (material.includes('оцинк')) {
        const fragility = this.calculateFragilityScore(item, placement);
        if (fragility > 20) {
          totalScore -= fragility / 4;
          vulnerableItems.push(`${item.id}: хрупкий материал`);
        }
      }

      // Анализ размеров (большие элементы более уязвимы)
      const size = Math.max(item.w || item.d || 0, item.h || item.d || 0);
      if (size > 600) {
        totalScore -= 5;
        vulnerableItems.push(`${item.id}: большие размеры`);
      }

      // Анализ положения (высоко размещенные элементы)
      if (placement.y > 1000) {
        totalScore -= 10;
        vulnerableItems.push(`${item.id}: высокое размещение`);
      }

      // Анализ фиксации
      const fixationScore = this.analyzeItemFixation(item, placement);
      if (fixationScore < 70) {
        totalScore -= (100 - fixationScore) / 5;
        vulnerableItems.push(`${item.id}: недостаточная фиксация`);
      }
    });

    totalScore = Math.max(0, Math.min(100, totalScore));
    const level = this.getVibrationResistanceLevel(totalScore);

    return {
      level,
      score: totalScore,
      vulnerableItems
    };
  }

  private analyzeBrakeStability(placements: Placement[], vehicle: Vehicle, cog: CenterOfGravity): BrakeStability {
    let stabilityScore = 100;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // 1. Продольное смещение центра тяжести
    const longitudinalOffset = Math.abs(cog.z - vehicle.length / 2) / (vehicle.length / 2);
    if (longitudinalOffset > 0.3) {
      stabilityScore -= 25;
      riskFactors.push('Значительное продольное смещение груза');
      recommendations.push('Перераспределить груз по длине кузова');
    }

    // 2. Высота центра тяжести при торможении
    const brakeForceEffect = (cog.y / vehicle.height) * 30; // Эффект высоты при торможении
    stabilityScore -= brakeForceEffect;
    if (brakeForceEffect > 20) {
      riskFactors.push('Высокий риск опрокидывания при резком торможении');
      recommendations.push('Снизить скорость и увеличить дистанцию');
    }

    // 3. Анализ фиксации груза
    const unfixedItems = this.countUnfixedItems(placements);
    if (unfixedItems > 0) {
      const penalty = Math.min(30, unfixedItems * 5);
      stabilityScore -= penalty;
      riskFactors.push(`${unfixedItems} незафиксированных элементов`);
      recommendations.push('Установить дополнительные крепления');
    }

    // 4. Круглые воздуховоды (особый риск при торможении)
    const roundDuctRisk = this.analyzeRoundDuctBrakeRisk(placements);
    stabilityScore -= roundDuctRisk;
    if (roundDuctRisk > 15) {
      riskFactors.push('Круглые воздуховоды могут скатиться при торможении');
      recommendations.push('Установить упоры для круглых воздуховодов');
    }

    // 5. Распределение массы по высоте
    const massDistribution = this.analyzeMassDistribution(placements, vehicle);
    if (massDistribution.topHeavy) {
      stabilityScore -= 20;
      riskFactors.push('Неравномерное распределение массы по высоте');
      recommendations.push('Переместить тяжелые элементы вниз');
    }

    stabilityScore = Math.max(0, Math.min(100, stabilityScore));

    return {
      isStable: stabilityScore >= 70,
      score: stabilityScore,
      riskFactors,
      recommendations
    };
  }

  private analyzeTurnStability(placements: Placement[], vehicle: Vehicle, cog: CenterOfGravity): TurnStability {
    // Расчет максимальной безопасной скорости поворота
    const trackWidth = vehicle.width * 0.8; // Эффективная колея
    const heightFactor = cog.y / vehicle.height;
    
    // Базовая скорость для низкого центра тяжести
    let baseSpeed = 60; // км/ч
    
    // Коррекция на высоту центра тяжести
    baseSpeed *= (1 - heightFactor * 0.5);
    
    // Коррекция на боковое смещение
    const lateralOffset = Math.abs(cog.x) / (vehicle.width / 2);
    baseSpeed *= (1 - lateralOffset * 0.3);

    const maxSafeSpeed = Math.max(20, Math.min(80, baseSpeed));

    // Расчет сопротивления боковым силам
    const lateralForceResistance = this.calculateLateralForceResistance(
      placements, vehicle, cog, trackWidth
    );

    // Критический угол наклона
    const criticalAngle = this.calculateCriticalAngle(cog, vehicle, trackWidth);

    const warnings: string[] = [];
    if (maxSafeSpeed < 40) {
      warnings.push('Очень низкая безопасная скорость поворотов');
    }
    if (lateralForceResistance < 60) {
      warnings.push('Низкое сопротивление боковым силам');
    }
    if (criticalAngle < 15) {
      warnings.push('Малый критический угол наклона');
    }

    return {
      maxSafeSpeed: Math.round(maxSafeSpeed),
      lateralForceResistance: Math.round(lateralForceResistance),
      criticalAngle: Math.round(criticalAngle * 10) / 10,
      warnings
    };
  }

  // Вспомогательные методы

  private getPlacementWeight(placement: Placement): number {
    // Временная реализация - в реальности нужно получать из связанного элемента
    return 15; // кг - средний вес воздуховода
  }

  private getItemFromPlacement(placement: Placement): DuctItem | null {
    // Временная реализация - в реальности нужно получать связанный элемент
    return (placement as any).item || null;
  }

  private getVehicleStabilityFactor(vehicle: Vehicle): number {
    // Фактор нестабильности в зависимости от типа транспорта
    if (vehicle.name.toLowerCase().includes('газель')) {
      return 15; // Малогабаритный - менее стабильный
    }
    if (vehicle.name.toLowerCase().includes('камаз') || vehicle.name.toLowerCase().includes('фура')) {
      return 5; // Крупногабаритный - более стабильный
    }
    return 10; // Средний размер
  }

  private analyzeTopHeavyRisk(placements: Placement[], vehicle: Vehicle): number {
    const upperThreshold = vehicle.height * 0.7;
    let topWeight = 0;
    let totalWeight = 0;

    placements.forEach(placement => {
      const weight = this.getPlacementWeight(placement);
      totalWeight += weight;
      
      if (placement.y > upperThreshold) {
        topWeight += weight;
      }
    });

    if (totalWeight === 0) return 0;

    const topWeightRatio = topWeight / totalWeight;
    return topWeightRatio * 40; // Максимум 40 баллов риска
  }

  private analyzeRoundDuctStability(placements: Placement[]): number {
    let riskScore = 0;
    let roundDuctCount = 0;

    placements.forEach(placement => {
      const item = this.getItemFromPlacement(placement);
      if (item && item.type === 'round') {
        roundDuctCount++;
        
        // Проверка наличия фиксации
        const hasFixation = this.checkRoundDuctFixation(placement);
        if (!hasFixation) {
          riskScore += 8; // Каждый незафиксированный круглый элемент
        }
      }
    });

    return Math.min(30, riskScore); // Максимум 30 баллов
  }

  private checkRoundDuctFixation(placement: Placement): boolean {
    // Упрощенная проверка - в реальности нужен анализ окружающих элементов
    return false; // Консервативная оценка
  }

  private calculateFragilityScore(item: DuctItem, placement: Placement): number {
    let fragility = 0;
    
    const material = (item as any).material || 'galvanized';
    if (material.includes('оцинк')) {
      fragility += 20;
    }
    
    const thickness = (item as any).thickness || 0.7;
    if (thickness < 0.5) {
      fragility += 15;
    }
    
    // Высокое размещение увеличивает уязвимость
    if (placement.y > 1000) {
      fragility += 10;
    }
    
    return fragility;
  }

  private analyzeItemFixation(item: DuctItem, placement: Placement): number {
    // Упрощенная оценка фиксации (0-100)
    let fixationScore = 50; // Базовая оценка
    
    // Прямоугольные элементы легче фиксировать
    if (item.type === 'rect') {
      fixationScore += 20;
    }
    
    // Большие элементы сложнее зафиксировать
    const size = Math.max(item.w || item.d || 0, item.h || item.d || 0);
    if (size > 800) {
      fixationScore -= 15;
    }
    
    return Math.max(0, Math.min(100, fixationScore));
  }

  private countUnfixedItems(placements: Placement[]): number {
    // Упрощенная оценка - в реальности нужен анализ креплений
    return Math.floor(placements.length * 0.2); // 20% считаем незафиксированными
  }

  private analyzeRoundDuctBrakeRisk(placements: Placement[]): number {
    let risk = 0;
    
    placements.forEach(placement => {
      const item = this.getItemFromPlacement(placement);
      if (item && item.type === 'round') {
        // Каждый круглый воздуховод без фиксации добавляет риск
        if (!this.checkRoundDuctFixation(placement)) {
          risk += 5;
        }
      }
    });
    
    return Math.min(25, risk);
  }

  private analyzeMassDistribution(placements: Placement[], vehicle: Vehicle): { topHeavy: boolean; ratio: number } {
    const midHeight = vehicle.height / 2;
    let topMass = 0;
    let bottomMass = 0;
    
    placements.forEach(placement => {
      const weight = this.getPlacementWeight(placement);
      if (placement.y > midHeight) {
        topMass += weight;
      } else {
        bottomMass += weight;
      }
    });
    
    const totalMass = topMass + bottomMass;
    const ratio = totalMass > 0 ? topMass / totalMass : 0;
    
    return {
      topHeavy: ratio > 0.4, // Более 40% массы сверху
      ratio
    };
  }

  private calculateLateralForceResistance(
    placements: Placement[], 
    vehicle: Vehicle, 
    cog: CenterOfGravity, 
    trackWidth: number
  ): number {
    // Базовое сопротивление в зависимости от геометрии
    const stabilityBase = (trackWidth / vehicle.height) * 50;
    
    // Коррекция на высоту центра тяжести
    const heightPenalty = (cog.y / vehicle.height) * 30;
    
    // Коррекция на боковое смещение
    const lateralPenalty = (Math.abs(cog.x) / (vehicle.width / 2)) * 20;
    
    const resistance = stabilityBase - heightPenalty - lateralPenalty;
    
    return Math.max(20, Math.min(100, resistance));
  }

  private calculateCriticalAngle(cog: CenterOfGravity, vehicle: Vehicle, trackWidth: number): number {
    // Угол в градусах, при котором транспорт может опрокинуться
    const heightRatio = cog.y / (trackWidth / 2);
    const criticalAngle = Math.atan(1 / heightRatio) * (180 / Math.PI);
    
    return Math.max(5, Math.min(45, criticalAngle));
  }

  private getTippingRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private getVibrationResistanceLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private calculateOverallRating(
    tippingScore: number,
    vibrationScore: number,
    brakeScore: number,
    turnScore: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous' {
    // Инвертируем tippingScore (чем больше, тем хуже)
    const adjustedTippingScore = 100 - tippingScore;
    
    const average = (adjustedTippingScore + vibrationScore + brakeScore + turnScore) / 4;
    
    if (tippingScore >= 80 || brakeScore < 50) return 'dangerous';
    if (average >= 85) return 'excellent';
    if (average >= 70) return 'good';
    if (average >= 55) return 'fair';
    return 'poor';
  }

  private calculateSafetyScore(
    tippingScore: number,
    vibrationScore: number,
    brakeScore: number,
    turnScore: number
  ): number {
    // Взвешенная оценка (опрокидывание - самый критичный фактор)
    const weights = {
      tipping: 0.4,    // 40% - опрокидывание
      brake: 0.3,      // 30% - торможение
      turn: 0.2,       // 20% - повороты
      vibration: 0.1   // 10% - вибрация
    };
    
    const adjustedTippingScore = 100 - tippingScore;
    
    const weightedScore = (
      adjustedTippingScore * weights.tipping +
      brakeScore * weights.brake +
      turnScore * weights.turn +
      vibrationScore * weights.vibration
    );
    
    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  private generateRecommendations(
    tippingRisk: TippingRisk,
    vibrationResistance: VibrationResistance,
    brakeStability: BrakeStability,
    turnStability: TurnStability,
    cog: CenterOfGravity,
    vehicle: Vehicle
  ): string[] {
    const recommendations: string[] = [];

    // Рекомендации по опрокидыванию
    if (tippingRisk.level === 'critical' || tippingRisk.level === 'high') {
      recommendations.push('🚨 Критично: перераспределить груз для снижения центра тяжести');
      recommendations.push('📦 Тяжелые элементы разместить в нижней части кузова');
    }

    // Рекомендации по центру тяжести
    const heightRatio = cog.y / vehicle.height;
    if (heightRatio > 0.5) {
      recommendations.push('⬇️ Снизить центр тяжести груза до 50% высоты кузова');
    }

    // Рекомендации по боковому смещению
    const lateralOffset = Math.abs(cog.x) / (vehicle.width / 2);
    if (lateralOffset > 0.15) {
      recommendations.push('⚖️ Выровнять боковое распределение груза');
    }

    // Рекомендации по вибрации
    if (vibrationResistance.level === 'poor' || vibrationResistance.level === 'fair') {
      recommendations.push('🔧 Усилить крепление хрупких элементов');
      if (vibrationResistance.vulnerableItems.length > 0) {
        recommendations.push('🛡️ Добавить защитную упаковку для оцинкованных элементов');
      }
    }

    // Рекомендации по торможению
    if (!brakeStability.isStable) {
      recommendations.push('🛑 Усилить продольную фиксацию груза');
      recommendations.push('⚓ Установить дополнительные упоры');
    }

    // Рекомендации по скорости
    if (turnStability.maxSafeSpeed < 50) {
      recommendations.push(`🚗 Не превышать ${turnStability.maxSafeSpeed} км/ч при поворотах`);
    }

    // Общие рекомендации
    recommendations.push('📋 Проверить все крепления перед отправкой');
    recommendations.push('🎯 Провести тестовую поездку на малой скорости');

    return recommendations;
  }

  private generateWarnings(
    tippingRisk: TippingRisk,
    vibrationResistance: VibrationResistance,
    brakeStability: BrakeStability,
    turnStability: TurnStability
  ): string[] {
    const warnings: string[] = [];

    if (tippingRisk.level === 'critical') {
      warnings.push('🚨 КРИТИЧЕСКИЙ РИСК ОПРОКИДЫВАНИЯ! Перевозка запрещена без перепаковки');
    }

    if (tippingRisk.level === 'high') {
      warnings.push('⚠️ Высокий риск опрокидывания при резких маневрах');
    }

    if (!brakeStability.isStable) {
      warnings.push('🛑 Риск смещения груза при резком торможении');
    }

    if (turnStability.maxSafeSpeed < 40) {
      warnings.push('🐌 Крайне низкая безопасная скорость поворотов');
    }

    if (vibrationResistance.level === 'poor') {
      warnings.push('💥 Высокий риск повреждения груза от вибрации');
    }

    return warnings;
  }
}
