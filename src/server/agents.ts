import { generateText } from "ai";
import { getModel } from "./ai";
import { addTaskLog, updateTaskStatus, Task } from "./db";
import { sendMessage } from "./bot";
import { getValidModel, FALLBACK_CHAIN } from "./modelRegistry";
import { fetchRepoContext } from "./github";

export const AGENT_MODELS = {
  planner: "gemini-2.5-pro",
  coder: "deepseek-coder",
  reviewer: "claude-4.7",
  tester: "claude-4.7",
  experiment: "qwen2.5-coder"
};

async function notifyProgress(task: Task, text: string) {
  if (task.chat_id) {
    await sendMessage(task.chat_id, `[Task: ${task.id.slice(0, 8)}]\n${text}`);
  }
}

// Background worker setup for executing a task pipeline.
// In a production environment with multiple nodes, use a system like BullMQ or Redis.
// Here we use an async fire-and-forget pipeline to support concurrent tasks in the background.

export async function executePipeline(task: Task, chosenModelId?: string) {
  let primaryModel = chosenModelId || AGENT_MODELS.planner;

  try {
    await updateTaskStatus(task.id, 'planning', primaryModel);
    await notifyProgress(task, "Task started! 🏃");
    
    let repoContext = "";
    if (task.repository && task.branch) {
      const [owner, repo] = task.repository.split('/');
      repoContext = await fetchRepoContext(owner, repo, task.branch);
    }

    // 1. Planner Agent
    const plannerPrompt = `${repoContext}\nYou are the Planner Agent. The user wants this task: "${task.title}: ${task.description}". Target Repository: ${task.repository || 'None'}. Target Branch: ${task.branch || 'None'}. Broken down into 3 clear technical steps. Output only the steps.`;
    const { text: plannerRes, modelUsed: plannerModel, usage: plannerUsage } = await runAgentWithFallback(plannerPrompt, AGENT_MODELS.planner, task);
    await addTaskLog(task.id, 'planner', plannerModel, `Planning output for ${task.repository || 'default repo'} on branch ${task.branch || 'default'}:\n${plannerRes}`, plannerUsage);
    await notifyProgress(task, "Planner agent finished. ✅");

    // 2. Coder Agent
    await updateTaskStatus(task.id, 'coding');
    const coderPrompt = `${repoContext}\nYou are the Coder Agent. Using the plan:\n${plannerRes}\nGenerate a high-level patch or code structure for this task. Focus on core logic.`;
    const { text: coderRes, modelUsed: coderModel, usage: coderUsage } = await runAgentWithFallback(coderPrompt, AGENT_MODELS.coder, task);
    await addTaskLog(task.id, 'coder', coderModel, `Coding output:\n${coderRes}`, coderUsage);
    await notifyProgress(task, "Coding agent finished. ✅");

    // 3. Reviewer Agent
    await updateTaskStatus(task.id, 'reviewing');
    const reviewerPrompt = `You are the Reviewer Agent. Review this code:\n${coderRes}\nProvide 2 specific feedback points.`;
    const { text: reviewerRes, modelUsed: reviewerModel, usage: reviewerUsage } = await runAgentWithFallback(reviewerPrompt, AGENT_MODELS.reviewer, task);
    await addTaskLog(task.id, 'reviewer', reviewerModel, `Reviewer output:\n${reviewerRes}`, reviewerUsage);
    await notifyProgress(task, "Reviewer agent finished. ✅");

    // 4. Tester Agent
    await updateTaskStatus(task.id, 'testing');
    const testerPrompt = `You are the Tester Agent. Based on:\n${coderRes}\nWrite a short test strategy for this feature.`;
    const { text: testerRes, modelUsed: testerModel, usage: testerUsage } = await runAgentWithFallback(testerPrompt, AGENT_MODELS.tester, task);
    await addTaskLog(task.id, 'tester', testerModel, `Tester output:\n${testerRes}`, testerUsage);
    await notifyProgress(task, "Tester agent finished. ✅");

    // 5. Finalize
    await updateTaskStatus(task.id, 'completed', primaryModel);
    await addTaskLog(task.id, 'refactor', primaryModel, `Task pipeline completed successfully.`);
    await notifyProgress(task, `Task completed successfully! 🎉\n\nPlanner:\n${plannerRes}\n\nTasks are waiting for review in the dashboard.`);

  } catch (err: any) {
    console.error("Pipeline error for task", task.id,":", err);
    await updateTaskStatus(task.id, 'failed', primaryModel);
    await addTaskLog(task.id, 'planner', primaryModel, `ERROR FAIL: ${err?.message || 'Unknown error'}`);
    await notifyProgress(task, `⚠️ Task failed:\n${err?.message || 'Unknown error'}`);
  }
}

async function runAgentWithFallback(prompt: string, initialModelId: string, task: Task): Promise<{ text: string, modelUsed: string, usage: { inputTokens: number, outputTokens: number } }> {
  let currentModelId = initialModelId;
  const attemptedModels = new Set<string>();
  
  while (true) {
    try {
      const model = getModel(currentModelId);
      const { text, usage } = await generateText({
        model,
        prompt: prompt,
        maxRetries: 1, // Only 1 internal retry, then we handle fallbacks
      });
      return { 
        text, 
        modelUsed: currentModelId,
        usage: {
           inputTokens: (usage as any)?.promptTokens || 0,
           outputTokens: (usage as any)?.completionTokens || 0
        }
      };
    } catch (e: any) {
      attemptedModels.add(currentModelId);
      console.warn(`Model ${currentModelId} failed during execution:`, e?.message);
      
      let nextModel = null;
      for (const fb of FALLBACK_CHAIN) {
        if (!attemptedModels.has(fb)) {
           nextModel = fb;
           break;
        }
      }
      
      if (!nextModel) {
        throw new Error(`All fallback models exhausted. Last error: ${e?.message}`);
      }
      
      await notifyProgress(task, `Primary model unavailable.\nSwitched to ${nextModel}.`);
      currentModelId = nextModel;
    }
  }
}
