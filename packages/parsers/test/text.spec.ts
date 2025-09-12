import { TextParser } from '../src/text';
import { DuctItem } from '@ventprom/core';

describe('TextParser', () => {
  let parser: TextParser;

  beforeEach(() => {
    parser = new TextParser();
  });

  it('should parse semicolon-delimited CSV', async () => {
    const content = `ID;TYPE;W;H;L;QTY;WEIGHT
R1;rect;500;300;1000;10;12.3
R2;rect;400;200;800;5;8.1`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should parse comma-delimited CSV', async () => {
    const content = `ID,TYPE,W,H,L,QTY,WEIGHT
R1,rect,500,300,1000,10,12.3`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should parse tab-delimited file', async () => {
    const content = `ID	TYPE	W	H	L	QTY	WEIGHT
R1	rect	500	300	1000	10	12.3`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should parse round items', async () => {
    const content = `ID;TYPE;D;L;QTY
C1;round;200;1000;3
C2;round;150;800;2`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'C1',
      type: 'round',
      d: 200,
      length: 1000,
      qty: 3,
      weightKg: undefined,
    });
  });

  it('should handle Russian headers', async () => {
    const content = `Код;Тип;Ширина;Высота;Длина;Количество;Вес
R1;rect;500;300;1000;10;12.3`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should handle decimal numbers with comma', async () => {
    const content = `ID;TYPE;W;H;L;QTY;WEIGHT
R1;rect;500,5;300,2;1000;10;12,3`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500.5,
      h: 300.2,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should skip rows with invalid data', async () => {
    const content = `ID;TYPE;W;H;L;QTY;WEIGHT
R1;rect;500;300;1000;10;12.3
R2;rect;400;200;0;5;8.1
R3;rect;600;400;800;2;9.5`;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2); // R2 should be skipped due to invalid length
    expect(items.map(item => item.id)).toEqual(['R1', 'R3']);
  });

  it('should throw error for empty file', async () => {
    const buffer = Buffer.from('', 'utf-8');
    await expect(parser.parse(buffer)).rejects.toThrow('Text file must have at least a header line and one data line');
  });

  it('should throw error for file with only header', async () => {
    const buffer = Buffer.from('ID;TYPE;W;H;L;QTY;WEIGHT', 'utf-8');
    await expect(parser.parse(buffer)).rejects.toThrow('Text file must have at least a header line and one data line');
  });

  it('should handle extra whitespace', async () => {
    const content = `  ID  ;  TYPE  ;  W  ;  H  ;  L  ;  QTY  ;  WEIGHT  
  R1  ;  rect  ;  500  ;  300  ;  1000  ;  10  ;  12.3  `;

    const buffer = Buffer.from(content, 'utf-8');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });
});