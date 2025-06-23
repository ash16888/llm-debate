import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateResponseParams, ModelType } from '@/types/debate';

// Инициализация провайдеров при первом использовании
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

export async function generateResponse({
  model,
  prompt,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 500
}: GenerateResponseParams): Promise<string> {
  try {
    if (model === 'gpt-4o-mini') {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      });
      
      return response.choices[0]?.message?.content || '';
    } 
    
    else if (model === 'gemini-2.5-flash') {
      const genAI = getGeminiClient();
      const geminiModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        }
      });
      
      // Объединяем system prompt и user prompt для Gemini
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;
      const result = await geminiModel.generateContent(fullPrompt);
      const response = await result.response;
      
      return response.text();
    }
    
    throw new Error(`Unsupported model: ${model}`);
  } catch (error) {
    console.error(`Error generating response with ${model}:`, error);
    throw error;
  }
}

// Функция для проверки доступности API ключей
export function checkAPIKeys(): { openai: boolean; google: boolean } {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GOOGLE_API_KEY
  };
}

// Функция для получения доступных моделей
export function getAvailableModels(): ModelType[] {
  const models: ModelType[] = [];
  const keys = checkAPIKeys();
  
  if (keys.openai) {
    models.push('gpt-4o-mini');
  }
  if (keys.google) {
    models.push('gemini-2.5-flash');
  }
  
  return models;
}