# 🚀 Быстрый старт VentProm Packer

## Вариант 1: Запуск из текущей папки

```bash
# Запустить систему с hot reload
START_WITH_HOT_RELOAD.bat
```

## Вариант 2: Установка с GitHub

```bash
# Запустить установку с GitHub
SETUP_FROM_GITHUB.bat
```

Введите URL вашего репозитория, и система автоматически:
- Клонирует репозиторий
- Настроит Docker
- Запустит с hot reload

## 🔥 Hot Reload

После запуска вы можете:

1. **Редактировать API код** в `apps/api/src/`
   - Изменения применятся автоматически
   - Смотрите логи в консоли

2. **Редактировать Web код** в `apps/web/src/`
   - Страница обновится автоматически
   - Next.js Fast Refresh включен

3. **Изменять парсеры** в `packages/parsers/src/`
   - Пересоберите: `cd packages/parsers && npm run build`
   - API подхватит изменения

## 📦 Структура проекта

```
ventprom-packer/
├── apps/
│   ├── api/          # NestJS API (порт 3001)
│   └── web/          # Next.js Web (порт 3000)
├── packages/
│   ├── core/         # Алгоритмы упаковки
│   └── parsers/      # Парсеры файлов
└── docker-compose.github.yml  # Docker с hot reload
```

## 🛠️ Команды

### Запуск
```bash
docker-compose -f docker-compose.github.yml up
```

### Остановка
```bash
docker-compose down
```

### Пересборка
```bash
docker-compose -f docker-compose.github.yml up --build
```

### Логи
```bash
docker-compose logs -f api    # Логи API
docker-compose logs -f web    # Логи Web
```

## 🎯 Использование

1. Откройте http://localhost:3000
2. Загрузите PDF/Excel файл с воздуховодами
3. Выберите транспорт (Фура/Газель/КАМАЗ)
4. Нажмите "Pack Items"
5. Смотрите 3D визуализацию
6. Экспортируйте результат

## 🐛 Решение проблем

### API не отвечает
```bash
docker-compose logs api
docker-compose restart api
```

### Web не обновляется
```bash
docker-compose logs web
docker-compose restart web
```

### Полная пересборка
```bash
docker-compose down
docker system prune -f
docker-compose -f docker-compose.github.yml up --build
```
