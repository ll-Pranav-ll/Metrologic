import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

export default defineConfig(
  mergeConfig(baseConfig, {
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  }),
);
