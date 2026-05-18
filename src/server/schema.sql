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

-- Insert OpenRouter Free Models
INSERT INTO models (id, name, provider, category, cost_indicator, is_default) VALUES
('meta-llama/llama-3-8b-instruct:free', 'Llama 3 8B Instruct', 'Meta', 'Coding', 'Free', true),
('mistralai/mistral-7b-instruct:free', 'Mistral 7B Instruct', 'Mistral', 'Reasoning', 'Free', false),
('google/gemma-7b-it:free', 'Gemma 7B IT', 'Google', 'Fast', 'Free', false),
('qwen/qwen-2-7b-instruct:free', 'Qwen 2 7B', 'Qwen', 'Coding', 'Free', false);

-- User Sessions Table (Persistent storage for user preferences)
CREATE TABLE user_sessions (
    user_id TEXT PRIMARY KEY, -- Can be Telegram ID or a web user ID
    selected_repo TEXT,
    selected_branch TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

