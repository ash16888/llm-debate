import { NextRequest, NextResponse } from 'next/server';
import { DebateConfig } from '@/types/debate';
import { debateDb } from '@/lib/db';
import { checkAPIKeys } from '@/lib/llm-providers';

export async function POST(request: NextRequest) {
  try {
    const config: DebateConfig = await request.json();
    
    // Валидация
    if (!config.topic || config.topic.length < 20 || config.topic.length > 500) {
      return NextResponse.json(
        { error: 'Тема должна содержать от 20 до 500 символов' },
        { status: 400 }
      );
    }
    
    if (config.role1 === config.role2) {
      return NextResponse.json(
        { error: 'Модели должны иметь разные роли' },
        { status: 400 }
      );
    }
    
    // Проверка наличия API ключей
    const apiKeys = checkAPIKeys();
    if ((config.model1 === 'gpt-4o' || config.model2 === 'gpt-4o') && !apiKeys.openai) {
      return NextResponse.json(
        { error: 'OpenAI API ключ не настроен' },
        { status: 400 }
      );
    }
    
    if ((config.model1 === 'gemini-2.5-flash' || config.model2 === 'gemini-2.5-flash') && !apiKeys.google) {
      return NextResponse.json(
        { error: 'Google API ключ не настроен' },
        { status: 400 }
      );
    }
    
    // Создаем дебат в БД
    const debateId = debateDb.create({
      topic: config.topic,
      model1: config.model1,
      model2: config.model2,
      role1: config.role1,
      role2: config.role2,
      rounds: config.rounds || 5
    });
    
    // Обновляем статус и время начала
    debateDb.updateStatus(debateId, 'active', 'started_at');
    
    return NextResponse.json({ debateId });
  } catch (error) {
    console.error('Error creating debate:', error);
    return NextResponse.json(
      { error: 'Ошибка создания дебатов' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const debates = debateDb.getAll();
    return NextResponse.json({ debates });
  } catch (error) {
    console.error('Error fetching debates:', error);
    return NextResponse.json(
      { error: 'Ошибка получения списка дебатов' },
      { status: 500 }
    );
  }
}