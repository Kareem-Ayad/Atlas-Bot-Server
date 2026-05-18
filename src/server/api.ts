import express, { Express } from "express";
import { fetchRepositoryFiles, fetchUserRepositories, fetchRepositoryBranches, fetchRepositoryMetadata } from "./github";
import { createTask, getTasks, getModels, getTaskLogs } from "./db";
import { executePipeline } from "./agents";

export function setupRoutes(app: Express) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/models", async (req, res) => {
    try {
      const models = await getModels();
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

      // Start asynchronous heavy pipeline processing
      // We don't await this so the UI gets an immediate response.
      executePipeline(task, modelId);
      
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


