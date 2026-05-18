import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { setupRoutes } from "./src/server/api";
import { startBot } from "./src/server/bot";

const PORT = 3000;

async function startServer() {
  const app = express();
  
  app.use(express.json());

  // Setup API Routes
  setupRoutes(app);

  // Setup Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start the Telegraf bot in the background
  startBot().catch((err) => {
    console.error("Failed to start bot:", err);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
