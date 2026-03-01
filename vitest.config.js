import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/utils/importSQL/__tests__/setup.js"],
  },
});
