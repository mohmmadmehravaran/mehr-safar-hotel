import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    rollupOptions: {
      // Source HTML entry lives in index.template.html so the built single-file
      // bundle can be published as the repository-root index.html (GitHub Pages).
      input: path.resolve(__dirname, "index.template.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // حذف کامل انیمیشن‌ها: framer-motion با یک shim بدون‌انیمیشن جایگزین می‌شود.
      "framer-motion": path.resolve(__dirname, "src/shims/framer-motion.tsx"),
    },
  },
});
