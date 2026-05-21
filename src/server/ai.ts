import { createOpenAI } from "@ai-sdk/openai";

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: process.env.OLLAMA_API_KEY || "ollama",
});

export function getModel(modelId: string) {
  if (!process.env.OLLAMA_API_KEY) {
    console.warn("OLLAMA_API_KEY is not set, defaulting to 'ollama' key.");
  }
  return ollama(modelId);
}
