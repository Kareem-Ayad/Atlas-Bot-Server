import { getModels, Model as DbModel } from "./db";

export interface OpenRouterModel {
  id: string;
  name: string;
  endpoints?: string[];
  pricing?: any;
  context_length?: number;
}

let openRouterModelCache: OpenRouterModel[] = [];
let lastFetchTime = 0;

export const FALLBACK_CHAIN = [
  "qwen/qwen-2.5-coder-32b-instruct:free",
  "meta-llama/llama-3-8b-instruct:free",
  "deepseek/deepseek-chat:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2-7b-instruct:free"
];

export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  const now = Date.now();
  // Cache for 1 hour
  if (openRouterModelCache.length > 0 && now - lastFetchTime < 60 * 60 * 1000) {
    return openRouterModelCache;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error("Failed to fetch OpenRouter models");
    
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      openRouterModelCache = data.data;
      lastFetchTime = now;
      return openRouterModelCache;
    }
  } catch (error) {
    console.error("OpenRouter fetch error:", error);
  }
  
  return openRouterModelCache;
}

export async function getEnrichedModels(): Promise<DbModel[]> {
  const [dbModels, orModels] = await Promise.all([
    getModels(),
    fetchOpenRouterModels()
  ]);

  // If we couldn't fetch from OpenRouter, just return DB models
  if (orModels.length === 0) return dbModels;

  const validModelIds = new Set(orModels.map(m => m.id));

  // Merge and update availability
  const enrichedModels = dbModels.map(model => ({
    ...model,
    is_available: validModelIds.has(model.id)
  }));
  
  // Add fallback chain dynamically to our list if they aren't in DB
  for (const fallback of FALLBACK_CHAIN) {
     if (!enrichedModels.find(m => m.id === fallback)) {
        if (validModelIds.has(fallback)) {
           const orm = orModels.find(m => m.id === fallback);
           enrichedModels.push({
             id: fallback,
             name: orm?.name || fallback,
             provider: fallback.split('/')[0] || 'Unknown',
             category: 'Auto-Fallback',
             cost_indicator: fallback.includes('free') ? 'Free' : 'Pro',
             is_default: false,
             is_available: true
           });
        }
     }
  }

  return enrichedModels;
}

export async function getValidModel(preferredModelId: string): Promise<string> {
  const models = await fetchOpenRouterModels();
  
  // Check if preferred model exists and is available
  if (models.length > 0) {
    const isPreferredAvailable = models.some(m => m.id === preferredModelId);
    if (isPreferredAvailable) {
      return preferredModelId;
    }
  }

  // If we couldn't fetch models, we just try the preferred one anyway,
  // or we fallback using our chain.
  for (const fallback of FALLBACK_CHAIN) {
    if (fallback === preferredModelId) continue;
    
    // Check if the fallback is in OpenRouter's current list (if we have it)
    if (models.length > 0) {
      const isAvailable = models.some(m => m.id === fallback);
      if (isAvailable) return fallback;
    } else {
      // If no cache, just return the first fallback
      return fallback;
    }
  }

  // Absolute fallback
  return "mistralai/mistral-7b-instruct:free";
}
