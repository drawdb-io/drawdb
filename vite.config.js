/* eslint-env node */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  let base = env.VITE_BASE_PATH || "/";
  if (!base.startsWith("/") && !/^https?:\/\//.test(base)) {
    base = `/${base}`;
  }
  if (!base.endsWith("/")) {
    base += "/";
  }

  return {
    base,
    plugins: [react()],
  };
});
