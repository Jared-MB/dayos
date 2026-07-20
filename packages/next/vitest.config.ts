import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Against the core's source and not its `dist`: this way the adapter's
    // tests don't depend on the core being built, and a change in the core
    // shows up here without going through a build.
    alias: {
      "@dayos/core": new URL("../core/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
