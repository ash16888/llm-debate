# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# LLM Debate MVP - Локальное приложение для дебатов между языковыми моделями

## Описание проекта
Минимальная версия веб-приложения для проведения дебатов между языковыми моделями. Запускается локально, использует API ключи пользователя.

## Быстрый старт

### Инициализация проекта
```bash
# Создание Next.js приложения
npx create-next-app@latest llm-debate-mvp --typescript --tailwind --app

# Установка зависимостей
npm install openai @google/generative-ai better-sqlite3 @types/better-sqlite3
npm install -D @types/node

# Создание .env.local файла
cp .env.local.example .env.local
# Затем отредактируйте .env.local и добавьте ваши API ключи
```

### Запуск
```bash
npm run dev        # Запуск в режиме разработки
npm run build      # Сборка для продакшена
npm start          # Запуск продакшен версии
```

## Структура проекта (MVP)

```
llm-debate/
├── app/
│   ├── page.tsx                          # Главная страница с формой настройки
│   ├── debate/[id]/page.tsx              # Страница дебатов
│   ├── history/page.tsx                  # История дебатов
│   ├── api/
│   │   ├── debates/
│   │   │   ├── route.ts                  # API для создания дебатов
│   │   │   └── [id]/
│   │   │       └── complete/route.ts     # API для завершения дебатов
│   │   └── messages/route.ts             # API для генерации сообщений
│   ├── layout.tsx
│   ├── not-found.tsx                     # Страница 404
│   └── globals.css                       # Глобальные стили
├── components/
│   ├── DebateSetup.tsx                   # Форма настройки дебатов
│   ├── DebateArena.tsx                   # Основной интерфейс дебатов
│   └── MessageBubble.tsx                 # Компонент сообщения
├── lib/
│   ├── db.ts                             # SQLite база данных
│   ├── llm-providers.ts                  # Интеграция с LLM API
│   └── prompts.ts                        # Промпты для дебатов
├── types/
│   └── debate.ts                         # TypeScript типы
├── debates.db                            # SQLite БД (создается автоматически)
├── .env.local                            # API ключи
└── .env.local.example                    # Пример файла с ключами
```

## База данных (SQLite)

```typescript
// lib/db.ts
import Database from 'better-sqlite3';

const db = new Database('debates.db');

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS debates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    model1 TEXT NOT NULL,
    model2 TEXT NOT NULL,
    role1 TEXT NOT NULL,
    role2 TEXT NOT NULL,
    rounds INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debate_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    model TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(id)
  );
`);
```

## Основные компоненты

### Настройка дебатов
```typescript
// types/debate.ts
export interface DebateConfig {
  topic: string;
  model1: ModelType;
  model2: ModelType;
  role1: RoleType;
  role2: RoleType;
  rounds: number;
  maxLength?: number;
  temperature?: number;
}

export type ModelType = 'gpt-4o-mini' | 'gemini-2.5-flash';
export type RoleType = 'proponent' | 'critic';
export type DebateStatus = 'draft' | 'active' | 'completed';
```

### Интеграция с LLM
```typescript
// lib/llm-providers.ts
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateResponse(
  model: string,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  if (model === 'gpt-4o-mini') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content || '';
  } else if (model === 'gemini-2.5-flash') {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const gemini = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });
    const result = await gemini.generateContent([systemPrompt, prompt].join('\n\n'));
    return result.response.text();
  }
  throw new Error('Unsupported model');
}
```

## Промпты для дебатов

```typescript
// lib/prompts.ts
export const ROLE_PROMPTS = {
  proponent: {
    name: "Сторонник",
    systemPrompt: `Ты участвуешь в дебатах как сторонник темы. 
    Твоя задача - защищать и развивать тезис, приводить аргументы в его пользу.
    Будь логичным, используй факты и примеры.`
  },
  critic: {
    name: "Критик",
    systemPrompt: `Ты участвуешь в дебатах как критик темы.
    Твоя задача - находить слабые места в аргументах, предлагать альтернативные взгляды.
    Будь конструктивным и аргументированным.`
  }
};

export function generateRoundPrompt(
  topic: string,
  round: number,
  totalRounds: number,
  previousMessages: string[]
): string {
  const isFirstRound = round === 1;
  const isLastRound = round === totalRounds;
  
  return `
Тема дебатов: "${topic}"
Раунд ${round} из ${totalRounds}

${isFirstRound ? 'Представь свою позицию по теме.' : 
  `Предыдущие аргументы:\n${previousMessages.join('\n\n')}`}

${isLastRound ? 'Сделай заключительное заявление.' : 
  'Развивай свою аргументацию, отвечай на доводы оппонента.'}

Ограничение: максимум 300 слов.`;
}
```

## API endpoints

### Создание дебатов
```typescript
// app/api/debates/route.ts
export async function POST(request: Request) {
  const config = await request.json();
  // Валидация конфигурации
  // Создание записи в БД с помощью debateDb.create()
  // Возврат ID дебатов
  return Response.json({ debateId });
}
```

### Генерация сообщений
```typescript
// app/api/messages/route.ts
export async function POST(request: Request) {
  const { debateId, round } = await request.json();
  // Получение дебата и предыдущих сообщений из БД
  // Генерация промптов с помощью generateRoundPrompt()
  // Параллельная генерация ответов для обеих моделей
  // Сохранение в БД с помощью messageDb.create()
  // Возврат сгенерированных сообщений
}
```

### Завершение дебатов
```typescript
// app/api/debates/[id]/complete/route.ts
export async function POST(request: Request, { params }) {
  const { id } = await params;
  // Обновление статуса дебата на 'completed'
  // Установка времени завершения
  debateDb.updateStatus(debateId, 'completed', 'finished_at');
}
```

## Ключевые особенности MVP

1. **Без аутентификации** - все дебаты сохраняются локально
2. **Простая БД** - SQLite для хранения истории
3. **Две модели** - GPT-4o Mini и Gemini 2.5 Flash
4. **Базовые роли** - Сторонник и Критик
5. **Настраиваемые параметры**:
   - Количество раундов (1-10)
   - Температура генерации (0.2-1.0)
   - Максимальная длина ответа
6. **История дебатов** - страница со списком всех проведенных дебатов
7. **Примеры тем** - возможность выбрать случайную тему из списка

## Расширение функциональности

После MVP можно добавить:

- Больше моделей (Claude, Llama, GPT-4o, Gemini 2.0 Pro)
- Экспорт дебатов в Markdown/PDF
- Более сложные роли (Модератор, Эксперт, Скептик)
- Режим турнира между несколькими моделями
- Оценка качества аргументов
- Интеграция с внешними источниками данных

## Тестирование

```bash
# Запуск с тестовыми API ключами
OPENAI_API_KEY=test GOOGLE_API_KEY=test npm run dev

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

## Важные замечания

1. API ключи хранятся в `.env.local` и не коммитятся
2. База данных создается автоматически при первом запуске
3. Все дебаты сохраняются локально в `debates.db`
4. Приложение работает полностью офлайн после загрузки