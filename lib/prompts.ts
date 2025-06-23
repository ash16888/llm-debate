import { RoleType, RolePrompt } from '@/types/debate';

export const ROLE_PROMPTS: Record<RoleType, RolePrompt> = {
  proponent: {
    name: "Сторонник",
    systemPrompt: `Ты участвуешь в дебатах как СТОРОННИК утверждения, представленного в теме. 
    
КРИТИЧЕСКИ ВАЖНО: 
- Ты ПОДДЕРЖИВАЕШЬ и ЗАЩИЩАЕШЬ тезис, заявленный в теме дебатов
- Если тема утверждает что-то негативное - ты доказываешь, что это правда
- Если тема утверждает что-то позитивное - ты доказываешь, что это правда
- Твои ответы должны быть не более 3 предложений!

УЧЕТ КОНТЕКСТА:
- ВНИМАТЕЛЬНО читай всю историю дебатов, которая будет предоставлена
- ОТВЕЧАЙ на конкретные аргументы оппонента, а не игнорируй их
- РАЗВИВАЙ свою линию аргументации с учетом уже сказанного
- ССЫЛАЙСЯ на предыдущие тезисы, когда это усиливает твою позицию

Каждый ответ - это 1-3 мощных аргумента В ПОДДЕРЖКУ темы дебатов.`,
    description: "защитник тезиса, который развивает и обосновывает основную идею"
  },
  
  critic: {
    name: "Критик",
    systemPrompt: `Ты участвуешь в дебатах как КРИТИК утверждения, представленного в теме.
    
КРИТИЧЕСКИ ВАЖНО:
- Ты ОСПАРИВАЕШЬ и ОПРОВЕРГАЕШЬ тезис, заявленный в теме дебатов
- Если тема утверждает что-то негативное - ты доказываешь, что это неправда или преувеличение
- Если тема утверждает что-то позитивное - ты находишь слабые стороны и опровергаешь
- Твои ответы должны быть не более 3 предложений!

УЧЕТ КОНТЕКСТА:
- ВНИМАТЕЛЬНО читай всю историю дебатов, которая будет предоставлена
- АТАКУЙ конкретные слабые места в аргументах оппонента
- НЕ ПОВТОРЯЙ уже использованные контраргументы
- УГЛУБЛЯЙ критику с каждым раундом, находя новые уязвимости

Каждый ответ - это 1-3 точных контраргумента ПРОТИВ темы дебатов.`,
    description: "критический мыслитель, который проверяет идеи на прочность"
  }
};

export function generateRoundPrompt(
  topic: string,
  round: number,
  totalRounds: number,
  previousMessages: string[],
  role: RoleType
): string {
  const isFirstRound = round === 1;
  const isLastRound = round === totalRounds;
  
  let prompt = `Тема дебатов: "${topic}"\n`;
  prompt += `Раунд ${round} из ${totalRounds}\n\n`;
  
  if (isFirstRound) {
    prompt += `Это первый раунд дебатов. Представь свою позицию по теме.\n`;
    prompt += `Изложи свои основные аргументы ясно и структурированно.\n`;
  } else {
    // Для длинных дебатов используем суммаризацию
    const isLongDebate = previousMessages.length > 8;
    let messagesForPrompt = previousMessages;
    
    if (isLongDebate) {
      const { summary, keyArguments } = summarizeDebateHistory(previousMessages);
      
      // Добавляем информацию о ключевых аргументах
      if (keyArguments.proponent.length > 0 || keyArguments.critic.length > 0) {
        prompt += `📌 КЛЮЧЕВЫЕ АРГУМЕНТЫ В ДЕБАТАХ:\n`;
        
        if (keyArguments.proponent.length > 0) {
          prompt += `Сторонник: ${keyArguments.proponent.join('; ')}\n`;
        }
        if (keyArguments.critic.length > 0) {
          prompt += `Критик: ${keyArguments.critic.join('; ')}\n`;
        }
        prompt += `\n`;
      }
      
      messagesForPrompt = summary;
    }
    
    // Выделяем последний аргумент оппонента
    const lastOpponentMessage = getLastOpponentMessage(previousMessages, role);
    
    if (lastOpponentMessage) {
      prompt += `🎯 ПОСЛЕДНИЙ АРГУМЕНТ ОППОНЕНТА:\n`;
      prompt += `${lastOpponentMessage}\n\n`;
      prompt += `⚡ НА ЧТО НУЖНО ОТВЕТИТЬ: Обрати внимание на слабые места или сильные стороны этого аргумента.\n\n`;
    }
    
    prompt += `📝 ${isLongDebate ? 'КРАТКАЯ ИСТОРИЯ' : 'ВСЯ ИСТОРИЯ'} ДЕБАТОВ:\n`;
    prompt += `${messagesForPrompt.join('\n\n---\n\n')}\n\n`;
    
    if (isLastRound) {
      prompt += `🏁 Это заключительный раунд. Подведи итоги дискуссии.\n`;
      prompt += `Сделай сильное заключительное заявление, обобщив свою позицию и ответив на ключевые аргументы.\n`;
    } else {
      prompt += `💡 ТВОЯ ЗАДАЧА:\n`;
      prompt += `1. Ответь на последний аргумент оппонента\n`;
      prompt += `2. Развивай свою линию аргументации\n`;
      prompt += `3. Приведи новые факты или примеры\n`;
    }
  }
  
  prompt += `\n⚠️ ОГРАНИЧЕНИЕ: Твой ответ должен быть не более 3 предложений! Каждое предложение должно быть емким и сильным.`;
  
  return prompt;
}

// Вспомогательная функция для получения последнего аргумента оппонента
function getLastOpponentMessage(messages: string[], currentRole: RoleType): string | null {
  if (messages.length === 0) return null;
  
  // Определяем роль оппонента
  const opponentRole = currentRole === 'proponent' ? 'Критик' : 'Сторонник';
  
  // Ищем последнее сообщение оппонента
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].includes(opponentRole)) {
      // Извлекаем только текст сообщения (после первого переноса строки)
      const lines = messages[i].split('\n');
      return lines.slice(1).join('\n').trim();
    }
  }
  
  return null;
}

// Функция для форматирования истории сообщений
export function formatMessageHistory(messages: Array<{
  model: string;
  role: string;
  content: string;
  round: number;
}>): string[] {
  return messages.map((msg) => {
    const roleLabel = ROLE_PROMPTS[msg.role as RoleType]?.name || msg.role;
    return `${roleLabel} (${msg.model}, Раунд ${msg.round}):\n${msg.content}`;
  });
}

// Функция для суммаризации длинных дебатов
export function summarizeDebateHistory(
  messages: string[],
  maxMessages: number = 6
): { summary: string[]; keyArguments: { proponent: string[]; critic: string[] } } {
  if (messages.length <= maxMessages) {
    return { 
      summary: messages, 
      keyArguments: { proponent: [], critic: [] } 
    };
  }
  
  // Оставляем первые 2 и последние 4 сообщения
  const summary = [
    ...messages.slice(0, 2),
    `[... ${messages.length - maxMessages} сообщений пропущено для краткости ...]`,
    ...messages.slice(-4)
  ];
  
  // Извлекаем ключевые аргументы из пропущенной части
  const keyArguments = extractKeyArguments(messages.slice(2, -4));
  
  return { summary, keyArguments };
}

// Извлечение ключевых аргументов из истории
function extractKeyArguments(messages: string[]): { proponent: string[]; critic: string[] } {
  const keyArguments = {
    proponent: [] as string[],
    critic: [] as string[]
  };
  
  messages.forEach(msg => {
    // Простое извлечение первого предложения как ключевого аргумента
    const firstSentence = msg.split(/[.!?]/)[0]?.trim();
    if (firstSentence) {
      if (msg.includes('Сторонник')) {
        keyArguments.proponent.push(firstSentence);
      } else if (msg.includes('Критик')) {
        keyArguments.critic.push(firstSentence);
      }
    }
  });
  
  // Оставляем только уникальные аргументы
  keyArguments.proponent = [...new Set(keyArguments.proponent)].slice(0, 3);
  keyArguments.critic = [...new Set(keyArguments.critic)].slice(0, 3);
  
  return keyArguments;
}

// Функция для выделения главных тезисов в сообщении
export function highlightKeyPoints(message: string): string {
  // Разбиваем на предложения
  const sentences = message.split(/(?<=[.!?])\s+/);
  
  // Помечаем ключевые слова-индикаторы
  const keyIndicators = [
    'главное', 'важно', 'ключевой', 'основной', 'факт', 
    'доказывает', 'опровергает', 'следовательно', 'потому что'
  ];
  
  return sentences.map(sentence => {
    const hasKeyIndicator = keyIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    );
    
    return hasKeyIndicator ? `**${sentence}**` : sentence;
  }).join(' ');
}

// Примеры тем для дебатов
export const DEBATE_TOPICS_EXAMPLES = [
  "Искусственный интеллект заменит большинство человеческих профессий в ближайшие 20 лет",
  "Социальные сети приносят больше вреда, чем пользы современному обществу",
  "Базовый безусловный доход - необходимость для будущего экономики",
  "Освоение космоса должно быть приоритетом человечества",
  "Генетическая модификация человека этически оправдана",
  "Криптовалюты заменят традиционные деньги",
  "Удаленная работа эффективнее офисной",
  "Университетское образование устарело в эпоху интернета"
];