
# TEST_PLAN

## Unit (Jest)
- parsers: excel/pdf/text → DuctItem[] (валидные размеры, qty, weight)
- core: без пересечений, соблюдение габаритов, слоистость, “большие снизу”
- core: multistart/beam снижает число машин или пустоты относительно baseline

## E2E (Playwright)
- Загрузка example.xlsx → выбор пресета “Фура” → расчёт → сцена 3D отображает ряды/слои → экспорт PDF/GLB/HTML
- Скриншотные тесты рядов: сравнение с эталоном (папка screenshots)

## Автоматизация
- GitHub Actions: запуск unit и e2e; публикация артефактов (PDF/GLB/HTML).
