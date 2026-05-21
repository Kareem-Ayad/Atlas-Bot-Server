import { getModels, Model as DbModel } from "./db";

export interface OllamaModel {
  id: string;
  name: string;
}

let ollamaModelCache: OllamaModel[] = [];
let lastFetchTime = 0;

export const FALLBACK_CHAIN = [
  "qwen2.5-coder",
  "llama3.2",
  "llama3.1",
  "mistral",
  "gemma2",
  "deepseek-coder:1.3b"
];

export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  const now = Date.now();
  // Cache for 1 hour
  if (ollamaModelCache.length > 0 && now - lastFetchTime < 60 * 60 * 1000) {
    return ollamaModelCache;
  }

  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
    // Using the OpenAI compatibility endpoint to get list of models: /v1/models
    const res = await fetch(`${baseUrl}/models`);
    if (!res.ok) throw new Error("Failed to fetch Ollama models");
    
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      ollamaModelCache = data.data;
      lastFetchTime = now;
      return ollamaModelCache;
    }
  } catch (error) {
    console.error("Ollama fetch error:", error);
  }
  
  return ollamaModelCache;
}

export async function getEnrichedModels(): Promise<DbModel[]> {
  const [dbModels, oModels] = await Promise.all([
    getModels(),
    fetchOllamaModels()
  ]);

  // If we couldn't fetch from Ollama, just return DB models
  if (oModels.length === 0) return dbModels;

  const validModelIds = new Set(oModels.map(m => m.id));

  // Merge and update availability
  const enrichedModels = dbModels.map(model => ({
    ...model,
    is_available: validModelIds.has(model.id)
  }));
  
  // Add fallback chain dynamically to our list if they aren't in DB
  for (const fallback of FALLBACK_CHAIN) {
     if (!enrichedModels.find(m => m.id === fallback)) {
        if (validModelIds.has(fallback)) {
           const orm = oModels.find(m => m.id === fallback);
           enrichedModels.push({
             id: fallback,
             name: orm?.name || fallback,
             provider: 'Ollama',
             category: 'Auto-Fallback',
             cost_indicator: 'Free',
             is_default: false,
             is_available: true
           });
        }
     }
  }

  return enrichedModels;
}

export async function getValidModel(preferredModelId: string): Promise<string> {
  const models = await fetchOllamaModels();
  
  // Check if preferred model exists and is available
  if (models.length > 0) {
    const isPreferredAvailable = models.some(m => m.id === preferredModelId);
    if (isPreferredAvailable) {
      return preferredModelId;
    }
  }

  for (const fallback of FALLBACK_CHAIN) {
    if (fallback === preferredModelId) continue;
    
    if (models.length > 0) {
      const isAvailable = models.some(m => m.id === fallback);
      if (isAvailable) return fallback;
    } else {
      return fallback;
    }
  }

  return "llama3.2";
}
