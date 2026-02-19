import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import federation from "@originjs/vite-plugin-federation";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const rootDir = import.meta.dirname ?? process.cwd();

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    federation({
      name: "eco_release_manager_remote",
      filename: "remoteEntry.js",
      exposes: {
        "./App": path.resolve(rootDir, "client/src/App.tsx"),
      },
      shared: ["react", "react-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "client", "src"),
      "@shared": path.resolve(rootDir, "shared"),
      "@assets": path.resolve(rootDir, "attached_assets"),
    },
  },
  root: path.resolve(rootDir, "client"),
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
});
