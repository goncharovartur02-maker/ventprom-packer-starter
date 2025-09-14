# VentProm Packer - 3D Packing System

## 📋 Обзор проекта

VentProm Packer - это система для 3D упаковки воздуховодов и других объектов в транспортные средства. Система состоит из API (NestJS), веб-интерфейса (Next.js) и алгоритмов упаковки.

## 🏗️ Архитектура

### Monorepo структура:
- **`apps/api/`** - NestJS API сервер
- **`apps/web/`** - Next.js веб-приложение
- **`packages/core/`** - Общие типы и алгоритмы упаковки
- **`packages/parsers/`** - Парсеры файлов (Excel, PDF, Text, Image)

## 📁 Структура файлов

### 🚀 Запуск приложения

#### Основные скрипты:
- **`DEV_MODE.bat`** - Development режим с hot reload
- **`QUICK_START.bat`** - Быстрый запуск production версии
- **`STOP.bat`** - Остановка всех контейнеров

#### Docker файлы:
- **`docker-compose.dev.yml`** - Development режим с hot reload
- **`docker-compose.quick.yml`** - Быстрый production запуск
- **`docker-compose.simple.yml`** - Простой запуск
- **`docker-compose.yml`** - Основной production файл

#### Dockerfile'ы:
- **`Dockerfile.dev`** - Development контейнер
- **`Dockerfile.quick`** - Быстрый production контейнер
- **`Dockerfile.simple`** - Простой контейнер

### 📱 Приложения

#### API (NestJS) - `apps/api/`
- **`src/main.ts`** - Точка входа API сервера
- **`src/app.module.ts`** - Главный модуль приложения
- **`src/parse/`** - Модуль парсинга файлов
  - `parse.controller.ts` - Контроллер для загрузки файлов
  - `parse.service.ts` - Сервис парсинга (Excel, PDF, Text, Image)
  - `parse.module.ts` - Модуль парсинга
- **`src/pack/`** - Модуль упаковки
  - `pack.controller.ts` - Контроллер упаковки
  - `pack.service.ts` - Сервис 3D упаковки
  - `pack.module.ts` - Модуль упаковки
- **`src/presets/`** - Модуль пресетов транспортных средств
  - `presets.controller.ts` - Контроллер пресетов
  - `presets.service.ts` - Сервис пресетов
  - `presets.module.ts` - Модуль пресетов
- **`src/export/`** - Модуль экспорта результатов
  - `export.controller.ts` - Контроллер экспорта
  - `export.service.ts` - Сервис экспорта
  - `export.module.ts` - Модуль экспорта

#### Web (Next.js) - `apps/web/`
- **`src/app/page.tsx`** - Главная страница приложения
- **`src/app/layout.tsx`** - Лейаут приложения
- **`src/app/globals.css`** - Глобальные стили
- **`src/components/`** - React компоненты
  - `FileUpload.tsx` - Компонент загрузки файлов
  - `VehicleSelector.tsx` - Селектор транспортных средств
  - `PackingResults.tsx` - Отображение результатов упаковки
  - `ThreeDViewer.tsx` - 3D визуализация упакованных объектов

### 📦 Пакеты

#### Core - `packages/core/`
- **`src/models.ts`** - Основные типы данных
  - `Vehicle` - Интерфейс транспортного средства
  - `UniversalItem` - Универсальный интерфейс объекта
  - `DuctItem` - Интерфейс воздуховода (legacy)
  - `Placement` - Интерфейс размещения объекта
  - `PackResult` - Результат упаковки
- **`src/pack3d.ts`** - Основной алгоритм 3D упаковки
- **`src/constraints.ts`** - Ограничения упаковки
- **`src/eval.ts`** - Оценка качества упаковки
- **`src/heuristics/`** - Эвристические алгоритмы
  - `beam.ts` - Beam Search алгоритм
  - `greedy.ts` - Жадный алгоритм
  - `multistart.ts` - Multi-start алгоритм
  - `layer_rules.ts` - Правила слоев

#### Parsers - `packages/parsers/`
- **`src/excel.ts`** - Парсер Excel файлов (.xlsx)
  - Поддерживает универсальное извлечение данных
  - Распознает размеры, количество, материалы
  - Обрабатывает множественные листы
- **`src/pdf.ts`** - Парсер PDF файлов
  - Извлекает таблицы из PDF
  - Ищет размеры в тексте (например, "500x300x1000")
  - Поддерживает русский и английский языки
- **`src/text.ts`** - Парсер текстовых файлов (.txt, .csv)
- **`src/image.ts`** - Парсер изображений (OCR с Tesseract.js)
- **`src/universal.ts`** - Универсальный парсер
- **`dist/index.js`** - Скомпилированные парсеры (JavaScript)

### 📄 Конфигурация

#### Корневые файлы:
- **`package.json`** - Основные зависимости и скрипты
- **`tsconfig.json`** - Конфигурация TypeScript
- **`docker-compose.yml`** - Основной Docker Compose файл

#### Конфигурация - `config/`
- **`tsconfig.base.json`** - Базовая конфигурация TypeScript
- **`jest.config.js`** - Конфигурация тестов
- **`jest.setup.js`** - Настройка тестов

### 📚 Документация - `docs/`
- **`API_CONTRACT.md`** - Контракт API
- **`PRODUCT_PLAN.md`** - План продукта
- **`TEST_PLAN.md`** - План тестирования
- **`README_TZ.md`** - Техническое задание

### 🧪 Тесты - `tests/`
- **`e2e/pack-flow.spec.ts`** - End-to-end тесты

### 📁 Примеры - `examples/`
- **`example xlsx.xlsx`** - Пример Excel файла
- **`example pdf.pdf`** - Пример PDF файла
- **`example png.png`** - Пример изображения
- **`README.md`** - Описание примеров

### 🔧 Скрипты - `scripts/`
- **`test_parsers.bat`** - Тестирование парсеров
- **`test_functionality.bat`** - Тестирование функциональности
- **`DEV_MODE.bat`** - Development режим
- **`SIMPLE_DOCKER.bat`** - Простой Docker запуск

## 🚀 Как запустить

### Development режим (с hot reload):
```bash
DEV_MODE.bat
```
- Изменения в коде отображаются сразу
- Не нужно перезапускать контейнеры

### Production режим:
```bash
QUICK_START.bat
```
- Стабильная версия
- Быстрый запуск

### Остановка:
```bash
STOP.bat
```

## 🌐 Доступ к приложению

- **Веб-интерфейс**: http://localhost:3000
- **API**: http://localhost:3001
- **API документация**: http://localhost:3001/api

## 📊 Поддерживаемые форматы файлов

### Excel (.xlsx)
- Извлекает все данные из таблиц
- Поддерживает множественные листы
- Распознает размеры, количество, материалы

### PDF (.pdf)
- Извлекает таблицы
- Ищет размеры в тексте
- Поддерживает русский и английский языки

### Текст (.txt, .csv)
- Парсит разделенные данные
- Поддерживает различные разделители

### Изображения (.png, .jpg)
- OCR с помощью Tesseract.js
- Извлекает текст из изображений

## 🔧 Технологии

- **Backend**: NestJS, TypeScript
- **Frontend**: Next.js, React, TypeScript
- **3D**: Three.js
- **Парсинг**: ExcelJS, PDF-Parse, Tesseract.js
- **Контейнеризация**: Docker, Docker Compose
- **Стили**: Tailwind CSS

## 📝 API Endpoints

- `POST /parse` - Загрузка и парсинг файлов
- `POST /pack` - Упаковка объектов
- `GET /presets` - Получение пресетов транспортных средств
- `POST /export` - Экспорт результатов

## 🐛 Отладка

### Логи контейнеров:
```bash
docker-compose logs -f api
docker-compose logs -f web
```

### Пересборка:
```bash
docker-compose up --build
```

## 📈 Производительность

- **Алгоритм упаковки**: Beam Search с k=5
- **Ориентации**: 6 возможных поворотов
- **Сетка**: 5mm точность
- **Слои**: Правила "большие объекты внизу"

## 🔧 Последние исправления

### ✅ Исправлена загрузка файлов (2024-12-19)
- **Проблема**: "Failed to fetch" при загрузке файлов
- **Решение**: 
  - Исправлена структура данных в `packages/parsers/dist/index.js`
  - Обновлен PDF парсер для корректного извлечения воздуховодов
  - Добавлен расчет веса по ГОСТ стандартам
  - Исправлены импорты в API сервисе

### 📊 Результаты тестирования парсеров
- **PDF файлы**: Успешно извлекает воздуховоды из всех тестовых файлов
- **Найдено воздуховодов**: 392 шт в 3 файлах
- **Общий вес**: 495.31 кг
- **Точность расчета веса**: По ГОСТ стандартам для оцинкованной стали

### 🚀 Новая система управления (2024-12-19)

#### Простые команды:
- **`START.bat`** - Простой запуск системы
- **`STOP.bat`** - Остановка всех контейнеров
- **`AUTO_FIX.bat`** - Автоматическое исправление и тестирование
- **`TEST_SYSTEM.bat`** - Тестирование системы
- **`PUSH_AND_DEPLOY.bat`** - Git push с авто-деплоем

#### Автоматизация:
- **Git workflow** - Автоматический деплой при push в main
- **Hot reload** - Изменения в коде отображаются сразу
- **Автотестирование** - Система сама тестирует все компоненты
- **Уведомления** - Получаете уведомления когда система готова

#### Как работает:
1. Запускаете `FINAL_SYSTEM.bat`
2. Система сама исправляет все проблемы
3. Тестирует все компоненты
4. Уведомляет когда готова
5. Обновляете страницу и тестируете

### 📋 Правила разработки
- **ВСЕГДА тестировать** код перед готовностью
- **НЕ создавать** дублирующие тестовые файлы
- **ВСЕГДА пушить** изменения в GitHub
- **Проверять реальную** работоспособность системы

### 🧪 Тестирование
- **`TEST_REAL.bat`** - Реальное тестирование системы
- **`GIT_PUSH.bat`** - Push изменений в GitHub
- **`RULES.md`** - Подробные правила разработки

### 🛠 Последние правки (2025-09-14)
- API (`apps/api/src/main.ts`): сервер слушает на 0.0.0.0 (исправляет ERR_EMPTY_RESPONSE из Docker).
- Web (`apps/web/src/app/page.tsx`, `apps/web/src/components/VehicleSelector.tsx`): все запросы используют `NEXT_PUBLIC_API_URL`.
- Docker dev (`docker-compose.dev.yml`): добавлены переменные `HOST=0.0.0.0` для API и `NEXT_PUBLIC_API_URL=http://localhost:3001` для Web.

Запуск после обновлений:
1) Пересобрать дев-контейнеры: `docker compose -f docker-compose.dev.yml up --build -d`
2) Обновить страницу `http://localhost:3000`
3) Проверить `http://localhost:3001/presets`