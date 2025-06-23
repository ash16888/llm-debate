'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DebateConfig, ModelType, RoleType } from '@/types/debate';
import { ROLE_PROMPTS, DEBATE_TOPICS_EXAMPLES } from '@/lib/prompts';

export default function DebateSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState<DebateConfig>({
    topic: '',
    model1: 'gpt-4o-mini',
    model2: 'gemini-2.5-flash',
    role1: 'proponent',
    role2: 'critic',
    rounds: 5,
    temperature: 0.7,
    maxLength: 300
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Валидация
    if (config.topic.length < 20 || config.topic.length > 500) {
      setError('Тема должна содержать от 20 до 500 символов');
      return;
    }
    
    if (config.role1 === config.role2) {
      setError('Модели должны иметь разные роли');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error('Ошибка создания дебатов');
      }
      
      const { debateId } = await response.json();
      router.push(`/debate/${debateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setIsLoading(false);
    }
  };

  const selectRandomTopic = () => {
    const randomTopic = DEBATE_TOPICS_EXAMPLES[
      Math.floor(Math.random() * DEBATE_TOPICS_EXAMPLES.length)
    ];
    setConfig({ ...config, topic: randomTopic });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Настройка дебатов</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Тема дебатов */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Тема дебатов
          </label>
          <textarea
            value={config.topic}
            onChange={(e) => setConfig({ ...config, topic: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Введите тему для обсуждения..."
            required
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {config.topic.length}/500 символов
            </span>
            <button
              type="button"
              onClick={selectRandomTopic}
              className="text-sm text-blue-500 hover:underline"
            >
              Случайная тема
            </button>
          </div>
        </div>

        {/* Настройки первой модели */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Модель 1
            </label>
            <select
              value={config.model1}
              onChange={(e) => setConfig({ ...config, model1: e.target.value as ModelType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Роль модели 1
            </label>
            <select
              value={config.role1}
              onChange={(e) => setConfig({ ...config, role1: e.target.value as RoleType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="proponent">
                {ROLE_PROMPTS.proponent.name}
              </option>
              <option value="critic">
                {ROLE_PROMPTS.critic.name}
              </option>
            </select>
          </div>
        </div>

        {/* Настройки второй модели */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Модель 2
            </label>
            <select
              value={config.model2}
              onChange={(e) => setConfig({ ...config, model2: e.target.value as ModelType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Роль модели 2
            </label>
            <select
              value={config.role2}
              onChange={(e) => setConfig({ ...config, role2: e.target.value as RoleType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="proponent">
                {ROLE_PROMPTS.proponent.name}
              </option>
              <option value="critic">
                {ROLE_PROMPTS.critic.name}
              </option>
            </select>
          </div>
        </div>

        {/* Количество раундов */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Количество раундов: {config.rounds}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.rounds}
            onChange={(e) => setConfig({ ...config, rounds: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Температура генерации */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Креативность (температура): {config.temperature}
          </label>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Низкие значения = более предсказуемые ответы, высокие = более творческие
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Создание дебатов...' : 'Начать дебаты'}
        </button>
      </form>
    </div>
  );
}