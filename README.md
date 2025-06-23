# LLM Debate MVP

Минимальная версия веб-приложения для проведения интеллектуальных дебатов между языковыми моделями.

## Возможности

- Дебаты между GPT-4o и Gemini 2.5 Flash
- Две роли: Сторонник и Критик
- Настраиваемое количество раундов (1-10)
- Регулировка креативности ответов
- Сохранение истории дебатов в локальной SQLite базе

## Требования

- Node.js 18+
- npm или yarn
- API ключи от OpenAI и Google

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ash16888/llm-debate.git
cd llm-debate
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` на основе примера:
```bash
cp .env.local.example .env.local
```

4. Отредактируйте `.env.local` и добавьте ваши API ключи:
```
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

## Запуск

### Режим разработки
```bash
npm run dev
```
Приложение будет доступно по адресу http://localhost:3000

### Продакшен сборка
```bash
npm run build
npm start
```

## Скрипты

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка для продакшена
- `npm start` - запуск продакшен версии
- `npm run lint` - проверка кода линтером
- `npm run type-check` - проверка типов TypeScript

## Структура проекта

```
llm-debate/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── debate/[id]/       # Страница дебатов
│   └── history/           # История дебатов
├── components/            # React компоненты
├── lib/                   # Утилиты и интеграции
│   ├── db.ts             # SQLite база данных
│   ├── llm-providers.ts  # Интеграция с LLM
│   └── prompts.ts        # Промпты для дебатов
├── types/                 # TypeScript типы
└── debates.db            # Локальная БД (создается автоматически)
```

## Технологии

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **База данных**: SQLite с better-sqlite3
- **LLM провайдеры**: OpenAI API, Google Generative AI

## Лицензия

ISC