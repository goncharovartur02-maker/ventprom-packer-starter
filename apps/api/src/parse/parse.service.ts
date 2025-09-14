import { Injectable } from '@nestjs/common';
import { DuctItem, UniversalItem } from '../../../../packages/core/src';
// Import parsers directly
const { PdfParser, ExcelParser, TextParser, ImageParser } = require('../../../../packages/parsers/dist/simple');

@Injectable()
export class ParseService {
  private excelParser: any;
  private pdfParser: any;
  private textParser: any;
  private imageParser: any;

  constructor() {
    try {
      this.excelParser = new ExcelParser();
      this.pdfParser = new PdfParser();
      this.textParser = new TextParser();
      this.imageParser = new ImageParser();
    } catch (error) {
      console.error('ParseService: Error initializing parsers:', error);
    }
  }

  // Universal parsing method - extracts ALL data from files
  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    const allItems: UniversalItem[] = [];

    for (const file of files) {
      let items: UniversalItem[] = [];

      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        if (this.excelParser) {
          items = await this.excelParser.parseUniversal(file.buffer);
        } else {
          throw new Error('Excel parser not available');
        }
      } else if (file.mimetype === 'application/pdf') {
        if (this.pdfParser) {
          try {
            console.log('ParseService: Processing PDF file:', file.originalname);
            const ductItems = await this.pdfParser.parse(file.buffer);
            console.log('ParseService: PDF parsed successfully, found', ductItems.length, 'items');
            items = ductItems.map(item => this.convertDuctItemToUniversal(item));
          } catch (error) {
            console.error('ParseService: PDF parsing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`PDF parsing failed: ${errorMessage}`);
          }
        } else {
          throw new Error('PDF parser not available');
        }
      } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
        if (this.textParser) {
          items = await this.textParser.parse(file.buffer).then(ductItems => 
            ductItems.map(item => this.convertDuctItemToUniversal(item))
          );
        } else {
          throw new Error('Text parser not available');
        }
      } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        if (this.imageParser) {
          items = await this.imageParser.parse(file.buffer).then(ductItems => 
            ductItems.map(item => this.convertDuctItemToUniversal(item))
          );
        } else {
          throw new Error('Image parser not available');
        }
      }

      allItems.push(...items);
    }

    return allItems;
  }

  // Legacy method for backward compatibility
  async parseFiles(files: Express.Multer.File[]): Promise<DuctItem[]> {
    const allItems: DuctItem[] = [];

    for (const file of files) {
      let items: DuctItem[] = [];

      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        items = await this.excelParser.parse(file.buffer);
      } else if (file.mimetype === 'application/pdf') {
        items = await this.pdfParser.parse(file.buffer);
      } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
        items = await this.textParser.parse(file.buffer);
      } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        items = await this.imageParser.parse(file.buffer);
      }

      allItems.push(...items);
    }

    return allItems;
  }

  // Convert DuctItem to UniversalItem for backward compatibility
  private convertDuctItemToUniversal(ductItem: DuctItem): UniversalItem {
    const dimensions: { [key: string]: number } = {};
    
    if (ductItem.w) dimensions.width = ductItem.w;
    if (ductItem.h) dimensions.height = ductItem.h;
    if (ductItem.d) dimensions.diameter = ductItem.d;
    if (ductItem.length) dimensions.length = ductItem.length;

    return {
      id: ductItem.id,
      type: ductItem.type,
      dimensions,
      qty: ductItem.qty,
      weightKg: ductItem.weightKg,
    };
  }
}


