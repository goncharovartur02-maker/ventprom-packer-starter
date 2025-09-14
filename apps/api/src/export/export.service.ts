import { Injectable } from '@nestjs/common';
import { PackResult, Vehicle, DuctItem } from '../types';
import * as PDFDocument from 'pdfkit';

interface PlacementWithItem {
  itemId: string;
  index: number;
  x: number;
  y: number;
  z: number;
  rot: [0|90, 0|90, 0|90];
  layer: number;
  row: number;
  item?: DuctItem;
  dimensions?: { w: number; h: number; l: number };
}

@Injectable()
export class ExportService {
  async exportPdf(
    packResult: PackResult,
    companyMeta?: { title: string; logoBase64: string },
  ): Promise<Buffer> {
    console.log('ExportService: Создание профессионального PDF отчета');
    
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 50,
      bufferPages: true
    });

    // Собираем PDF в буфер
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    try {
      // Генерируем содержимое PDF
      await this.generatePdfContent(doc, packResult, companyMeta);
      doc.end();
      
      return await pdfPromise;
    } catch (error) {
      console.error('ExportService: Ошибка создания PDF:', error);
      doc.end();
      throw error;
    }
  }

  private async generatePdfContent(
    doc: PDFKit.PDFDocument,
    packResult: PackResult,
    companyMeta?: { title: string; logoBase64: string }
  ): Promise<void> {
    // 1. Титульная страница
    this.addTitlePage(doc, packResult, companyMeta);
    
    // 2. Сводная страница со статистикой
    doc.addPage();
    this.addSummaryPage(doc, packResult);
    
    // 3. Детальные страницы для каждой машины
    const groupedByVehicle = this.groupPlacementsByVehicle(packResult);
    
    for (const [vehicleId, vehicleData] of groupedByVehicle) {
      doc.addPage();
      this.addVehiclePage(doc, vehicleData.vehicle, vehicleData.placements, vehicleData.rows);
      
      // Для каждого ряда - отдельная страница с деталями
      for (const [rowNum, rowPlacements] of vehicleData.rows) {
        doc.addPage();
        this.addRowDetailPage(doc, vehicleData.vehicle, rowNum, rowPlacements);
      }
    }
    
    console.log('ExportService: PDF отчет успешно создан');
  }

  private addTitlePage(
    doc: PDFKit.PDFDocument,
    packResult: PackResult,
    companyMeta?: { title: string; logoBase64: string }
  ): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    let currentY = 80;

    // Заголовок
    doc.fontSize(28)
       .fillColor('#2563eb')
       .text('ОТЧЕТ ПО УПАКОВКЕ ВОЗДУХОВОДОВ', {
         align: 'center',
         width: pageWidth - 100
       });

    currentY += 80;

    // Подзаголовок
    doc.fontSize(16)
       .fillColor('#64748b')
       .text('Детальная схема размещения груза в транспортном средстве', {
         align: 'center',
         width: pageWidth - 100
       });

    currentY += 60;

    // Информация о компании (если есть)
    if (companyMeta?.title) {
      doc.fontSize(14)
         .fillColor('#1e293b')
         .text(`Компания: ${companyMeta.title}`, 50, currentY);
      currentY += 30;
    }

    // Основная информация
    doc.fontSize(12)
       .fillColor('#374151');

    const info = [
      `Дата создания: ${new Date().toLocaleDateString('ru-RU')}`,
      `Время создания: ${new Date().toLocaleTimeString('ru-RU')}`,
      ``,
      `СВОДНАЯ ИНФОРМАЦИЯ:`,
      `• Транспортные средства: ${this.getVehicleCount(packResult)}`,
      `• Общее количество позиций: ${this.getTotalItemCount(packResult)}`,
      `• Общий вес груза: ${this.getTotalWeight(packResult).toFixed(1)} кг`,
      `• Общая утилизация: ${this.getAverageUtilization(packResult).toFixed(1)}%`
    ];

    info.forEach(line => {
      if (line.startsWith('СВОДНАЯ')) {
        doc.fontSize(14).fillColor('#1e293b');
      } else if (line.startsWith('•')) {
        doc.fontSize(12).fillColor('#059669');
      } else {
        doc.fontSize(12).fillColor('#374151');
      }
      
      doc.text(line, 50, currentY);
      currentY += line === '' ? 10 : 25;
    });

    // Футер титульной страницы
    doc.fontSize(10)
       .fillColor('#9ca3af')
       .text(
         'Создано автоматически системой Wentprom калькулятор',
         50,
         pageHeight - 100,
         { align: 'center', width: pageWidth - 100 }
       );
  }

  private addSummaryPage(doc: PDFKit.PDFDocument, packResult: PackResult): void {
    let currentY = 50;

    // Заголовок страницы
    doc.fontSize(20)
       .fillColor('#1e293b')
       .text('СВОДНАЯ СТАТИСТИКА', 50, currentY);

    currentY += 50;

    // Статистика по транспорту
    const vehicleGroups = this.groupPlacementsByVehicle(packResult);
    
    doc.fontSize(16)
       .fillColor('#2563eb')
       .text('Использование транспортных средств:', 50, currentY);

    currentY += 35;

    vehicleGroups.forEach(([vehicleId, data], index) => {
      const vehicle = data.vehicle;
      const weight = this.calculateVehicleWeight(data.placements);
      const utilization = vehicle.maxPayloadKg ? (weight / vehicle.maxPayloadKg) * 100 : 0;
      
      doc.fontSize(14)
         .fillColor('#1e293b')
         .text(`${index + 1}. ${vehicle.name}`, 50, currentY);
      
      currentY += 25;
      
      const stats = [
        `   • Позиций груза: ${data.placements.length}`,
        `   • Рядов: ${data.rows.size}`,
        `   • Вес: ${weight.toFixed(1)} кг`,
        `   • Утилизация: ${utilization.toFixed(1)}%`,
        `   • Габариты: ${vehicle.width}×${vehicle.height}×${vehicle.length} мм`
      ];
      
      doc.fontSize(12).fillColor('#374151');
      stats.forEach(stat => {
        doc.text(stat, 50, currentY);
        currentY += 20;
      });
      
      currentY += 15;
    });

    // Рекомендации по безопасности
    currentY += 30;
    doc.fontSize(16)
       .fillColor('#dc2626')
       .text('РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ:', 50, currentY);

    currentY += 35;

    const safetyTips = [
      '• Тяжелые воздуховоды размещены в нижних слоях',
      '• Круглые воздуховоды зафиксированы от качения',
      '• Соблюдены максимальные высоты стопок по материалам',
      '• Учтено распределение веса по осям транспорта',
      '• Хрупкая оцинкованная сталь защищена от повреждений'
    ];

    doc.fontSize(12).fillColor('#374151');
    safetyTips.forEach(tip => {
      doc.text(tip, 50, currentY);
      currentY += 22;
    });
  }

  private addVehiclePage(
    doc: PDFKit.PDFDocument,
    vehicle: Vehicle,
    placements: PlacementWithItem[],
    rows: Map<number, PlacementWithItem[]>
  ): void {
    let currentY = 50;

    // Заголовок
    doc.fontSize(18)
       .fillColor('#1e293b')
       .text(`ТРАНСПОРТНОЕ СРЕДСТВО: ${vehicle.name}`, 50, currentY);

    currentY += 40;

    // Характеристики транспорта
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Характеристики:', 50, currentY);

    currentY += 25;

    const vehicleInfo = [
      `Длина: ${vehicle.length} мм`,
      `Ширина: ${vehicle.width} мм`, 
      `Высота: ${vehicle.height} мм`,
      `Грузоподъемность: ${vehicle.maxPayloadKg} кг`
    ];

    doc.fontSize(12).fillColor('#374151');
    vehicleInfo.forEach(info => {
      doc.text(`• ${info}`, 70, currentY);
      currentY += 20;
    });

    currentY += 30;

    // Схема размещения (вид сверху)
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Схема размещения (вид сверху):', 50, currentY);

    currentY += 30;

    this.drawTopViewDiagram(doc, vehicle, placements, 50, currentY, 500, 300);
    currentY += 320;

    // Информация о рядах
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Распределение по рядам:', 50, currentY);

    currentY += 30;

    rows.forEach((rowPlacements, rowNum) => {
      const rowWeight = this.calculateRowWeight(rowPlacements);
      
      doc.fontSize(12)
         .fillColor('#1e293b')
         .text(`Ряд ${rowNum + 1}: ${rowPlacements.length} позиций, вес: ${rowWeight.toFixed(1)} кг`, 70, currentY);
      
      currentY += 25;
    });
  }

  private addRowDetailPage(
    doc: PDFKit.PDFDocument,
    vehicle: Vehicle,
    rowNum: number,
    placements: PlacementWithItem[]
  ): void {
    let currentY = 50;

    // Заголовок
    doc.fontSize(18)
       .fillColor('#1e293b')
       .text(`РЯД ${rowNum + 1} - ДЕТАЛЬНАЯ ИНФОРМАЦИЯ`, 50, currentY);

    currentY += 40;

    // Схема ряда (вид сбоку)
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Схема ряда (вид сбоку):', 50, currentY);

    currentY += 25;

    this.drawSideViewDiagram(doc, vehicle, placements, 50, currentY, 500, 200);
    currentY += 220;

    // Таблица с позициями
    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Таблица позиций:', 50, currentY);

    currentY += 25;

    this.drawPlacementTable(doc, placements, 50, currentY);
  }

  private drawTopViewDiagram(
    doc: PDFKit.PDFDocument,
    vehicle: Vehicle,
    placements: PlacementWithItem[],
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Рамка кузова
    doc.rect(x, y, width, height)
       .strokeColor('#374151')
       .lineWidth(2)
       .stroke();

    // Масштаб
    const scaleX = width / vehicle.length;
    const scaleY = height / vehicle.width;

    // Отрисовка воздуховодов
    placements.forEach((placement, index) => {
      const dims = placement.dimensions || { w: 100, h: 100, l: 1000 };
      
      const rectX = x + (placement.z * scaleX);
      const rectY = y + (placement.x * scaleY);
      const rectW = dims.l * scaleX;
      const rectH = dims.w * scaleY;

      // Цвет в зависимости от ряда
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const color = colors[placement.row % colors.length];

      doc.rect(rectX, rectY, rectW, rectH)
         .fillColor(color)
         .fillOpacity(0.7)
         .fill()
         .strokeColor('#1f2937')
         .lineWidth(1)
         .stroke();

      // Номер позиции
      if (rectW > 20 && rectH > 15) {
        doc.fontSize(8)
           .fillColor('#ffffff')
           .text(`${index + 1}`, rectX + 2, rectY + 2);
      }
    });

    // Легенда
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text(`Масштаб: 1:${Math.round(1/Math.min(scaleX, scaleY))}`, x, y + height + 10);
  }

  private drawSideViewDiagram(
    doc: PDFKit.PDFDocument,
    vehicle: Vehicle,
    placements: PlacementWithItem[],
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Рамка кузова (вид сбоку)
    doc.rect(x, y, width, height)
       .strokeColor('#374151')
       .lineWidth(2)
       .stroke();

    // Масштаб
    const scaleX = width / vehicle.length;
    const scaleY = height / vehicle.height;

    // Группировка по слоям (Y координата)
    const layers = new Map<number, PlacementWithItem[]>();
    placements.forEach(placement => {
      const layerY = Math.floor(placement.y / 200) * 200; // Группируем по 200мм
      if (!layers.has(layerY)) layers.set(layerY, []);
      layers.get(layerY)!.push(placement);
    });

    // Отрисовка слоев
    Array.from(layers.entries()).forEach(([layerY, layerPlacements], layerIndex) => {
      const baseY = y + height - (layerY * scaleY) - 20;
      
      layerPlacements.forEach((placement, index) => {
        const dims = placement.dimensions || { w: 100, h: 100, l: 1000 };
        
        const rectX = x + (placement.z * scaleX);
        const rectY = baseY - (dims.h * scaleY);
        const rectW = dims.l * scaleX;
        const rectH = dims.h * scaleY;

        // Цвет воздуховода
        const color = placement.item?.type === 'round' ? '#10b981' : '#3b82f6';

        doc.rect(rectX, rectY, rectW, rectH)
           .fillColor(color)
           .fillOpacity(0.6)
           .fill()
           .strokeColor('#1f2937')
           .lineWidth(1)
           .stroke();
      });
    });
  }

  private drawPlacementTable(
    doc: PDFKit.PDFDocument,
    placements: PlacementWithItem[],
    x: number,
    y: number
  ): void {
    const tableWidth = 500;
    const colWidths = [40, 80, 100, 120, 80, 80]; // ID, Тип, Размеры, Координаты, Вес, Материал
    const rowHeight = 25;
    let currentY = y;

    // Заголовки таблицы
    const headers = ['№', 'Тип', 'Размеры (мм)', 'Координаты (мм)', 'Вес (кг)', 'Слой'];
    
    doc.fontSize(10)
       .fillColor('#ffffff')
       .rect(x, currentY, tableWidth, rowHeight)
       .fillColor('#374151')
       .fill();

    let currentX = x;
    headers.forEach((header, index) => {
      doc.fillColor('#ffffff')
         .text(header, currentX + 5, currentY + 8, { width: colWidths[index] - 10 });
      currentX += colWidths[index];
    });

    currentY += rowHeight;

    // Строки таблицы
    placements.forEach((placement, index) => {
      const dims = placement.dimensions || { w: 100, h: 100, l: 1000 };
      const item = placement.item;
      
      // Чередующиеся цвета строк
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      
      doc.rect(x, currentY, tableWidth, rowHeight)
         .fillColor(bgColor)
         .fill()
         .strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .stroke();

      const data = [
        `${index + 1}`,
        item?.type === 'round' ? 'Круглый' : 'Прямоуг.',
        `${dims.w}×${dims.h}×${dims.l}`,
        `${placement.x},${placement.y},${placement.z}`,
        `${item?.weightKg?.toFixed(1) || '0.0'}`,
        `${placement.layer + 1}`
      ];

      currentX = x;
      doc.fontSize(9).fillColor('#374151');
      
      data.forEach((text, colIndex) => {
        doc.text(text, currentX + 5, currentY + 8, { 
          width: colWidths[colIndex] - 10,
          ellipsis: true
        });
        currentX += colWidths[colIndex];
      });

      currentY += rowHeight;
    });
  }

  // Утилиты для группировки и расчетов
  private groupPlacementsByVehicle(packResult: PackResult): Map<string, {
    vehicle: Vehicle;
    placements: PlacementWithItem[];
    rows: Map<number, PlacementWithItem[]>;
  }> {
    const groups = new Map();
    
    // Пока работаем с одним транспортом
    const vehicle = packResult.vehicle;
    const placements = this.enrichPlacementsWithItems(packResult);
    const rows = this.groupPlacementsByRow(placements);
    
    groups.set(vehicle.id, {
      vehicle,
      placements,
      rows
    });
    
    return groups;
  }

  private enrichPlacementsWithItems(packResult: PackResult): PlacementWithItem[] {
    // В упрощенной версии используем items из result
    return packResult.items.map((item, index) => ({
      itemId: item.id,
      index,
      x: index * 300, // Упрощенное размещение
      y: 0,
      z: 0,
      rot: [0, 0, 0] as [0|90, 0|90, 0|90],
      layer: 0,
      row: Math.floor(index / 3),
      item,
      dimensions: {
        w: item.w || 100,
        h: item.h || 100,
        l: item.length || 1000
      }
    }));
  }

  private groupPlacementsByRow(placements: PlacementWithItem[]): Map<number, PlacementWithItem[]> {
    const rows = new Map<number, PlacementWithItem[]>();
    
    placements.forEach(placement => {
      if (!rows.has(placement.row)) {
        rows.set(placement.row, []);
      }
      rows.get(placement.row)!.push(placement);
    });
    
    return rows;
  }

  private getVehicleCount(packResult: PackResult): number {
    return 1; // Пока работаем с одним транспортом
  }

  private getTotalItemCount(packResult: PackResult): number {
    return packResult.items.reduce((sum, item) => sum + item.qty, 0);
  }

  private getTotalWeight(packResult: PackResult): number {
    return packResult.totalWeight || 0;
  }

  private getAverageUtilization(packResult: PackResult): number {
    return packResult.utilization || 0;
  }

  private calculateVehicleWeight(placements: PlacementWithItem[]): number {
    return placements.reduce((sum, placement) => sum + (placement.item?.weightKg || 0), 0);
  }

  private calculateRowWeight(placements: PlacementWithItem[]): number {
    return placements.reduce((sum, placement) => sum + (placement.item?.weightKg || 0), 0);
  }

  // Заглушки для других методов экспорта
  async exportGlb(packResult: PackResult): Promise<Buffer> {
    throw new Error('GLB export not implemented yet');
  }

  async exportHtml(packResult: PackResult): Promise<string> {
    throw new Error('HTML export not implemented yet');
  }
}
