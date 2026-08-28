import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { storageGetSignedUrl } from "./storage";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    app.get("/api/storage/*", async (req, res) => {
      try {
        const rawKey = (req.params as Record<string, string>)[0];
        if (!rawKey) return res.status(400).json({ error: "Storage key is required" });
        const key = rawKey.split("/").map(decodeURIComponent).join("/");
        return res.redirect(302, await storageGetSignedUrl(key));
      } catch (error) {
        console.error("[Storage] Signed URL request failed", error);
        return res.status(404).json({ error: "Stored file is unavailable" });
      }
    });
  } else {
    registerStorageProxy(app);
  }
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
