import * as ExcelJS from 'exceljs';
import { DuctItem, UniversalItem } from '../../core/src';
import { UniversalParser } from './universal';

export class ExcelParser {
  private universalParser = new UniversalParser();
  
  // Legacy column mappings for backward compatibility
  private columnMappings = {
    id: ['id', 'код', 'артикул', 'номер', 'код_товара'],
    type: ['type', 'тип', 'вид', 'форма'],
    width: ['w', 'width', 'ширина', 'w_мм'],
    height: ['h', 'height', 'высота', 'h_мм'],
    diameter: ['d', 'diameter', 'диаметр', 'd_мм'],
    length: ['l', 'length', 'длина', 'l_мм', 'длинна'],
    qty: ['qty', 'quantity', 'количество', 'кол-во', 'шт'],
    weight: ['weight', 'вес', 'масса', 'кг'],
  };

  // Universal parsing method - extracts ALL data
  async parseUniversal(buffer: Buffer): Promise<UniversalItem[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    
    const allItems: UniversalItem[] = [];
    
    // Process all worksheets
    for (const worksheet of workbook.worksheets) {
      const items = await this.parseWorksheet(worksheet);
      allItems.push(...items);
    }
    
    return allItems;
  }

  // Legacy method for backward compatibility
  async parse(buffer: Buffer): Promise<DuctItem[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheets found in Excel file');
    }

    const rows = worksheet.getRows(1, worksheet.rowCount);
    if (!rows || rows.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }

    const headerRow = rows[0];
    const columnMap = this.mapColumns(headerRow.values as string[]);
    
    const items: DuctItem[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const item = this.parseRow(row.values as any[], columnMap);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private async parseWorksheet(worksheet: ExcelJS.Worksheet): Promise<UniversalItem[]> {
    const items: UniversalItem[] = [];
    
    if (!worksheet || worksheet.rowCount < 2) {
      return items;
    }

    const rows = worksheet.getRows(1, worksheet.rowCount);
    if (!rows || rows.length < 2) {
      return items;
    }

    // Try to find header row
    let headerRowIndex = 0;
    let columnMap: Record<string, number> = {};
    
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      
      const headers = row.values as string[];
      const map = this.mapColumnsUniversal(headers);
      
      if (Object.keys(map).length >= 2) {
        headerRowIndex = i;
        columnMap = map;
        break;
      }
    }

    // Parse data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const values = row.values as any[];
      const item = this.parseRowUniversal(values, columnMap);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private mapColumnsUniversal(headers: string[]): Record<string, number> {
    const columnMap: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      if (!header) return;
      
      const normalizedHeader = header.toString().toLowerCase().trim();
      
      // Check all possible column mappings
      const allMappings = {
        // Basic identifiers
        id: ['id', 'код', 'артикул', 'номер', 'код_товара', 'article', 'part_number'],
        name: ['name', 'название', 'наименование', 'описание', 'description', 'title'],
        type: ['type', 'тип', 'вид', 'форма', 'category', 'категория'],
        
        // Dimensions
        width: ['w', 'width', 'ширина', 'w_мм', 'breite', 'largeur'],
        height: ['h', 'height', 'высота', 'h_мм', 'höhe', 'hauteur'],
        depth: ['d', 'depth', 'глубина', 'd_мм', 'tiefe', 'profondeur'],
        length: ['l', 'length', 'длина', 'l_мм', 'длинна', 'länge', 'longueur'],
        diameter: ['diameter', 'диаметр', 'd_мм', 'durchmesser', 'diamètre'],
        thickness: ['thickness', 'толщина', 't_мм', 'dicke', 'épaisseur'],
        radius: ['radius', 'радиус', 'r_мм', 'rayon'],
        
        // Quantities and weights
        qty: ['qty', 'quantity', 'количество', 'кол-во', 'шт', 'amount', 'anzahl', 'quantité'],
        weight: ['weight', 'вес', 'масса', 'кг', 'gewicht', 'poids'],
        
        // Materials and properties
        material: ['material', 'материал', 'вещество', 'stoff', 'matériau'],
        color: ['color', 'цвет', 'краска', 'farbe', 'couleur'],
        notes: ['notes', 'примечания', 'комментарии', 'bemerkungen', 'commentaires'],
      };
      
      for (const [field, variations] of Object.entries(allMappings)) {
        if (variations.some(variation => normalizedHeader.includes(variation))) {
          columnMap[field] = index;
          break;
        }
      }
    });

    return columnMap;
  }

  private parseRowUniversal(values: any[], columnMap: Record<string, number>): UniversalItem | null {
    try {
      const item: UniversalItem = {
        id: this.getCellValue(values, columnMap.id) || `item_${Date.now()}_${Math.random()}`,
        dimensions: {},
        qty: this.parseNumber(this.getCellValue(values, columnMap.qty)) || 1,
      };

      // Add optional fields
      if (columnMap.name) item.name = this.getCellValue(values, columnMap.name);
      if (columnMap.type) item.type = this.getCellValue(values, columnMap.type);
      if (columnMap.material) item.material = this.getCellValue(values, columnMap.material);
      if (columnMap.notes) item.notes = this.getCellValue(values, columnMap.notes);
      if (columnMap.weight) item.weightKg = this.parseNumber(this.getCellValue(values, columnMap.weight));

      // Add dimensions
      if (columnMap.width) item.dimensions.width = this.parseNumber(this.getCellValue(values, columnMap.width));
      if (columnMap.height) item.dimensions.height = this.parseNumber(this.getCellValue(values, columnMap.height));
      if (columnMap.depth) item.dimensions.depth = this.parseNumber(this.getCellValue(values, columnMap.depth));
      if (columnMap.length) item.dimensions.length = this.parseNumber(this.getCellValue(values, columnMap.length));
      if (columnMap.diameter) item.dimensions.diameter = this.parseNumber(this.getCellValue(values, columnMap.diameter));
      if (columnMap.thickness) item.dimensions.thickness = this.parseNumber(this.getCellValue(values, columnMap.thickness));
      if (columnMap.radius) item.dimensions.radius = this.parseNumber(this.getCellValue(values, columnMap.radius));

      // Validate that we have at least some useful data
      const hasDimensions = Object.values(item.dimensions).some(dim => dim && dim > 0);
      const hasBasicInfo = item.id || item.name || item.type;
      
      if (!hasDimensions && !hasBasicInfo) {
        return null;
      }

      return item;
    } catch (error) {
      return null;
    }
  }

  private mapColumns(headers: string[]): Record<string, number> {
    const columnMap: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      if (!header) return;
      
      const normalizedHeader = header.toString().toLowerCase().trim();
      
      for (const [field, variations] of Object.entries(this.columnMappings)) {
        if (variations.some(variation => normalizedHeader.includes(variation))) {
          columnMap[field] = index;
          break;
        }
      }
    });

    return columnMap;
  }

  private parseRow(values: any[], columnMap: Record<string, number>): DuctItem | null {
    try {
      const id = this.getCellValue(values, columnMap.id) || `item_${Date.now()}_${Math.random()}`;
      const typeStr = this.getCellValue(values, columnMap.type)?.toString().toLowerCase();
      const type = typeStr?.includes('round') || typeStr?.includes('круг') ? 'round' : 'rect';
      
      const qty = this.parseNumber(this.getCellValue(values, columnMap.qty)) || 1;
      const length = this.parseNumber(this.getCellValue(values, columnMap.length)) || undefined;
      const weight = this.parseNumber(this.getCellValue(values, columnMap.weight)) || undefined;

      if (length === undefined || length <= 0) {
        console.warn(`Invalid length for item ${id}: ${length}`);
        return null;
      }

      const item: DuctItem = {
        id: id.toString(),
        type,
        length,
        qty,
        weightKg: weight,
      };

      if (type === 'rect') {
        const width = this.parseNumber(this.getCellValue(values, columnMap.width));
        const height = this.parseNumber(this.getCellValue(values, columnMap.height));
        
        if (width && width > 0) item.w = width;
        if (height && height > 0) item.h = height;
      } else {
        const diameter = this.parseNumber(this.getCellValue(values, columnMap.diameter));
        if (diameter && diameter > 0) item.d = diameter;
      }

      return item;
    } catch (error) {
      console.error('Error parsing row:', error);
      return null;
    }
  }

  private getCellValue(values: any[], columnIndex: number | undefined): any {
    if (columnIndex === undefined || !values || columnIndex >= values.length) {
      return null;
    }
    return values[columnIndex];
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(',', '.'));
    return isNaN(num) ? null : num;
  }
}
