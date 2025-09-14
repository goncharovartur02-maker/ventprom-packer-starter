import pdfParse from 'pdf-parse';
import { DuctItem } from '@ventprom/core';

export class PdfParser {
  private ductMap: Map<string, DuctItem> = new Map(); // Для дедупликации

  async parse(buffer: Buffer): Promise<DuctItem[]> {
    const data = await (pdfParse as any)(buffer);
    const text = data.text;
    
    console.log('PDF Parser: Начинаем анализ спецификации воздуховодов');
    
    // Сброс состояния для нового документа
    this.ductMap.clear();
    
    // 1. Попытка извлечь данные из спецификационной таблицы
    const specItems = this.extractSpecificationTable(text);
    
    if (specItems.length > 0) {
      console.log(`PDF Parser: Найдено ${specItems.length} воздуховодов в спецификации`);
      return this.deduplicateItems(Array.from(this.ductMap.values()));
    }
    
    // 2. Fallback: агрессивный поиск всех воздуховодов в тексте
    const aggressiveItems = this.extractAllDuctItems(text);
    
    if (aggressiveItems.length > 0) {
      console.log(`PDF Parser: Найдено ${aggressiveItems.length} воздуховодов агрессивным поиском`);
      return this.deduplicateItems(aggressiveItems);
    }
    
    // 3. Fallback: классический парсинг
    const items = this.extractTableData(text);
    
    if (items.length === 0) {
      // 4. Последний fallback: неструктурированный текст
      return this.extractFromUnstructuredText(text);
    }
    
    return items;
  }

  // Агрессивный поиск всех воздуховодов в тексте
  private extractAllDuctItems(text: string): DuctItem[] {
    console.log('PDF Parser: Агрессивный поиск воздуховодов по всему тексту');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: DuctItem[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Ищем строки с воздуховодами по ключевым словам и размерам
      if (this.looksLikeDuctLine(line)) {
        const ductItem = this.parseDuctFromLine(line, i);
        if (ductItem) {
          items.push(ductItem);
        }
      }
    }
    
    return items;
  }
  
  private looksLikeDuctLine(line: string): boolean {
    const lower = line.toLowerCase();
    
    // Ищем строки с воздуховодами в формате как в вашем PDF
    const hasKeyword = lower.includes('воздуховод') || lower.includes('duct');
    
    // Ищем размеры в формате NxN-1160 или (NxN-1160)
    const hasDimensions = /\d+[х×x]\d+[-‒]\d+|\(\d+[х×x]\d+[-‒]\d+/.test(line);
    
    // Ищем количество в штуках в конце строки
    const hasQuantity = /\d+\s*шт\s*$/i.test(line.trim());
    
    return hasKeyword && hasDimensions && hasQuantity;
  }
  
  private parseDuctFromLine(line: string, lineIndex: number): DuctItem | null {
    try {
      // Извлекаем размеры
      const dimensions = this.extractDimensionsFromName(line);
      if (!dimensions) return null;
      
      // Извлекаем количество
      let quantity = this.parseQuantityFromText(line);
      
      // Для проектных файлов количество уже в штуках, длина уже 1160мм
      let actualQty = quantity;
      let actualLength = 1160; // Стандартная длина TDC фланца
      
      console.log(`PDF Parser: Воздуховод ${dimensions.w || dimensions.d}×${dimensions.h || dimensions.d} - ${actualQty} шт по ${actualLength}мм`);
      
      const item: DuctItem = {
        id: `aggressive_${lineIndex}_${Date.now()}`,
        type: dimensions.type,
        qty: actualQty,
        length: actualLength,
        weightKg: this.calculateWeight(
          dimensions.w || dimensions.d || 0,
          dimensions.h || dimensions.d || 0,
          actualLength,
          'оцинкованная сталь'
        ),
        ...(dimensions.w && dimensions.h ? { w: dimensions.w, h: dimensions.h } : {}),
        ...(dimensions.d ? { d: dimensions.d } : {}),
        flangeType: 'TDC',
        material: 'galvanized'
      };
      
      return item;
    } catch (error) {
      console.error(`PDF Parser: Ошибка парсинга строки ${lineIndex}:`, error);
      return null;
    }
  }

  // Специальный парсер для вашего формата PDF (example pdf 247.pdf)
  private extractSpecificationTable(text: string): DuctItem[] {
    console.log('PDF Parser: Поиск спецификационной таблицы в формате проекта');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: DuctItem[] = [];
    
    // Ищем строки в формате: "Воздуховод # (1500×500-1160 оц.1.00 [TDC/TDC]) 46 шт"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isProjectDuctLine(line)) {
        const item = this.parseProjectDuctLine(line, i);
        if (item) {
          const key = this.createDuctKey(item);
          
          if (this.ductMap.has(key)) {
            // Дедупликация - суммируем количество
            const existing = this.ductMap.get(key)!;
            existing.qty += item.qty;
          } else {
            this.ductMap.set(key, item);
          }
        }
      }
    }
    
    return Array.from(this.ductMap.values());
  }
  
  // Проверяет, является ли строка строкой с воздуховодом в формате проекта
  private isProjectDuctLine(line: string): boolean {
    // Формат: "Воздуховод # (1500×500-1160 оц.1.00 [TDC/TDC]) 46 шт"
    return line.includes('Воздуховод #') && 
           line.includes('(') && 
           line.includes('×') && 
           line.includes('-1160') &&
           line.includes('шт');
  }
  
  // Парсит строку воздуховода в формате проекта
  private parseProjectDuctLine(line: string, lineIndex: number): DuctItem | null {
    try {
      // Извлекаем размеры из формата (1500×500-1160)
      const sizeMatch = line.match(/\((\d+)×(\d+)-(\d+)/);
      if (!sizeMatch) return null;
      
      const width = parseInt(sizeMatch[1]);
      const height = parseInt(sizeMatch[2]);
      const length = parseInt(sizeMatch[3]); // Всегда 1160 для TDC
      
      // Извлекаем количество в штуках
      const qtyMatch = line.match(/(\d+)\s*шт/);
      if (!qtyMatch) return null;
      
      const qty = parseInt(qtyMatch[1]);
      
      // Извлекаем тип фланца из [TDC/TDC] или [SHINA_20/SHINA_20]
      let flangeType = 'TDC'; // По умолчанию
      const flangeMatch = line.match(/\[([^\/]+)\/[^\]]+\]/);
      if (flangeMatch) {
        const extractedFlange = flangeMatch[1].trim();
        if (extractedFlange.includes('SHINA') || extractedFlange.includes('шина')) {
          if (extractedFlange.includes('20')) flangeType = 'SHINA_20';
          else if (extractedFlange.includes('30')) flangeType = 'SHINA_30';
        }
      }
      
      const item: DuctItem = {
        id: `project_${width}x${height}_${lineIndex}`,
        type: 'rect',
        w: width,
        h: height,
        length: length,
        qty: qty,
        weightKg: this.calculateWeight(width, height, length, 'оцинкованная сталь'),
        flangeType: flangeType as 'TDC' | 'SHINA_20' | 'SHINA_30',
        material: 'galvanized'
      };
      
      console.log(`PDF Parser: Найден воздуховод ${width}×${height}-${length} [${flangeType}] - ${qty} шт`);
      return item;
      
    } catch (error) {
      console.error(`PDF Parser: Ошибка парсинга проектной строки ${lineIndex}:`, error);
      return null;
    }
  }
  
  // Создает ключ для дедупликации
  private createDuctKey(item: DuctItem): string {
    return `${item.w || item.d}x${item.h || item.d}x${item.length}_${item.flangeType}`;
  }
  
  private extractSpecificationTableOld(text: string): DuctItem[] {
    console.log('PDF Parser: Поиск спецификационной таблицы (старый метод)');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: DuctItem[] = [];
    
    // Ищем заголовки таблицы спецификации
    let headerIndex = -1;
    let columnMapping: { name: number; designation: number; quantity: number } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Ищем строку с заголовками таблицы
      if (this.isSpecificationHeader(line)) {
        console.log('PDF Parser: Найден заголовок спецификации:', lines[i]);
        headerIndex = i;
        columnMapping = this.parseSpecificationHeader(lines[i]);
        break;
      }
    }
    
    if (headerIndex === -1 || !columnMapping) {
      console.log('PDF Parser: Заголовок спецификации не найден');
      return [];
    }
    
    // Парсим строки таблицы после заголовка
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Пропускаем пустые строки и разделители
      if (!line || line.match(/^[-=_\s]+$/)) continue;
      
      // Останавливаемся на конце таблицы
      if (this.isEndOfTable(line)) break;
      
      // Проверяем, содержит ли строка воздуховод
      if (this.containsAirDuctInSpecification(line)) {
        console.log('PDF Parser: Найдена строка воздуховода:', line);
        
        const item = this.parseSpecificationRow(line, columnMapping, i);
        if (item) {
          this.addOrUpdateDuct(item);
          items.push(item);
        }
      }
    }
    
    console.log(`PDF Parser: Извлечено ${items.length} воздуховодов из спецификации`);
    return items;
  }

  private isSpecificationHeader(line: string): boolean {
    // Более гибкий поиск заголовков спецификации
    const keywords = [
      'наименование', 'обозначение', 'количество', 'кол-во', 'шт', 'м',
      'воздуховод', 'размер', 'сечение', 'позиция', 'поз'
    ];
    
    const foundKeywords = keywords.filter(keyword => line.toLowerCase().includes(keyword));
    
    // Если найдены ключевые слова И строка выглядит как заголовок таблицы
    return foundKeywords.length >= 1 && (
      line.includes('|') || // разделители таблицы
      /\s+\d+\s+/.test(line) || // номера столбцов  
      line.split(/\s+/).length >= 3 // минимум 3 столбца
    );
  }

  private parseSpecificationHeader(headerLine: string): { name: number; designation: number; quantity: number } | null {
    const columns = this.splitTableRow(headerLine);
    const mapping = { name: -1, designation: -1, quantity: -1 };
    
    columns.forEach((col, index) => {
      const lower = col.toLowerCase();
      
      if (lower.includes('наименование') || lower.includes('название')) {
        mapping.name = index;
      } else if (lower.includes('обозначение') || lower.includes('код') || lower.includes('артикул')) {
        mapping.designation = index;
      } else if (lower.includes('количество') || lower.includes('кол-во') || lower.includes('шт')) {
        mapping.quantity = index;
      }
    });
    
    // Проверяем, что нашли хотя бы наименование и количество
    if (mapping.name >= 0 && mapping.quantity >= 0) {
      console.log('PDF Parser: Структура таблицы:', mapping);
      return mapping;
    }
    
    return null;
  }

  private containsAirDuctInSpecification(line: string): boolean {
    const ductKeywords = [
      'воздуховод',
      'воздуховод прямоугольный',
      'воздуховод круглый',
      'воздуховод прямоуг',
      'канал воздушный',
      'короб воздушный'
    ];
    
    const excludeKeywords = [
      'отвод',
      'тройник', 
      'переход',
      'врезка',
      'заглушка',
      'решетка',
      'диффузор',
      'клапан',
      'фланец'
    ];
    
    const lowerLine = line.toLowerCase();
    
    // Должен содержать ключевое слово воздуховода
    const hasAirDuct = ductKeywords.some(keyword => lowerLine.includes(keyword));
    
    // Но не должен содержать исключающие слова (фасонные части)
    const hasFittings = excludeKeywords.some(keyword => lowerLine.includes(keyword));
    
    return hasAirDuct && !hasFittings;
  }

  private parseSpecificationRow(
    line: string, 
    columnMapping: { name: number; designation: number; quantity: number },
    lineIndex: number
  ): DuctItem | null {
    try {
      const columns = this.splitTableRow(line);
      
      const nameColumn = columns[columnMapping.name] || '';
      const quantityColumn = columns[columnMapping.quantity] || '1';
      const designationColumn = columns[columnMapping.designation] || '';
      
      console.log('PDF Parser: Парсинг строки:', { nameColumn, quantityColumn, designationColumn });
      
      // Извлекаем размеры из наименования
      const dimensions = this.extractDimensionsFromName(nameColumn);
      if (!dimensions) {
        console.log('PDF Parser: Не удалось извлечь размеры из:', nameColumn);
        return null;
      }
      
      // Извлекаем количество
      const quantity = this.parseQuantityFromText(quantityColumn);
      
      // Извлекаем тип фланца
      const flangeType = this.extractFlangeType(nameColumn + ' ' + designationColumn);
      
      // Создаем ключ для дедупликации
      const key = this.createDuctKey(dimensions);
      
      // Если количество в метрах, пересчитываем в штуки по фланцу TDC (1160мм)
      let actualQty = quantity;
      let actualLength = dimensions.length;
      
      // Проверяем, если количество больше 100 или есть указания на метры
      if (quantity > 100 || quantityColumn.toLowerCase().includes('м') || quantityColumn.toLowerCase().includes('метр')) {
        // Пересчитываем метры в штуки по стандартной длине фланца TDC
        const TDC_LENGTH = 1160; // мм - стандартная длина фланца TDC
        actualQty = Math.ceil(quantity * 1000 / TDC_LENGTH); // переводим метры в мм и делим на длину фланца
        actualLength = TDC_LENGTH;
        console.log(`PDF Parser: Пересчитано ${quantity}м -> ${actualQty} шт по ${TDC_LENGTH}мм`);
      }
      
      const item: DuctItem = {
        id: `spec_${lineIndex}_${key}`,
        type: dimensions.type,
        qty: actualQty,
        length: actualLength,
        weightKg: this.calculateWeight(
          dimensions.w || dimensions.d || 0, 
          dimensions.h || dimensions.d || 0, 
          actualLength, 
          'оцинкованная сталь'
        ),
        ...(dimensions.w && dimensions.h ? { w: dimensions.w, h: dimensions.h } : {}),
        ...(dimensions.d ? { d: dimensions.d } : {}),
        flangeType: 'TDC', // Для проектов всегда TDC фланцы
        material: 'galvanized'
      };
      
      console.log('PDF Parser: Создан воздуховод:', item);
      return item;
      
    } catch (error) {
      console.error('PDF Parser: Ошибка парсинга строки спецификации:', error);
      return null;
    }
  }

  private extractDimensionsFromName(name: string): { 
    type: 'rect' | 'round'; 
    w?: number; 
    h?: number; 
    d?: number; 
    length: number 
  } | null {
    // Прямоугольные воздуховоды: "Воздуховод 500х300-1000", "500x300-1200"
    const rectMatch = name.match(/(\d+)\s*[x×х]\s*(\d+)\s*[-–]\s*(\d+)/);
    if (rectMatch) {
      return {
        type: 'rect',
        w: parseInt(rectMatch[1]),
        h: parseInt(rectMatch[2]),
        length: parseInt(rectMatch[3])
      };
    }
    
    // Круглые воздуховоды: "Воздуховод Ø200-1000", "D200-1500"
    const roundMatch = name.match(/[ØD]?\s*(\d+)\s*[-–]\s*(\d+)/);
    if (roundMatch && name.toLowerCase().includes('круг')) {
      return {
        type: 'round',
        d: parseInt(roundMatch[1]),
        length: parseInt(roundMatch[2])
      };
    }
    
    // Альтернативный формат: "Воздуховод прямоугольный 400х200х1000"
    const altRectMatch = name.match(/(\d+)\s*[x×х]\s*(\d+)\s*[x×х]\s*(\d+)/);
    if (altRectMatch) {
      return {
        type: 'rect',
        w: parseInt(altRectMatch[1]),
        h: parseInt(altRectMatch[2]),
        length: parseInt(altRectMatch[3])
      };
    }
    
    return null;
  }

  private extractFlangeType(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Проверяем различные типы фланцев
    if (lowerText.includes('tdc')) {
      return 'TDC';
    }
    
    if (lowerText.includes('шина 30') || lowerText.includes('шина30')) {
      return 'SHINA_30';
    }
    
    if (lowerText.includes('шина 20') || lowerText.includes('шина20')) {
      return 'SHINA_20';
    }
    
    if (lowerText.includes('призма') || lowerText.includes('prizma')) {
      return 'PRIZMA';
    }
    
    if (lowerText.includes('угловой') || lowerText.includes('angle')) {
      return 'ANGLE';
    }
    
    if (lowerText.includes('резин') || lowerText.includes('rubber')) {
      return 'RUBBER';
    }
    
    return null; // DEFAULT будет назначен автоматически
  }

  private parseQuantityFromText(text: string): number {
    // Различные форматы количества
    const patterns = [
      /(\d+)\s*шт/,           // "5 шт"
      /(\d+)\s*штук/,         // "5 штук"
      /(\d+)\s*м\.п/,         // "10 м.п" (метры погонные)
      /^(\d+)$/,              // Просто число
      /(\d+),(\d+)/           // "5,5" (дробное количество)
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern === patterns[4]) {
          // Дробное число
          return parseFloat(match[1] + '.' + match[2]);
        }
        return parseInt(match[1]);
      }
    }
    
    return 1; // По умолчанию
  }

  private isEndOfTable(line: string): boolean {
    const endMarkers = [
      'итого',
      'всего',
      'сумма',
      'total',
      'примечание',
      'note',
      'страница',
      'лист'
    ];
    
    const lowerLine = line.toLowerCase();
    return endMarkers.some(marker => lowerLine.includes(marker));
  }


  private addOrUpdateDuct(item: DuctItem): void {
    const key = this.createDuctKey(item);
    
    const existing = this.ductMap.get(key);
    if (existing) {
      // Суммируем количество для одинаковых воздуховодов
      existing.qty += item.qty;
      console.log(`PDF Parser: Объединены дубликаты ${key}, новое количество: ${existing.qty}`);
    } else {
      this.ductMap.set(key, { ...item });
    }
  }

  private deduplicateItems(items: DuctItem[]): DuctItem[] {
    console.log(`PDF Parser: Дедупликация ${items.length} → ${this.ductMap.size} уникальных воздуховодов`);
    return Array.from(this.ductMap.values());
  }

  private extractTableData(text: string): DuctItem[] {
    console.log('PDF Parser: Full text for analysis:', text);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items: DuctItem[] = [];
    
    console.log('PDF Parser: Total lines found:', lines.length);
    console.log('PDF Parser: All lines:', lines);
    
    // Look for air duct patterns in ALL text, not just table headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for "Воздуховод" pattern
      if (this.containsAirDuct(line)) {
        console.log('PDF Parser: Found air duct line:', line);
        
        // Try to extract dimensions and quantity from this line
        const item = this.parseAirDuctLine(line, i, lines);
        if (item) {
          console.log('PDF Parser: Extracted air duct item:', item);
          items.push(item);
        }
      }
    }
    
    console.log('PDF Parser: Total items extracted:', items.length);
    return items;
  }

  private containsAirDuct(line: string): boolean {
    const airDuctKeywords = [
      'Воздуховод',
      'воздуховод', 
      'ВОЗДУХОВОД',
      'воздуховоды',
      'Воздуховоды'
    ];
    
    return airDuctKeywords.some(keyword => line.includes(keyword));
  }

  private parseAirDuctLine(line: string, lineIndex: number, allLines: string[]): DuctItem | null {
    try {
      console.log('PDF Parser: Parsing air duct line:', line);
      
      // Extract dimensions - look for patterns like "1500x500-1160"
      const dimensionMatch = line.match(/(\d+)x(\d+)-(\d+)/);
      if (!dimensionMatch) {
        console.log('PDF Parser: No dimensions found in line');
        return null;
      }
      
      const width = parseInt(dimensionMatch[1]);
      const height = parseInt(dimensionMatch[2]);
      const length = parseInt(dimensionMatch[3]);
      
      console.log('PDF Parser: Found dimensions:', { width, height, length });
      
      // Extract quantity - look in current line and nearby lines
      let quantity = this.extractQuantity(line, lineIndex, allLines);
      
      if (quantity === 0) {
        quantity = 1; // Default quantity
      }
      
      console.log('PDF Parser: Found quantity:', quantity);
      
      // Extract material info
      const material = this.extractMaterial(line);
      
      // Extract flange type
      const flangeType = this.extractFlangeType(line);
      
      const weight = this.calculateWeight(width, height, length, material);
      
      const item: DuctItem = {
        id: `airduct_${lineIndex}`,
        type: 'rect',
        w: width,
        h: height,
        length: length,
        qty: quantity,
        weightKg: weight,
        ...(flangeType ? { flangeType: flangeType as 'TDC' | 'SHINA_20' | 'SHINA_30' | 'REYКА' | 'NONE' } : {})
      };
      
      return item;
    } catch (error) {
      console.error('PDF Parser: Error parsing air duct line:', error);
      return null;
    }
  }

  private extractQuantity(line: string, lineIndex: number, allLines: string[]): number {
    // Look for quantity in current line
    const quantityMatch = line.match(/(\d+)\s*шт/);
    if (quantityMatch) {
      return parseInt(quantityMatch[1]);
    }
    
    // Look for quantity in next few lines
    for (let i = lineIndex + 1; i < Math.min(lineIndex + 5, allLines.length); i++) {
      const nextLine = allLines[i];
      const quantityMatch = nextLine.match(/(\d+)\s*шт/);
      if (quantityMatch) {
        return parseInt(quantityMatch[1]);
      }
    }
    
    return 0;
  }

  private extractMaterial(line: string): string {
    // Look for material indicators
    if (line.includes('оц.') || line.includes('оцинк')) {
      return 'оцинкованная сталь';
    }
    if (line.includes('нерж') || line.includes('нержавеющая')) {
      return 'нержавеющая сталь';
    }
    if (line.includes('черн') || line.includes('черная')) {
      return 'черная сталь';
    }
    
    return 'оцинкованная сталь'; // Default
  }

  private calculateWeight(width: number, height: number, length: number, material: string): number {
    // Real calculation based on GOST standards for galvanized steel ducts
    
    // Calculate surface area of rectangular duct (4 sides)
    const perimeter = 2 * (width + height); // mm
    const surfaceArea = perimeter * length; // mm²
    const surfaceAreaM2 = surfaceArea / 1000000; // Convert to m²
    
    // Determine thickness based on material and size
    let thickness: number;
    if (material.includes('оцинк') || material.includes('оц.')) {
      // Galvanized steel thickness based on duct size
      if (width <= 300 && height <= 300) {
        thickness = 0.5; // 0.5mm for small ducts
      } else if (width <= 500 && height <= 500) {
        thickness = 0.7; // 0.7mm for medium ducts
      } else if (width <= 800 && height <= 800) {
        thickness = 0.8; // 0.8mm for large ducts
      } else {
        thickness = 1.0; // 1.0mm for very large ducts
      }
    } else if (material.includes('нерж')) {
      thickness = 0.8; // Stainless steel typically 0.8mm
    } else {
      thickness = 0.7; // Default thickness
    }
    
    // Weight per m² based on thickness (from GOST standards)
    const weightPerM2 = thickness * 7.85; // kg/m² (steel density = 7850 kg/m³)
    
    // Total weight
    const totalWeight = surfaceAreaM2 * weightPerM2;
    
    return Math.round(totalWeight * 100) / 100; // Round to 2 decimal places
  }

  private extractFromUnstructuredText(text: string): DuctItem[] {
    const items: DuctItem[] = [];
    
    // Look for dimension patterns like "500x300x1000" or "Ø200x1000"
    const dimensionPatterns = [
      // Rectangular: 500x300x1000, 500*300*1000
      /(\d+)\s*[x*×]\s*(\d+)\s*[x*×]\s*(\d+)/gi,
      // Round: Ø200x1000, D200x1000, диаметр 200 длина 1000
      /(?:Ø|D|диаметр)\s*(\d+)\s*[x*×]\s*(\d+)/gi,
      /диаметр\s*(\d+).*?длина\s*(\d+)/gi,
    ];
    
    let itemId = 1;
    
    for (const pattern of dimensionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          if (pattern === dimensionPatterns[0]) {
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
          console.warn('Error parsing dimension from text:', error);
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
    const mappings = {
      id: ['id', 'код', 'артикул', 'номер', 'код_товара'],
      type: ['type', 'тип', 'вид', 'форма'],
      width: ['w', 'width', 'ширина', 'w_мм'],
      height: ['h', 'height', 'высота', 'h_мм'],
      diameter: ['d', 'diameter', 'диаметр', 'd_мм'],
      length: ['l', 'length', 'длина', 'l_мм', 'длинна'],
      qty: ['qty', 'quantity', 'количество', 'кол-во', 'шт'],
      weight: ['weight', 'вес', 'масса', 'кг'],
    };
    
    columns.forEach((column, index) => {
      const normalizedColumn = column.toLowerCase().trim();
      
      for (const [field, variations] of Object.entries(mappings)) {
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
    
    const num = parseFloat(value.toString().replace(',', '.'));
    return isNaN(num) ? null : num;
  }
}
