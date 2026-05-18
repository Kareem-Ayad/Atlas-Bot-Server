import express, { Express } from "express";
import { fetchRepositoryFiles, fetchUserRepositories, fetchRepositoryBranches, fetchRepositoryMetadata } from "./github";
import { createTask, getTasks, getModels, getTaskLogs, getUserSession, updateUserSession } from "./db";
import { taskQueue } from "./queue";

export function setupRoutes(app: Express) {
  const router = express.Router();


  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/models", async (req, res) => {
    try {
      const { getEnrichedModels } = await import("./modelRegistry");
      const models = await getEnrichedModels();
      res.json(models);
    } catch(e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch models" });
    }
  });

  // Fetch tasks
  router.get("/tasks", async (req, res) => {
    try {
      const tasks = await getTasks();
      res.json(tasks);
    } catch(e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch tasks" });
    }
  });

  // Fetch task logs
  router.get("/tasks/:id/logs", async (req, res) => {
    try {
      const logs = await getTaskLogs(req.params.id);
      res.json(logs);
    } catch(e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch task logs" });
    }
  });

  // Task generation API
  router.post("/tasks/execute", async (req, res) => {
    const { title, description, modelId, repository, branch } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Missing title or description" });

    try {
      const task = await createTask(title, description, repository, branch);

      // Add task to async execution queue
      await taskQueue.add({ taskId: task.id, modelId });
      
      res.json(task);
    } catch (e: any) {
       res.status(500).json({ error: e.message || "Execution error" });
    }
  });

  // Github endpoints
  router.get("/github/repos", async (req, res) => {
    try {
      const repos = await fetchUserRepositories();
      res.json(repos);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch user repositories" });
    }
  });

  router.get("/github/repos/:owner/:repo/branches", async (req, res) => {
    const { owner, repo } = req.params;
    try {
      const branches = await fetchRepositoryBranches(owner, repo);
      res.json(branches);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch repository branches" });
    }
  });

  router.get("/github/repos/:owner/:repo", async (req, res) => {
    const { owner, repo } = req.params;
    try {
      const metadata = await fetchRepositoryMetadata(owner, repo);
      res.json(metadata);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch repository metadata" });
    }
  });

  router.get("/github/session", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
      const session = await getUserSession(userId as string);
      res.json(session || {});
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch session" });
    }
  });

  router.post("/github/session", async (req, res) => {
    const { userId, selected_repo, selected_branch } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
      const session = await updateUserSession(userId, { selected_repo, selected_branch });
      res.json(session);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to update session" });
    }
  });

  // Github file fetcher
  router.get("/github/files", async (req, res) => {
    const { owner, repo, path, ref } = req.query;
    if (!owner || !repo) {
      return res.status(400).json({ error: "Missing owner or repo" });
    }
    
    try {
      const files = await fetchRepositoryFiles(owner as string, repo as string, path as string || "", ref as string);
      res.json(files);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to fetch GitHub files" });
    }
  });

  app.use("/api", router);
}


