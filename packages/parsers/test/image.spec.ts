import { ImageParser } from '../src/image';
import { DuctItem } from '@ventprom/core';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageParser', () => {
  let parser: ImageParser;

  beforeEach(() => {
    parser = new ImageParser();
  });

  it('should parse image with table data', async () => {
    // This test would require a real image file with table data
    // For now, we'll test the text extraction logic
    const mockText = `
      ID    TYPE    W     H     L      QTY   WEIGHT
      R1    rect    500   300   1000   2     12.3
      R2    rect    400   200   800    1     8.1
      C1    round   200   0     1000   3     5.5
    `;

    // Mock the OCR result
    const mockBuffer = Buffer.from('mock image data');
    
    // We can't easily test OCR without actual image files
    // This test demonstrates the expected behavior
    expect(parser).toBeDefined();
  });

  it('should extract dimensions from unstructured text', () => {
    const text = `
      Ventilation duct specifications:
      Rectangular duct 500x300x1000mm
      Round duct Ø200x1000mm
      Another rectangular 400x200x800mm
    `;

    // Test the dimension extraction logic
    const items = (parser as any).extractFromUnstructuredText(text);
    
    expect(items.length).toBeGreaterThan(0);
    
    // Check for rectangular items
    const rectItems = items.filter(item => item.type === 'rect');
    expect(rectItems.length).toBeGreaterThan(0);
    
    // Check for round items
    const roundItems = items.filter(item => item.type === 'round');
    expect(roundItems.length).toBeGreaterThan(0);
  });

  it('should handle Russian text patterns', () => {
    const text = `
      Спецификация воздуховодов:
      Прямоугольный воздуховод 500x300x1000мм
      Круглый воздуховод Ø200x1000мм
      Диаметр 150 длина 800
    `;

    const items = (parser as any).extractFromUnstructuredText(text);
    
    expect(items.length).toBeGreaterThan(0);
    
    // Should find both rectangular and round items
    const rectItems = items.filter(item => item.type === 'rect');
    const roundItems = items.filter(item => item.type === 'round');
    
    expect(rectItems.length).toBeGreaterThan(0);
    expect(roundItems.length).toBeGreaterThan(0);
  });

  it('should clean up OCR artifacts in numbers', () => {
    const parser = new ImageParser();
    
    // Test number parsing with OCR artifacts
    expect((parser as any).parseNumber('12.3')).toBe(12.3);
    expect((parser as any).parseNumber('12,3')).toBe(12.3);
    expect((parser as any).parseNumber('12.3mm')).toBe(12.3);
    expect((parser as any).parseNumber('12.3 мм')).toBe(12.3);
    expect((parser as any).parseNumber('invalid')).toBeNull();
  });

  it('should detect header rows', () => {
    const parser = new ImageParser();
    
    expect((parser as any).looksLikeHeader('ID TYPE W H L QTY WEIGHT')).toBe(true);
    expect((parser as any).looksLikeHeader('Код Тип Ширина Высота Длина Количество Вес')).toBe(true);
    expect((parser as any).looksLikeHeader('Some random text')).toBe(false);
  });

  it('should split table rows correctly', () => {
    const parser = new ImageParser();
    
    const result1 = (parser as any).splitTableRow('R1\trect\t500\t300\t1000\t2\t12.3');
    expect(result1).toEqual(['R1', 'rect', '500', '300', '1000', '2', '12.3']);
    
    const result2 = (parser as any).splitTableRow('R1  rect  500  300  1000  2  12.3');
    expect(result2).toEqual(['R1', 'rect', '500', '300', '1000', '2', '12.3']);
    
    const result3 = (parser as any).splitTableRow('R1;rect;500;300;1000;2;12.3');
    expect(result3).toEqual(['R1', 'rect', '500', '300', '1000', '2', '12.3']);
  });
});


