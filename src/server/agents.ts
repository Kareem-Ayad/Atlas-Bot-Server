import { generateText } from "ai";
import { getModel } from "./ai";
import { addTaskLog, updateTaskStatus, Task } from "./db";

// Background worker setup for executing a task pipeline.
// In a production environment with multiple nodes, use a system like BullMQ or Redis.
// Here we use an async fire-and-forget pipeline to support concurrent tasks in the background.

export async function executePipeline(task: Task, chosenModelId: string) {
  const modelId = chosenModelId || "mistralai/mistral-7b-instruct:free";

  try {
    await updateTaskStatus(task.id, 'planning', modelId);

    // 1. Planner Agent
    const repoContext = task.repository ? ` Target Repository: ${task.repository}.` : "";
    const branchContext = task.branch ? ` Target Branch: ${task.branch}.` : "";
    const plannerPrompt = `You are the Planner Agent. The user wants this task: "${task.title}: ${task.description}".${repoContext}${branchContext} Broken down into 3 clear technical steps. Output only the steps.`;
    const plannerRes = await runAgent(plannerPrompt, modelId);
    await addTaskLog(task.id, 'planner', modelId, `Planning output for ${task.repository || 'default repo'} on branch ${task.branch || 'default'}:\n${plannerRes}`);

    // 2. Coder Agent
    await updateTaskStatus(task.id, 'coding');
    const coderPrompt = `You are the Coder Agent. Using the plan:\n${plannerRes}\nGenerate a high-level patch or code structure for this task. Focus on core logic.`;
    const coderRes = await runAgent(coderPrompt, modelId);
    await addTaskLog(task.id, 'coder', modelId, `Coding output:\n${coderRes}`);

    // 3. Reviewer Agent
    await updateTaskStatus(task.id, 'reviewing');
    const reviewerPrompt = `You are the Reviewer Agent. Review this code:\n${coderRes}\nProvide 2 specific feedback points.`;
    const reviewerRes = await runAgent(reviewerPrompt, modelId);
    await addTaskLog(task.id, 'reviewer', modelId, `Reviewer output:\n${reviewerRes}`);

    // 4. Tester Agent
    await updateTaskStatus(task.id, 'testing');
    const testerPrompt = `You are the Tester Agent. Based on:\n${coderRes}\nWrite a short test strategy for this feature.`;
    const testerRes = await runAgent(testerPrompt, modelId);
    await addTaskLog(task.id, 'tester', modelId, `Tester output:\n${testerRes}`);

    // 5. Finalize
    await updateTaskStatus(task.id, 'pending_approval');
    await addTaskLog(task.id, 'refactor', modelId, `Task pipeline completed successfully. Waiting for manual approval.`);

  } catch (err: any) {
    console.error("Pipeline error for task", task.id,":", err);
    await updateTaskStatus(task.id, 'failed');
    await addTaskLog(task.id, 'planner', modelId, `ERROR FAIL: ${err?.message || 'Unknown error'}`);
  }
}

async function runAgent(prompt: string, modelId: string): Promise<string> {
  const model = getModel(modelId);
  const { text } = await generateText({
    model,
    prompt: prompt,
  });
  return text;
}
