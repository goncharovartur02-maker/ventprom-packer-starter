import { DuctItem } from '@ventprom/core';
import * as Tesseract from 'tesseract.js';

export class ImageParser {
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

  async parse(buffer: Buffer): Promise<DuctItem[]> {
    try {
      // Use Tesseract.js for OCR
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng+rus', {
        logger: m => console.log(m) // Optional: for debugging
      });

      console.log('OCR extracted text:', text);

      // Try to extract table data from OCR text
      const tableItems = this.extractTableData(text);
      
      if (tableItems.length > 0) {
        return tableItems;
      }

      // Fallback: try to extract dimensions from unstructured text
      return this.extractFromUnstructuredText(text);
    } catch (error: any) {
      console.error('OCR parsing failed:', error);
      throw new Error(`Failed to parse image: ${error.message}`);
    }
  }

  private extractTableData(text: string): DuctItem[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: DuctItem[] = [];
    
    // Look for table-like patterns
    let headerFound = false;
    let columnMap: Record<string, number> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try to detect header row
      if (!headerFound && this.looksLikeHeader(line)) {
        const columns = this.splitTableRow(line);
        columnMap = this.mapColumns(columns);
        headerFound = true;
        continue;
      }
      
      // If we have a header, try to parse data rows
      if (headerFound && Object.keys(columnMap).length > 0) {
        const columns = this.splitTableRow(line);
        if (columns.length >= 3) { // Minimum columns for a valid row
          const item = this.parseRow(columns, columnMap);
          if (item) {
            items.push(item);
          }
        }
      }
    }
    
    return items;
  }

  private extractFromUnstructuredText(text: string): DuctItem[] {
    const items: DuctItem[] = [];
    
    // Look for dimension patterns like "500x300x1000" or "Ø200x1000"
    const dimensionPatterns = [
      // Rectangular: 500x300x1000, 500*300*1000, 500×300×1000
      /(\d+)\s*[x*×]\s*(\d+)\s*[x*×]\s*(\d+)/gi,
      // Round: Ø200x1000, D200x1000, диаметр 200 длина 1000
      /(?:Ø|D|диаметр)\s*(\d+)\s*[x*×]\s*(\d+)/gi,
      /диаметр\s*(\d+).*?длина\s*(\d+)/gi,
      // More flexible patterns for OCR
      /(\d+)\s*[x*×]\s*(\d+)\s*[x*×]\s*(\d+)\s*мм/gi,
      /Ø\s*(\d+)\s*[x*×]\s*(\d+)\s*мм/gi,
    ];
    
    let itemId = 1;
    
    for (const pattern of dimensionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          if (pattern === dimensionPatterns[0] || pattern === dimensionPatterns[3]) {
            // Rectangular item
            const width = parseInt(match[1]);
            const height = parseInt(match[2]);
            const length = parseInt(match[3]);
            
            if (width > 0 && height > 0 && length > 0) {
              items.push({
                id: `rect_${itemId++}`,
                type: 'rect',
                w: width,
                h: height,
                length,
                qty: 1,
              });
            }
          } else {
            // Round item
            const diameter = parseInt(match[1]);
            const length = parseInt(match[2]);
            
            if (diameter > 0 && length > 0) {
              items.push({
                id: `round_${itemId++}`,
                type: 'round',
                d: diameter,
                length,
                qty: 1,
              });
            }
          }
        } catch (error) {
          console.warn('Error parsing dimension from OCR text:', error);
        }
      }
    }
    
    return items;
  }

  private looksLikeHeader(line: string): boolean {
    const headerKeywords = [
      'id', 'код', 'артикул', 'номер',
      'type', 'тип', 'вид', 'форма',
      'width', 'ширина', 'w', 'высота', 'height', 'h',
      'diameter', 'диаметр', 'd',
      'length', 'длина', 'l',
      'qty', 'количество', 'кол-во', 'шт',
      'weight', 'вес', 'масса', 'кг'
    ];
    
    const lowerLine = line.toLowerCase();
    const keywordCount = headerKeywords.filter(keyword => lowerLine.includes(keyword)).length;
    
    return keywordCount >= 3; // At least 3 header keywords
  }

  private splitTableRow(line: string): string[] {
    // Try different delimiters
    const delimiters = ['\t', '  ', ';', ',', '|'];
    
    for (const delimiter of delimiters) {
      const parts = line.split(delimiter).map(part => part.trim()).filter(part => part.length > 0);
      if (parts.length >= 3) {
        return parts;
      }
    }
    
    // Fallback: split by multiple spaces
    return line.split(/\s{2,}/).map(part => part.trim()).filter(part => part.length > 0);
  }

  private mapColumns(columns: string[]): Record<string, number> {
    const columnMap: Record<string, number> = {};
    
    columns.forEach((column, index) => {
      const normalizedColumn = column.toLowerCase().trim();
      
      for (const [field, variations] of Object.entries(this.columnMappings)) {
        if (variations.some(variation => normalizedColumn.includes(variation))) {
          columnMap[field] = index;
          break;
        }
      }
    });

    return columnMap;
  }

  private parseRow(columns: string[], columnMap: Record<string, number>): DuctItem | null {
    try {
      const id = this.getCellValue(columns, columnMap.id) || `item_${Date.now()}_${Math.random()}`;
      const typeStr = this.getCellValue(columns, columnMap.type)?.toString().toLowerCase();
      const type = typeStr?.includes('round') || typeStr?.includes('круг') ? 'round' : 'rect';
      
      const qty = this.parseNumber(this.getCellValue(columns, columnMap.qty)) || 1;
      const length = this.parseNumber(this.getCellValue(columns, columnMap.length));
      const weight = this.parseNumber(this.getCellValue(columns, columnMap.weight));

      if (!length || length <= 0) {
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
        const width = this.parseNumber(this.getCellValue(columns, columnMap.width));
        const height = this.parseNumber(this.getCellValue(columns, columnMap.height));
        
        if (width && width > 0) item.w = width;
        if (height && height > 0) item.h = height;
      } else {
        const diameter = this.parseNumber(this.getCellValue(columns, columnMap.diameter));
        if (diameter && diameter > 0) item.d = diameter;
      }

      return item;
    } catch (error) {
      return null;
    }
  }

  private getCellValue(columns: string[], columnIndex: number | undefined): string | null {
    if (columnIndex === undefined || !columns || columnIndex >= columns.length) {
      return null;
    }
    return columns[columnIndex]?.trim() || null;
  }

  private parseNumber(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    
    // Clean up OCR artifacts
    const cleaned = value.toString()
      .replace(/[^\d.,]/g, '') // Remove non-numeric characters except comma and dot
      .replace(',', '.'); // Replace comma with dot for decimal
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
}

