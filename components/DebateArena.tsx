'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Debate, Message } from '@/types/debate';
import MessageBubble from './MessageBubble';
import { ROLE_PROMPTS } from '@/lib/prompts';

interface DebateArenaProps {
  debate: Debate;
  initialMessages?: Message[];
}

export default function DebateArena({ debate, initialMessages = [] }: DebateArenaProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentRound, setCurrentRound] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');
  const generatingRoundRef = useRef<number | null>(null);

  // Генерация следующего хода
  const generateNextTurn = useCallback(async () => {
    if (isPaused || isGenerating || currentRound > debate.rounds) {
      return;
    }
    
    // Проверяем, не генерируется ли уже этот раунд
    if (generatingRoundRef.current === currentRound) {
      console.log(`Already generating round ${currentRound}, skipping`);
      return;
    }

    generatingRoundRef.current = currentRound;
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: debate.id,
          round: currentRound
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации сообщений');
      }

      const { messages: newMessages } = await response.json();
      
      // Добавляем новые сообщения с анимацией
      for (const msg of newMessages) {
        setMessages(prev => {
          // Проверяем на дубликаты по id
          if (prev.some(m => m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
        // Небольшая задержка между сообщениями для эффекта
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Проверяем, закончились ли раунды
      if (currentRound >= debate.rounds) {
        // Обновляем статус дебатов
        await fetch(`/api/debates/${debate.id}/complete`, {
          method: 'POST'
        });
      } else {
        setCurrentRound(prev => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsGenerating(false);
      // Сбрасываем ref только после полного завершения
      if (generatingRoundRef.current === currentRound) {
        generatingRoundRef.current = null;
      }
    }
  }, [debate.id, debate.rounds, currentRound, isPaused, isGenerating]);

  // Автоматический запуск генерации
  useEffect(() => {
    const expectedMessages = currentRound > 1 ? (currentRound - 1) * 2 : 0;
    const hasMessagesForCurrentRound = messages.some(m => m.round === currentRound);
    
    if (!isPaused && !isGenerating && currentRound <= debate.rounds && 
        messages.length === expectedMessages && !hasMessagesForCurrentRound) {
      generateNextTurn();
    }
  }, [currentRound, debate.rounds, generateNextTurn, isGenerating, isPaused, messages]);

  // Проверка завершения дебатов
  const isCompleted = currentRound > debate.rounds || debate.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{debate.topic}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{debate.model1} ({ROLE_PROMPTS[debate.role1].name})</span>
          <span>vs</span>
          <span>{debate.model2} ({ROLE_PROMPTS[debate.role2].name})</span>
          <span>•</span>
          <span>Раунд {Math.min(currentRound, debate.rounds)} из {debate.rounds}</span>
        </div>
      </div>

      {/* Контролы */}
      <div className="mb-6 flex items-center gap-4">
        {!isCompleted && (
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            {isPaused ? '▶️ Продолжить' : '⏸️ Пауза'}
          </button>
        )}
        
        {isGenerating && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Генерация ответа...</span>
          </div>
        )}
        
        {isCompleted && (
          <span className="text-green-600 font-medium">✅ Дебаты завершены</span>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Сообщения */}
      <div className="space-y-4 mb-8">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            model={message.model}
            role={message.role}
            content={message.content}
            round={message.round}
            isLeft={message.model === debate.model1}
          />
        ))}
      </div>

      {/* Статистика */}
      {isCompleted && messages.length > 0 && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Статистика дебатов</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">{debate.model1} ({ROLE_PROMPTS[debate.role1].name})</h3>
              <p className="text-sm text-gray-600">
                Сообщений: {messages.filter(m => m.model === debate.model1).length}
              </p>
              <p className="text-sm text-gray-600">
                Средняя длина: {Math.round(
                  messages
                    .filter(m => m.model === debate.model1)
                    .reduce((acc, m) => acc + m.content.split(' ').length, 0) /
                  messages.filter(m => m.model === debate.model1).length
                )} слов
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">{debate.model2} ({ROLE_PROMPTS[debate.role2].name})</h3>
              <p className="text-sm text-gray-600">
                Сообщений: {messages.filter(m => m.model === debate.model2).length}
              </p>
              <p className="text-sm text-gray-600">
                Средняя длина: {Math.round(
                  messages
                    .filter(m => m.model === debate.model2)
                    .reduce((acc, m) => acc + m.content.split(' ').length, 0) /
                  messages.filter(m => m.model === debate.model2).length
                )} слов
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}