
# PROMPTS (RU/EN)

## Стартовый промпт (RU)
Ты — старший разработчик. Цель: создать веб-приложение “Ventprom Packer”. Функции: загрузка PDF/XLSX/TXT с номенклатурой воздуховодов; парсинг; расчёт 3D-упаковки в кузове с минимизацией числа машин, с правилом “большие снизу” (слои/ряды); визуализация в 3D; экспорт отчёта в PDF с изображениями рядов; экспорт GLB и самодостаточного HTML. Стек: Next.js + Three.js (web), NestJS (api), TypeScript (core). Придерживайся структуры репозитория и `docs/API_CONTRACT.md`. Пиши юнит-тесты (Jest) и e2e (Playwright). Выполняй задачи из `docs/PRODUCT_PLAN.md` по порядку. Любое изменение покрывай тестами. Критерий: все тесты зелёные, `docker compose up` поднимает web+api, e2e проходит, образцы экспортов формируются.

## Starter Prompt (EN)
You are the lead developer. Goal: build the “Ventprom Packer” web app. Features: upload PDF/XLSX/TXT with duct items; parse; compute 3D truck packing minimizing number of trucks, enforcing “big items at the bottom” with layers/rows; 3D visualization; export report to PDF with per-row images; export GLB and a self-contained HTML. Stack: Next.js + Three.js (web), NestJS (api), TypeScript (core). Follow the repo structure and `docs/API_CONTRACT.md`. Write unit tests (Jest) and e2e (Playwright). Execute tasks from `docs/PRODUCT_PLAN.md` in order. Cover changes with tests. Final acceptance: all tests green, `docker compose up` runs web+api, e2e passes, sample exports are produced.

## Парсинг (RU)
Реализуй `packages/parsers` для XLSX/PDF/TXT. Выход — `DuctItem[]` (`packages/core/src/models.ts`). Учти RU/EN заголовки, добавь эвристики сопоставления колонок (W/H/L/Qty/Weight). Покрой Jest-тестами с `sample_files/*`.

## Parsing (EN)
Implement `packages/parsers` for XLSX/PDF/TXT returning standardized `DuctItem[]` (see `packages/core/src/models.ts`). Handle RU/EN headers; add heuristics to map columns (W/H/L/Qty/Weight). Provide Jest tests with `sample_files/*`.

## Алгоритм упаковки (RU)
В `packages/core` реализуй FFD с 6 ориентациями, укладку слоями, правило “большие снизу”, multistart+beam (k=5). Верни `PackResult` с `placements`, `rows`, `metrics`. Напиши тесты на пересечения/слои/снижение числа машин vs baseline.

## Packing Algorithm (EN)
In `packages/core`, implement FFD with 6 orientations, layered packing, “big items at the bottom”, multi-start + beam (k=5). Return `PackResult` with `placements`, `rows`, `metrics`. Add tests for collisions, layering, and reduced truck count vs baseline.

## 3D и экспорт (RU)
Сделай 3D страницу (Three.js): кузов по размерам, блоки-воздуховоды, переключатель рядов/слоёв, кнопка “Снимки рядов”. В API реализуй `export/pdf` (Puppeteer), экспорт GLB и self-contained HTML. Добавь e2e: загрузка → расчёт → 3D → экспорт PDF/HTML/GLB.

## 3D & Export (EN)
Create 3D page (Three.js): truck by dimensions, duct blocks, row/layer toggle, “Capture row images”. In API implement `export/pdf` (Puppeteer) and exports for GLB and self-contained HTML. Add e2e: upload → compute → 3D → export PDF/HTML/GLB.
