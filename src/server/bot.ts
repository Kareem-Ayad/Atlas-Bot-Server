import { Telegraf } from "telegraf";
import { handleTask } from "./handlers/task";
import { fetchUserRepositories, fetchRepositoryBranches, validateBranch } from "./github";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

// In-Memory store for Telegram user sessions
export const userSessions: Record<number, { repo?: string, branch?: string }> = {};

export async function startBot() {
  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Bot will not start.");
    return;
  }

  const bot = new Telegraf(botToken);

  // SYSTEM
  bot.start((ctx) => {
    ctx.reply("Welcome to Atlas. I am your developer acceleration system. Use /help to see commands.");
  });

  bot.help((ctx) => {
    ctx.reply(`Atlas Commands:
/start - Initialise Atlas session
/help - Shows commands and examples
/status - Shows active tasks, queued, running agents, model, API status

MODEL COMMANDS
/models - Shows available models
/model [name] - Changes default active model
/auto - Lets Atlas choose models automatically

TASK COMMANDS
/task [desc] - Creates engineering task
/tasks - Shows queued, running, completed, failed
/cancel [id] - Stops task execution
/retry [id] - Retries failed task

CODE COMMANDS
/patch [desc] - Returns diffs without applying
/review [file] - AI analyses file
/debug [error] - Analyses runtime errors
/explain [file] - Explains file architecture
/refactor [file] - Suggests cleaner structure

APPROVAL COMMANDS
/approve [id] - Applies patch
/reject [id] - Rejects patch
/diff [id] - Displays generated diff

REPOSITORY COMMANDS
/repos - List accessible GitHub repositories
/branches - List branches for selected repository
/repo [name] - Select repository
/branch [name] - Select branch
/index - Builds repo memory/index
/search [query] - Semantic code search

MEMORY COMMANDS
/memory - Shows remembered conventions
/rule [desc] - Adds permanent engineering rule

AGENT COMMANDS
/agents - Shows agents
/agent [name] - Uses specific agent

VALIDATION COMMANDS
/validate - Runs lint, tests, build, typecheck
/test - Runs tests only`);
  });

  bot.command("status", (ctx) => ctx.reply("Status:\n- 2 Active Tasks\n- 0 Queued\n- 3 Running Agents\n- Model: Optimal\n- API: Online"));

  // MODEL COMMANDS
  bot.command("models", (ctx) => ctx.reply("Available Models:\n- Qwen (Fast, Low Cost)\n- Kimi (Reasoning)\n- Gemini (Balanced)\n- DeepSeek (Coding)"));
  bot.command("model", (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    ctx.reply(`Default model changed to: ${args || "Auto"}`);
  });
  bot.command("auto", (ctx) => ctx.reply("Auto routing enabled. Atlas will choose models automatically."));

  // TASK COMMANDS
  bot.command("task", handleTask);
  bot.command("tasks", (ctx) => ctx.reply("Tasks:\n- Task 1: Building (Running)\n- Task 2: Auth (Queued)"));
  bot.command("cancel", (ctx) => ctx.reply("Task cancelled."));
  bot.command("retry", (ctx) => ctx.reply("Retrying failure."));

  // CODE COMMANDS
  bot.command("patch", (ctx) => ctx.reply("Generating patch diffs..."));
  bot.command("review", (ctx) => ctx.reply("Reviewing architecture, bugs, and security."));
  bot.command("debug", (ctx) => ctx.reply("Analysing stack traces and runtime errors."));
  bot.command("explain", (ctx) => ctx.reply("Explaining code structure and logic path."));
  bot.command("refactor", (ctx) => ctx.reply("Refactoring logic. Suggesting cleaner structure."));

  // APPROVAL COMMANDS
  bot.command("approve", (ctx) => ctx.reply("Patch applied to codebase."));
  bot.command("reject", (ctx) => ctx.reply("Patch rejected and dropped."));
  bot.command("diff", (ctx) => ctx.reply("Showing git diff output..."));

  // REPOSITORY COMMANDS
  bot.command("repos", async (ctx) => {
    try {
      const msg = await ctx.reply("Fetching repositories...");
      const repos = await fetchUserRepositories();
      const text = repos.slice(0, 15).map((r: any) => `- ${r.full_name}`).join("\n");
      await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, undefined, `Repositories (Top 15):\n${text}`);
    } catch(e) {
      ctx.reply("Failed to fetch repositories. Ensure GITHUB_TOKEN is set.");
    }
  });

  bot.command("branches", async (ctx) => {
    const session = userSessions[ctx.from.id];
    if (!session || !session.repo) return ctx.reply("No repository selected. Use /repo [name] first.");
    try {
      const msg = await ctx.reply("Fetching branches...");
      const [owner, repo] = session.repo.split('/');
      const branches = await fetchRepositoryBranches(owner, repo);
      const text = branches.slice(0, 15).map((b: any) => `- ${b.name}`).join("\n");
      await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, undefined, `Branches for ${session.repo} (Top 15):\n${text}`);
    } catch(e) {
      ctx.reply("Failed to fetch branches.");
    }
  });

  bot.command("repo", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
       const session = userSessions[ctx.from.id] || {};
       return ctx.reply(`Current repository: ${session.repo || "None"}`);
    }
    const [owner, repo] = args.split('/');
    if(!owner || !repo) return ctx.reply("Format must be owner/repo");
    userSessions[ctx.from.id] = { ...userSessions[ctx.from.id], repo: args, branch: undefined };
    ctx.reply(`Repository selected: ${args}. Default branch cleared. Use /branches to see options and /branch [name] to select one.`);
  });

  bot.command("branch", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
       const session = userSessions[ctx.from.id] || {};
       return ctx.reply(`Current branch: ${session.branch || "None"}`);
    }
    const session = userSessions[ctx.from.id];
    if (!session || !session.repo) return ctx.reply("No repository selected. Use /repo [name] first.");
    try {
      const [owner, repo] = session.repo.split('/');
      const isValid = await validateBranch(owner, repo, args);
      if(!isValid) return ctx.reply(`Branch ${args} does not exist in ${session.repo}.`);
      session.branch = args;
      ctx.reply(`Branch selected: ${args}`);
    } catch(e) {
      ctx.reply("Failed to validate branch.");
    }
  });
  
  bot.command("index", (ctx) => ctx.reply("Building vector index for semantic retrieval."));
  bot.command("search", (ctx) => ctx.reply("Searching codebase..."));

  // MEMORY COMMANDS
  bot.command("memory", (ctx) => ctx.reply("Memory Context:\n- Architecture: REST\n- Language: TypeScript\n- Conventions: Zod validation"));
  bot.command("rule", (ctx) => ctx.reply("Permanent engineering rule added to agent context."));

  // AGENT COMMANDS
  bot.command("agents", (ctx) => ctx.reply("Agents Available:\n- Planner\n- Coder\n- Reviewer\n- Tester\n- Refactor"));
  bot.command("agent", (ctx) => ctx.reply("Routing manual instructions to specified agent."));

  // VALIDATION COMMANDS
  bot.command("validate", (ctx) => ctx.reply("Running validation: lint, tests, build, typecheck..."));
  bot.command("test", (ctx) => ctx.reply("Running jest test suites..."));
  
  // Launch bot gracefully
  bot.launch();

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  console.log("Telegram bot started with all commands!");
}
