import { generateText } from "ai";
import { getModel } from "./ai";
import { addTaskLog, updateTaskStatus, Task } from "./db";
import { sendMessage } from "./bot";
import { getValidModel, FALLBACK_CHAIN } from "./modelRegistry";

async function notifyProgress(task: Task, text: string) {
  if (task.chat_id) {
    await sendMessage(task.chat_id, `[Task: ${task.id.slice(0, 8)}]\n${text}`);
  }
}

// Background worker setup for executing a task pipeline.
// In a production environment with multiple nodes, use a system like BullMQ or Redis.
// Here we use an async fire-and-forget pipeline to support concurrent tasks in the background.

export async function executePipeline(task: Task, chosenModelId: string) {
  let pipelineModelId = await getValidModel(chosenModelId || "llama3.2");

  if (pipelineModelId !== chosenModelId && chosenModelId) {
     await notifyProgress(task, `Primary model unavailable.\nSwitched to ${pipelineModelId}.`);
  }

  try {
    await updateTaskStatus(task.id, 'planning', pipelineModelId);
    await notifyProgress(task, "Task started! 🏃");

    // 1. Planner Agent
    const repoContext = task.repository ? ` Target Repository: ${task.repository}.` : "";
    const branchContext = task.branch ? ` Target Branch: ${task.branch}.` : "";
    const plannerPrompt = `You are the Planner Agent. The user wants this task: "${task.title}: ${task.description}".${repoContext}${branchContext} Broken down into 3 clear technical steps. Output only the steps.`;
    const { text: plannerRes, modelUsed: plannerModel } = await runAgentWithFallback(plannerPrompt, pipelineModelId, task);
    pipelineModelId = plannerModel; // Update if changed during execution
    await addTaskLog(task.id, 'planner', pipelineModelId, `Planning output for ${task.repository || 'default repo'} on branch ${task.branch || 'default'}:\n${plannerRes}`);
    await notifyProgress(task, "Planner agent finished. ✅");

    // 2. Coder Agent
    await updateTaskStatus(task.id, 'coding');
    const coderPrompt = `You are the Coder Agent. Using the plan:\n${plannerRes}\nGenerate a high-level patch or code structure for this task. Focus on core logic.`;
    const { text: coderRes, modelUsed: coderModel } = await runAgentWithFallback(coderPrompt, pipelineModelId, task);
    pipelineModelId = coderModel;
    await addTaskLog(task.id, 'coder', pipelineModelId, `Coding output:\n${coderRes}`);
    await notifyProgress(task, "Coding agent finished. ✅");

    // 3. Reviewer Agent
    await updateTaskStatus(task.id, 'reviewing');
    const reviewerPrompt = `You are the Reviewer Agent. Review this code:\n${coderRes}\nProvide 2 specific feedback points.`;
    const { text: reviewerRes, modelUsed: reviewerModel } = await runAgentWithFallback(reviewerPrompt, pipelineModelId, task);
    pipelineModelId = reviewerModel;
    await addTaskLog(task.id, 'reviewer', pipelineModelId, `Reviewer output:\n${reviewerRes}`);
    await notifyProgress(task, "Reviewer agent finished. ✅");

    // 4. Tester Agent
    await updateTaskStatus(task.id, 'testing');
    const testerPrompt = `You are the Tester Agent. Based on:\n${coderRes}\nWrite a short test strategy for this feature.`;
    const { text: testerRes, modelUsed: testerModel } = await runAgentWithFallback(testerPrompt, pipelineModelId, task);
    pipelineModelId = testerModel;
    await addTaskLog(task.id, 'tester', pipelineModelId, `Tester output:\n${testerRes}`);
    await notifyProgress(task, "Tester agent finished. ✅");

    // 5. Finalize
    await updateTaskStatus(task.id, 'completed', pipelineModelId);
    await addTaskLog(task.id, 'refactor', pipelineModelId, `Task pipeline completed successfully.`);
    await notifyProgress(task, `Task completed successfully! 🎉\nModel: ${pipelineModelId}\n\nPlanner:\n${plannerRes}\n\nTasks are waiting for review in the dashboard.`);

  } catch (err: any) {
    console.error("Pipeline error for task", task.id,":", err);
    await updateTaskStatus(task.id, 'failed', pipelineModelId);
    await addTaskLog(task.id, 'planner', pipelineModelId, `ERROR FAIL: ${err?.message || 'Unknown error'}`);
    await notifyProgress(task, `⚠️ Task failed:\n${err?.message || 'Unknown error'}`);
  }
}

async function runAgentWithFallback(prompt: string, initialModelId: string, task: Task): Promise<{ text: string, modelUsed: string }> {
  let currentModelId = initialModelId;
  const attemptedModels = new Set<string>();
  
  while (true) {
    try {
      const model = getModel(currentModelId);
      const { text } = await generateText({
        model,
        prompt: prompt,
        maxRetries: 1, // Only 1 internal retry, then we handle fallbacks
      });
      return { text, modelUsed: currentModelId };
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
