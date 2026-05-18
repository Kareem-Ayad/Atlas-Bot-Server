import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// In-Memory Fallback structure
export type TaskStatus = 'pending' | 'queued' | 'running' | 'planning' | 'coding' | 'reviewing' | 'testing' | 'pending_approval' | 'completed' | 'failed' | 'cancelled';
export type AgentRole = 'planner' | 'coder' | 'reviewer' | 'tester' | 'refactor';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  model_used?: string;
  repository?: string;
  branch?: string;
  chat_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  agent_role: AgentRole;
  model_used: string;
  content: string;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  category: string;
  cost_indicator: string;
  is_default: boolean;
  is_available?: boolean;
}

const memoryDb = {
  tasks: [] as Task[],
  taskLogs: [] as TaskLog[],
  models: [
    { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B Instruct', provider: 'Meta', category: 'Coding', cost_indicator: 'Free', is_default: true },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct', provider: 'Mistral', category: 'Reasoning', cost_indicator: 'Free', is_default: false },
    { id: 'google/gemma-7b-it:free', name: 'Gemma 7B IT', provider: 'Google', category: 'Fast', cost_indicator: 'Free', is_default: false },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', provider: 'Qwen', category: 'Coding', cost_indicator: 'Free', is_default: false },
  ] as Model[]
};

export async function getModels(): Promise<Model[]> {
  if (supabase) {
    const { data, error } = await supabase.from('models').select('*');
    if (!error && data && data.length > 0) return data;
  }
  return memoryDb.models;
}

export async function createTask(title: string, description: string, repository?: string, branch?: string, chat_id?: string): Promise<Task> {
  const newTask: Task = {
    id: uuidv4(),
    title,
    description,
    repository,
    branch,
    chat_id,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
    if (error) console.error("DB Error creating task:", error);
    if (data) return data;
  }

  memoryDb.tasks.push(newTask);
  return newTask;
}

export async function updateTaskStatus(id: string, status: TaskStatus, model_used?: string): Promise<void> {
  if (supabase) {
    await supabase.from('tasks').update({ status, model_used, updated_at: new Date().toISOString() }).eq('id', id);
    return;
  }
  const task = memoryDb.tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    if (model_used) task.model_used = model_used;
    task.updated_at = new Date().toISOString();
  }
}

export async function getTasks(): Promise<Task[]> {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  return [...memoryDb.tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getTask(id: string): Promise<Task | null> {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (!error && data) return data;
  }
  return memoryDb.tasks.find(t => t.id === id) || null;
}

export async function addTaskLog(task_id: string, agent_role: AgentRole, model_used: string, content: string): Promise<TaskLog> {
  const log: TaskLog = {
    id: uuidv4(),
    task_id,
    agent_role,
    model_used,
    content,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { data, error } = await supabase.from('task_logs').insert([log]).select().single();
    if (error) console.error("DB Error creating log:", error);
    if (data) return data;
  }

  memoryDb.taskLogs.push(log);
  return log;
}

export async function getTaskLogs(task_id: string): Promise<TaskLog[]> {
  if (supabase) {
    const { data, error } = await supabase.from('task_logs').select('*').eq('task_id', task_id).order('created_at', { ascending: true });
    if (!error && data) return data;
  }
  return memoryDb.taskLogs.filter(l => l.task_id === task_id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export interface UserSession {
  user_id: string;
  selected_repo?: string;
  selected_branch?: string;
}

const memoryUserSessions: UserSession[] = [];

export async function getUserSession(userId: string): Promise<UserSession | null> {
  if (supabase) {
    const { data, error } = await supabase.from('user_sessions').select('*').eq('user_id', userId).single();
    if (!error && data) return data;
  }
  return memoryUserSessions.find(s => s.user_id === userId) || null;
}

export async function updateUserSession(userId: string, data: Partial<UserSession>): Promise<UserSession> {
  const updateData = { ...data, updated_at: new Date().toISOString() };
  
  if (supabase) {
    const { data: existing } = await supabase.from('user_sessions').select('*').eq('user_id', userId).single();
    if (existing) {
       const { data: updated, error } = await supabase.from('user_sessions').update(updateData).eq('user_id', userId).select().single();
       if (!error && updated) return updated;
    } else {
       const { data: inserted, error } = await supabase.from('user_sessions').insert([{ user_id: userId, ...updateData }]).select().single();
       if (!error && inserted) return inserted;
    }
  }

  let session = memoryUserSessions.find(s => s.user_id === userId);
  if (!session) {
    session = { user_id: userId, ...data };
    memoryUserSessions.push(session);
  } else {
    Object.assign(session, data);
  }
  return session;
}

