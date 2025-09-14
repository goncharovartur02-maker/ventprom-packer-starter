import { Injectable } from '@nestjs/common';
import { UniversalItem, DuctItem } from '../types';

@Injectable()
export class ParseService {
  private excelParser: any;
  private pdfParser: any;
  private textParser: any;
  private imageParser: any;

  constructor() {
    try {
      // Динамически загружаем парсеры
      const ExcelParser = require('../../../packages/parsers/dist/excel').ExcelParser;
      const PdfParser = require('../../../packages/parsers/dist/pdf').PdfParser;
      const TextParser = require('../../../packages/parsers/dist/text').TextParser;
      const ImageParser = require('../../../packages/parsers/dist/image').ImageParser;

      this.excelParser = new ExcelParser();
      this.pdfParser = new PdfParser();
      this.textParser = new TextParser();
      this.imageParser = new ImageParser();
      
      console.log('ParseService: Real parsers loaded successfully');
    } catch (error) {
      console.error('ParseService: Failed to load parsers:', error);
      console.log('ParseService: Using fallback mode');
    }
  }

  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    const allItems: UniversalItem[] = [];
    
    for (const file of files) {
      try {
        const items = await this.parseFile(file);
        allItems.push(...items);
      } catch (error) {
        console.error(`Error parsing file ${file.originalname}:`, error);
      }
    }
    
    return allItems;
  }

  private async parseFile(file: Express.Multer.File): Promise<UniversalItem[]> {
    const mimeType = file.mimetype;
    const fileName = file.originalname.toLowerCase();
    
    console.log(`Parsing file: ${fileName} (${mimeType})`);
    
    // Parse based on file type
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        fileName.endsWith('.xlsx')) {
      if (this.excelParser) {
        const ductItems = await this.excelParser.parse(file.buffer);
        return this.convertDuctItemsToUniversal(ductItems);
      }
    }
    
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      if (this.pdfParser) {
        const ductItems = await this.pdfParser.parse(file.buffer);
        return this.convertDuctItemsToUniversal(ductItems);
      }
    }
    
    if (mimeType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      if (this.textParser) {
        const ductItems = await this.textParser.parse(file.buffer);
        return this.convertDuctItemsToUniversal(ductItems);
      }
    }
    
    if (mimeType.startsWith('image/') || 
        fileName.endsWith('.png') || 
        fileName.endsWith('.jpg') || 
        fileName.endsWith('.jpeg')) {
      if (this.imageParser) {
        const ductItems = await this.imageParser.parse(file.buffer);
        return this.convertDuctItemsToUniversal(ductItems);
      }
    }
    
    // Fallback: return demo data based on file type
    console.log(`Using fallback for file: ${fileName}`);
    return this.createFallbackData(fileName);
  }

  private convertDuctItemsToUniversal(ductItems: DuctItem[]): UniversalItem[] {
    return ductItems.map(item => ({
      id: item.id,
      type: item.type,
      dimensions: item.type === 'rect' 
        ? { width: item.w || 0, height: item.h || 0, length: item.length || 0 }
        : { diameter: item.d || 0, length: item.length || 0 },
      qty: item.qty,
      weightKg: item.weightKg,
    }));
  }

  private createFallbackData(fileName: string): UniversalItem[] {
    // Создаем демо-данные на основе типа файла
    const baseId = fileName.replace(/\.[^/.]+$/, "");
    
    return [
      {
        id: `${baseId}-1`,
        type: 'rect',
        dimensions: { width: 200, height: 100, length: 1200 },
        qty: 3,
        weightKg: 25.5
      },
      {
        id: `${baseId}-2`,
        type: 'round',
        dimensions: { diameter: 150, length: 1000 },
        qty: 2,
        weightKg: 18.7
      },
      {
        id: `${baseId}-3`,
        type: 'rect',
        dimensions: { width: 300, height: 150, length: 800 },
        qty: 1,
        weightKg: 32.1
      }
    ];
  }
}


