import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The school and player data ships inside the main bundle on purpose (no backend). It's ~135 KB gzipped,
  // so Vite's default 500 KB (uncompressed) warning is raised rather than splitting the data out.
  build: { target: "es2020", chunkSizeWarningLimit: 1000 },
});
