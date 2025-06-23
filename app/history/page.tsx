import Link from 'next/link';
import { debateDb } from '@/lib/db';
import { ROLE_PROMPTS } from '@/lib/prompts';

export default function HistoryPage() {
  const debates = debateDb.getAll();
  
  return (
    <div className="py-8 max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">История дебатов</h1>
      
      {debates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">Пока нет проведенных дебатов</p>
          <Link
            href="/"
            className="text-blue-500 hover:underline"
          >
            Создать первый дебат
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {debates.map((debate) => (
            <Link
              key={debate.id}
              href={`/debate/${debate.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{debate.topic}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {debate.model1} ({ROLE_PROMPTS[debate.role1].name})
                </span>
                <span>vs</span>
                <span>
                  {debate.model2} ({ROLE_PROMPTS[debate.role2].name})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className={`
                  px-2 py-1 rounded
                  ${debate.status === 'completed' 
                    ? 'bg-green-100 text-green-700'
                    : debate.status === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                  }
                `}>
                  {debate.status === 'completed' ? '✅ Завершен' : 
                   debate.status === 'active' ? '▶️ Активен' : '📝 Черновик'}
                </span>
                <span className="text-gray-500">
                  {new Date(debate.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}