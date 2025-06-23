export type ModelType = 'gpt-4o-mini' | 'gemini-2.5-flash';
export type RoleType = 'proponent' | 'critic';
export type DebateStatus = 'draft' | 'active' | 'completed';

export interface DebateConfig {
  topic: string;
  model1: ModelType;
  model2: ModelType;
  role1: RoleType;
  role2: RoleType;
  rounds: number;
  maxLength?: number;
  temperature?: number;
}

export interface Debate {
  id: number;
  topic: string;
  model1: ModelType;
  model2: ModelType;
  role1: RoleType;
  role2: RoleType;
  rounds: number;
  status: DebateStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface Message {
  id: number;
  debateId: number;
  round: number;
  model: ModelType;
  role: RoleType;
  content: string;
  createdAt: string;
}

export interface RolePrompt {
  name: string;
  systemPrompt: string;
  description?: string;
}

export interface GenerateResponseParams {
  model: ModelType;
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}