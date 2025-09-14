import { UniversalItem, DuctItem } from '@ventprom/core';

export class UniversalParser {
  private columnMappings = {
    // Basic identifiers
    id: ['id', 'код', 'артикул', 'номер', 'код_товара', 'article', 'part_number'],
    name: ['name', 'название', 'наименование', 'описание', 'description', 'title'],
    type: ['type', 'тип', 'вид', 'форма', 'category', 'категория'],
    
    // Dimensions - comprehensive mapping
    width: ['w', 'width', 'ширина', 'w_мм', 'breite', 'largeur'],
    height: ['h', 'height', 'высота', 'h_мм', 'höhe', 'hauteur'],
    depth: ['d', 'depth', 'глубина', 'd_мм', 'tiefe', 'profondeur'],
    length: ['l', 'length', 'длина', 'l_мм', 'длинна', 'länge', 'longueur'],
    diameter: ['diameter', 'диаметр', 'd_мм', 'durchmesser', 'diamètre'],
    
    // Additional dimensions
    thickness: ['thickness', 'толщина', 't_мм', 'dicke', 'épaisseur'],
    radius: ['radius', 'радиус', 'r_мм', 'rayon'],
    perimeter: ['perimeter', 'периметр', 'p_мм', 'umfang', 'périmètre'],
    
    // Quantities and weights
    qty: ['qty', 'quantity', 'количество', 'кол-во', 'шт', 'amount', 'anzahl', 'quantité'],
    weight: ['weight', 'вес', 'масса', 'кг', 'gewicht', 'poids'],
    
    // Materials and properties
    material: ['material', 'материал', 'вещество', 'stoff', 'matériau'],
    color: ['color', 'цвет', 'краска', 'farbe', 'couleur'],
    finish: ['finish', 'отделка', 'покрытие', 'oberfläche', 'finition'],
    
    // Additional properties
    notes: ['notes', 'примечания', 'комментарии', 'bemerkungen', 'commentaires'],
    supplier: ['supplier', 'поставщик', 'lieferant', 'fournisseur'],
    price: ['price', 'цена', 'стоимость', 'preis', 'prix'],
  };

  async parseUniversal(buffer: Buffer, fileType: string): Promise<UniversalItem[]> {
    let text = '';
    
    // Extract text based on file type
    switch (fileType) {
      case 'excel':
        text = await this.extractFromExcel(buffer);
        break;
      case 'pdf':
        text = await this.extractFromPdf(buffer);
        break;
      case 'text':
        text = buffer.toString('utf-8');
        break;
      case 'image':
        text = await this.extractFromImage(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Parse the extracted text
    return this.parseText(text);
  }

  private async extractFromExcel(buffer: Buffer): Promise<string> {
    // This would use ExcelJS to extract all text content
    // For now, return a placeholder
    return 'Excel content extraction not implemented yet';
  }

  private async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      return 'PDF content extraction failed';
    }
  }

  private async extractFromImage(buffer: Buffer): Promise<string> {
    try {
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(buffer, 'rus+eng', {
        logger: m => console.log(m)
      });
      return text;
    } catch (error) {
      console.error('Image OCR failed:', error);
      return 'Image content extraction failed';
    }
  }

  private parseText(text: string): UniversalItem[] {
    const items: UniversalItem[] = [];
    
    // Try to extract structured data first
    const structuredItems = this.extractStructuredData(text);
    if (structuredItems.length > 0) {
      return structuredItems;
    }
    
    // Fallback: extract from unstructured text
    return this.extractUnstructuredData(text);
  }

  private extractStructuredData(text: string): UniversalItem[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: UniversalItem[] = [];
    
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
        if (columns.length >= 2) { // Minimum columns for a valid row
          const item = this.parseRow(columns, columnMap);
          if (item) {
            items.push(item);
          }
        }
      }
    }
    
    return items;
  }

  private extractUnstructuredData(text: string): UniversalItem[] {
    const items: UniversalItem[] = [];
    
    // Extract all dimension patterns
    const dimensionPatterns = [
      // Various dimension formats
      /(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)/gi,
      /(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)/gi,
      /Ø\s*(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)/gi,
      /диаметр\s*(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)/gi,
      /(\d+(?:\.\d+)?)\s*мм\s*[x*×]\s*(\d+(?:\.\d+)?)\s*мм\s*[x*×]\s*(\d+(?:\.\d+)?)\s*мм/gi,
    ];
    
    let itemId = 1;
    
    for (const pattern of dimensionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          const item = this.createItemFromDimensions(match, itemId++);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          console.warn('Error parsing dimension from text:', error);
        }
      }
    }
    
    return items;
  }

  private createItemFromDimensions(match: RegExpExecArray, itemId: number): UniversalItem | null {
    const dimensions: { [key: string]: number } = {};
    
    if (match.length === 4) {
      // Three dimensions: width x height x length
      dimensions.width = parseFloat(match[1]);
      dimensions.height = parseFloat(match[2]);
      dimensions.length = parseFloat(match[3]);
    } else if (match.length === 3) {
      // Two dimensions: could be diameter x length or width x height
      const dim1 = parseFloat(match[1]);
      const dim2 = parseFloat(match[2]);
      
      // Try to determine if it's a round item (diameter) or rectangular
      if (match[0].includes('Ø') || match[0].includes('диаметр')) {
        dimensions.diameter = dim1;
        dimensions.length = dim2;
      } else {
        dimensions.width = dim1;
        dimensions.height = dim2;
      }
    }
    
    // Validate dimensions
    const validDimensions = Object.values(dimensions).every(dim => dim > 0);
    if (!validDimensions) {
      return null;
    }
    
    return {
      id: `item_${itemId}`,
      dimensions,
      qty: 1,
      type: dimensions.diameter ? 'round' : 'rectangular',
    };
  }

  private looksLikeHeader(line: string): boolean {
    const headerKeywords = Object.values(this.columnMappings).flat();
    const lowerLine = line.toLowerCase();
    const keywordCount = headerKeywords.filter(keyword => lowerLine.includes(keyword)).length;
    
    return keywordCount >= 2; // At least 2 header keywords
  }

  private splitTableRow(line: string): string[] {
    // Try different delimiters
    const delimiters = ['\t', '  ', ';', ',', '|'];
    
    for (const delimiter of delimiters) {
      const parts = line.split(delimiter).map(part => part.trim()).filter(part => part.length > 0);
      if (parts.length >= 2) {
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

  private parseRow(columns: string[], columnMap: Record<string, number>): UniversalItem | null {
    try {
      const item: UniversalItem = {
        id: this.getCellValue(columns, columnMap.id) || `item_${Date.now()}_${Math.random()}`,
        dimensions: {},
        qty: this.parseNumber(this.getCellValue(columns, columnMap.qty)) || 1,
      };

      // Add optional fields
      if (columnMap.name) item.name = this.getCellValue(columns, columnMap.name) || undefined;
      if (columnMap.type) item.type = this.getCellValue(columns, columnMap.type) || undefined;
      if (columnMap.material) item.material = this.getCellValue(columns, columnMap.material) || undefined;
      if (columnMap.notes) item.notes = this.getCellValue(columns, columnMap.notes) || undefined;
      if (columnMap.weight) item.weightKg = this.parseNumber(this.getCellValue(columns, columnMap.weight)) || undefined;

      // Add dimensions
      if (columnMap.width) item.dimensions.width = this.parseNumber(this.getCellValue(columns, columnMap.width)) || undefined;
      if (columnMap.height) item.dimensions.height = this.parseNumber(this.getCellValue(columns, columnMap.height)) || undefined;
      if (columnMap.depth) item.dimensions.depth = this.parseNumber(this.getCellValue(columns, columnMap.depth)) || undefined;
      if (columnMap.length) item.dimensions.length = this.parseNumber(this.getCellValue(columns, columnMap.length)) || undefined;
      if (columnMap.diameter) item.dimensions.diameter = this.parseNumber(this.getCellValue(columns, columnMap.diameter)) || undefined;
      if (columnMap.thickness) item.dimensions.thickness = this.parseNumber(this.getCellValue(columns, columnMap.thickness)) || undefined;
      if (columnMap.radius) item.dimensions.radius = this.parseNumber(this.getCellValue(columns, columnMap.radius)) || undefined;

      // Validate that we have at least some useful data
      const hasDimensions = Object.values(item.dimensions).some(dim => typeof dim === 'number' && dim > 0);
      if (!hasDimensions) {
        return null;
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
    
    const cleaned = value.toString()
      .replace(/[^\d.,]/g, '') // Remove non-numeric characters except comma and dot
      .replace(',', '.'); // Replace comma with dot for decimal
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  // Convert UniversalItem to DuctItem for backward compatibility
  convertToDuctItem(universalItem: UniversalItem): DuctItem | null {
    const { dimensions } = universalItem;
    
    // Determine if it's rectangular or round
    if (dimensions.diameter) {
      return {
        id: universalItem.id,
        type: 'round',
        d: dimensions.diameter,
        length: dimensions.length || 0,
        qty: universalItem.qty,
        weightKg: universalItem.weightKg,
      };
    } else if (dimensions.width && dimensions.height) {
      return {
        id: universalItem.id,
        type: 'rect',
        w: dimensions.width,
        h: dimensions.height,
        length: dimensions.length || 0,
        qty: universalItem.qty,
        weightKg: universalItem.weightKg,
      };
    }
    
    return null;
  }
}

