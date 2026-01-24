import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_ACTIONS ? "/lorenzo-perrier/" : "/",
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(
      new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
