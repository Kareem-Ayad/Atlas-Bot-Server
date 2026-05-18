import type { Context } from "telegraf";
import { createTask } from "../db";
import { executePipeline } from "../agents";
import { userSessions } from "../bot";

export async function handleTask(ctx: Context) {
  // @ts-expect-error telegraf ctx.message
  const messageText = ctx.message?.text || "";
  const args = messageText.replace("/task", "").trim();

  // @ts-expect-error
  const userId = ctx.from?.id;
  const session = userSessions[userId] || {};

  if (!session.repo) {
    return ctx.reply("Please select a repository first using /repo [name] or /repos to list options.");
  }
  
  if (!session.branch) {
    return ctx.reply("Please select a branch first using /branch [name] or /branches to list options.");
  }

  if (!args) {
    return ctx.reply("Please provide a task description. Example: /task Analyze the src folder.");
  }

  // Acknowledge receipt
  const loadingMessage = await ctx.reply("System: Registering task in queue...");

  try {
    const task = await createTask("Telegram Task", args, session.repo, session.branch);
    const modelId = "meta-llama/llama-3-8b-instruct:free";

    // Start background execution
    executePipeline(task, modelId);
    
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      loadingMessage.message_id,
      undefined,
      `Task registered successfully.
Repository: ${session.repo}
Branch: ${session.branch}
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

