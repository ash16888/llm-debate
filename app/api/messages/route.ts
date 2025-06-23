import { NextRequest, NextResponse } from 'next/server';
import { debateDb, messageDb } from '@/lib/db';
import { generateResponse } from '@/lib/llm-providers';
import { ROLE_PROMPTS, generateRoundPrompt, formatMessageHistory } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const { debateId, round } = await request.json();
    
    console.log(`[API] Generating messages for debate ${debateId}, round ${round}`);
    
    // Получаем информацию о дебатах
    const debate = debateDb.getById(debateId);
    if (!debate) {
      return NextResponse.json(
        { error: 'Дебаты не найдены' },
        { status: 404 }
      );
    }
    
    if (debate.status === 'completed') {
      return NextResponse.json(
        { error: 'Дебаты уже завершены' },
        { status: 400 }
      );
    }
    
    // Получаем историю сообщений
    const previousMessages = messageDb.getByDebateId(debateId);
    
    // Проверяем, есть ли уже сообщения для этого раунда
    const existingRoundMessages = previousMessages.filter(m => m.round === round);
    if (existingRoundMessages.length >= 2) {
      console.log(`[API] Messages for round ${round} already exist, returning existing`);
      return NextResponse.json({ messages: existingRoundMessages });
    }
    
    const formattedHistory = formatMessageHistory(previousMessages);
    
    // Генерируем ответы для обеих моделей
    const messages = [];
    
    // Первая модель
    const prompt1 = generateRoundPrompt(
      debate.topic,
      round,
      debate.rounds,
      formattedHistory,
      debate.role1
    );
    
    const response1 = await generateResponse({
      model: debate.model1,
      prompt: prompt1,
      systemPrompt: ROLE_PROMPTS[debate.role1].systemPrompt,
      temperature: 0.7,
      maxTokens: 500
    });
    
    const messageId1 = messageDb.create({
      debateId,
      round,
      model: debate.model1,
      role: debate.role1,
      content: response1
    });
    
    messages.push({
      id: messageId1,
      debateId,
      round,
      model: debate.model1,
      role: debate.role1,
      content: response1,
      createdAt: new Date().toISOString()
    });
    
    // Добавляем ответ первой модели к истории для второй
    formattedHistory.push(`${ROLE_PROMPTS[debate.role1].name} (${debate.model1}, Раунд ${round}):\n${response1}`);
    
    // Вторая модель
    const prompt2 = generateRoundPrompt(
      debate.topic,
      round,
      debate.rounds,
      formattedHistory,
      debate.role2
    );
    
    const response2 = await generateResponse({
      model: debate.model2,
      prompt: prompt2,
      systemPrompt: ROLE_PROMPTS[debate.role2].systemPrompt,
      temperature: 0.7,
      maxTokens: 500
    });
    
    const messageId2 = messageDb.create({
      debateId,
      round,
      model: debate.model2,
      role: debate.role2,
      content: response2
    });
    
    messages.push({
      id: messageId2,
      debateId,
      round,
      model: debate.model2,
      role: debate.role2,
      content: response2,
      createdAt: new Date().toISOString()
    });
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error generating messages:', error);
    return NextResponse.json(
      { error: 'Ошибка генерации сообщений' },
      { status: 500 }
    );
  }
}