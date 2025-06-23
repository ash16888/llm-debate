import Database from 'better-sqlite3';
import path from 'path';
import { Debate, Message } from '@/types/debate';

// Создаем или открываем базу данных
const db = new Database(path.join(process.cwd(), 'debates.db'));

// Инициализация таблиц
export function initializeDatabase() {
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      finished_at DATETIME
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
}

// Инициализируем БД при импорте модуля
initializeDatabase();

// Функции для работы с дебатами
export const debateDb = {
  // Создать новый дебат
  create(debate: Omit<Debate, 'id' | 'createdAt' | 'status'>): number {
    const stmt = db.prepare(`
      INSERT INTO debates (topic, model1, model2, role1, role2, rounds)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      debate.topic,
      debate.model1,
      debate.model2,
      debate.role1,
      debate.role2,
      debate.rounds
    );
    
    return result.lastInsertRowid as number;
  },

  // Получить дебат по ID
  getById(id: number): Debate | undefined {
    const stmt = db.prepare(`
      SELECT 
        id, topic, model1, model2, role1, role2, rounds, status,
        created_at as createdAt, started_at as startedAt, finished_at as finishedAt
      FROM debates 
      WHERE id = ?
    `);
    
    return stmt.get(id) as Debate | undefined;
  },

  // Обновить статус дебата
  updateStatus(id: number, status: string, timestampField?: 'started_at' | 'finished_at') {
    let query = 'UPDATE debates SET status = ?';
    const params: (string | number)[] = [status];
    
    if (timestampField) {
      query += `, ${timestampField} = CURRENT_TIMESTAMP`;
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const stmt = db.prepare(query);
    stmt.run(...params);
  },

  // Получить все дебаты
  getAll(): Debate[] {
    const stmt = db.prepare(`
      SELECT 
        id, topic, model1, model2, role1, role2, rounds, status,
        created_at as createdAt, started_at as startedAt, finished_at as finishedAt
      FROM debates 
      ORDER BY created_at DESC
    `);
    
    return stmt.all() as Debate[];
  }
};

// Функции для работы с сообщениями
export const messageDb = {
  // Добавить сообщение
  create(message: Omit<Message, 'id' | 'createdAt'>): number {
    const stmt = db.prepare(`
      INSERT INTO messages (debate_id, round, model, role, content)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      message.debateId,
      message.round,
      message.model,
      message.role,
      message.content
    );
    
    return result.lastInsertRowid as number;
  },

  // Получить все сообщения дебата
  getByDebateId(debateId: number): Message[] {
    const stmt = db.prepare(`
      SELECT 
        id, debate_id as debateId, round, model, role, content,
        created_at as createdAt
      FROM messages 
      WHERE debate_id = ?
      ORDER BY round ASC, created_at ASC
    `);
    
    return stmt.all(debateId) as Message[];
  },

  // Получить сообщения конкретного раунда
  getByRound(debateId: number, round: number): Message[] {
    const stmt = db.prepare(`
      SELECT 
        id, debate_id as debateId, round, model, role, content,
        created_at as createdAt
      FROM messages 
      WHERE debate_id = ? AND round = ?
      ORDER BY created_at ASC
    `);
    
    return stmt.all(debateId, round) as Message[];
  }
};

export default db;