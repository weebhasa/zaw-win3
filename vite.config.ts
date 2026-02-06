import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin(), generateQuestionSetsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}

function generateQuestionSetsPlugin(): Plugin {
  return {
    name: "generate-question-sets",
    apply: "build",
    generateBundle() {
      const publicDir = path.resolve(__dirname, "public");
      if (!fs.existsSync(publicDir)) return;

      const files = fs.readdirSync(publicDir);
      const questionSets = files
        .filter(
          (f) =>
            f.endsWith(".json") &&
            !["package.json", "tsconfig.json", "components.json"].includes(f),
        )
        .map((filename) => {
          try {
            const content = fs.readFileSync(
              path.join(publicDir, filename),
              "utf-8",
            );
            const json = JSON.parse(content);
            return {
              filename,
              title: json.title || filename.replace(".json", ""),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      this.emitFile({
        type: "asset",
        fileName: "question-sets.json",
        source: JSON.stringify(questionSets, null, 2),
      });
    },
  };
}
