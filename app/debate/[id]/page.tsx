import { notFound } from 'next/navigation';
import DebateArena from '@/components/DebateArena';
import { debateDb, messageDb } from '@/lib/db';

interface DebatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { id } = await params;
  const debateId = parseInt(id);
  
  // Получаем данные о дебатах
  const debate = debateDb.getById(debateId);
  
  if (!debate) {
    notFound();
  }
  
  // Получаем существующие сообщения
  const messages = messageDb.getByDebateId(debateId);
  
  return (
    <div className="py-8">
      <DebateArena debate={debate} initialMessages={messages} />
    </div>
  );
}