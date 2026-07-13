import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/pollinations": {
        target: "https://gen.pollinations.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pollinations/, ""),
      },
    },
  },
});
