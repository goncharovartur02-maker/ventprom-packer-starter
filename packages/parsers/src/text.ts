import { DuctItem } from '../../core/src';

export class TextParser {
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
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      throw new Error('Text file must have at least a header line and one data line');
    }

    const headerLine = lines[0];
    const delimiter = this.detectDelimiter(headerLine);
    const columnMap = this.mapColumns(headerLine.split(delimiter));
    
    const items: DuctItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter);
      const item = this.parseRow(values, columnMap);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private detectDelimiter(line: string): string {
    const delimiters = [';', ',', '\t', '|'];
    let bestDelimiter = ';';
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp('\\' + delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
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

  private parseRow(values: string[], columnMap: Record<string, number>): DuctItem | null {
    try {
      const id = this.getCellValue(values, columnMap.id) || `item_${Date.now()}_${Math.random()}`;
      const typeStr = this.getCellValue(values, columnMap.type)?.toString().toLowerCase();
      const type = typeStr?.includes('round') || typeStr?.includes('круг') ? 'round' : 'rect';
      
      const qty = this.parseNumber(this.getCellValue(values, columnMap.qty)) || 1;
      const length = this.parseNumber(this.getCellValue(values, columnMap.length));
      const weight = this.parseNumber(this.getCellValue(values, columnMap.weight));

      if (!length || length <= 0) {
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

  private getCellValue(values: string[], columnIndex: number | undefined): string | null {
    if (columnIndex === undefined || !values || columnIndex >= values.length) {
      return null;
    }
    return values[columnIndex]?.trim() || null;
  }

  private parseNumber(value: string | null): number | null {
    if (value === null || value === undefined) return null;
    
    const num = parseFloat(value.toString().replace(',', '.'));
    return isNaN(num) ? null : num;
  }
}
