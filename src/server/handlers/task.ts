import type { Context } from "telegraf";
import { createTask, getUserSession } from "../db";
import { taskQueue } from "../queue";

export async function handleTask(ctx: Context) {
  // @ts-expect-error telegraf ctx.message
  const messageText = ctx.message?.text || "";
  const args = messageText.replace("/task", "").trim();

  const userId = ctx.from?.id?.toString();
  const chatId = ctx.chat?.id?.toString();
  if (!userId) return ctx.reply("System Error: Could not identify user.");
  
  const session = await getUserSession(userId);

  if (!session || !session.selected_repo) {
    return ctx.reply("Please select a repository first using /repo [name] or /repos to list options.");
  }
  
  if (!session.selected_branch) {
    return ctx.reply("Please select a branch first using /branch [name] or /branches to list options.");
  }

  if (!args) {
    return ctx.reply("Please provide a task description. Example: /task Analyze the src folder.");
  }

  // Acknowledge receipt
  const loadingMessage = await ctx.reply("System: Registering task in queue...");

  try {
    const task = await createTask("Telegram Task", args, session.selected_repo, session.selected_branch, chatId);
    const modelId = "meta-llama/llama-3-8b-instruct:free";

    // Start background execution correctly via Queue
    await taskQueue.add({ taskId: task.id, modelId });
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMessage.message_id,
      undefined,
      `Task queued successfully.
Repository: ${session.selected_repo}
Branch: ${session.selected_branch}
Model: ${modelId}
Summary: ${args}`
    );
  } catch (error: any) {
    console.error("Task handling error:", error);
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMessage.message_id,
      undefined,
      `Failed to register task: ${error.message || "Unknown error"}`
    );
  }
}

