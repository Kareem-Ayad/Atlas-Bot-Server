-- Run this in your Supabase SQL Editor

-- Create enum for task status
CREATE TYPE task_status AS ENUM ('pending', 'queued', 'running', 'planning', 'coding', 'reviewing', 'testing', 'pending_approval', 'completed', 'failed', 'cancelled');

-- Create enum for agent roles
CREATE TYPE agent_role AS ENUM ('planner', 'coder', 'reviewer', 'tester', 'refactor');

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status task_status DEFAULT 'pending',
    model_used TEXT,
    repository TEXT,
    branch TEXT,
    chat_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Logs Table (For tracking agent steps and outputs)
CREATE TABLE task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    agent_role agent_role NOT NULL,
    model_used TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models Registry Table
CREATE TABLE models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_indicator TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false
);

-- Insert Ollama default models
INSERT INTO models (id, name, provider, category, cost_indicator, is_default) VALUES
('llama3.2', 'Llama 3.2', 'Meta', 'General', 'Free', true),
('qwen2.5-coder', 'Qwen 2.5 Coder', 'Qwen', 'Coding', 'Free', false),
('mistral', 'Mistral', 'Mistral', 'Reasoning', 'Free', false),
('deepseek-coder:1.3b', 'DeepSeek Coder 1.3B', 'DeepSeek', 'Coding', 'Free', false);

-- User Sessions Table (Persistent storage for user preferences)
CREATE TABLE user_sessions (
    user_id TEXT PRIMARY KEY, -- Can be Telegram ID or a web user ID
    selected_repo TEXT,
    selected_branch TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

