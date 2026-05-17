import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { classifyLead } from "./leadClassifier";
import { getLeadsToClassify } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // ─── Lead classifier scheduler ────────────────────────────────────────────
  const CLASSIFIER_INTERVAL_MS = 5 * 60 * 1000; // 5min
  const CLASSIFIER_INACTIVITY_MIN = 10; // lead "encerrado" após 10min sem msg

  async function runClassifierTick(): Promise<void> {
    try {
      const ids = await getLeadsToClassify(CLASSIFIER_INACTIVITY_MIN);
      if (ids.length === 0) return;
      console.log(`[classifier] tick: processing ${ids.length} lead(s)`);
      for (const id of ids) {
        await classifyLead(id);
      }
    } catch (err) {
      console.error("[classifier] tick failed:", err);
    }
  }

  // Roda 30s após o boot pra processar backlog, depois a cada 5min
  setTimeout(runClassifierTick, 30_000);
  setInterval(runClassifierTick, CLASSIFIER_INTERVAL_MS);
}

startServer().catch(console.error);
