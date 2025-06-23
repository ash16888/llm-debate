import { NextRequest, NextResponse } from 'next/server';
import { debateDb } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debateId = parseInt(id);
    
    // Проверяем существование дебатов
    const debate = debateDb.getById(debateId);
    if (!debate) {
      return NextResponse.json(
        { error: 'Дебаты не найдены' },
        { status: 404 }
      );
    }
    
    // Обновляем статус
    debateDb.updateStatus(debateId, 'completed', 'finished_at');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing debate:', error);
    return NextResponse.json(
      { error: 'Ошибка завершения дебатов' },
      { status: 500 }
    );
  }
}