import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Run unit and integration tests; exclude Playwright e2e tests.
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],

    // Use jsdom for React component and DOM-related tests.
    environment: "jsdom",

    // Global setup file: extends expect with @testing-library/jest-dom matchers.
    setupFiles: ["./tests/setup.ts"],

    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["app/**", "lib/**", "components/**"],
      exclude: ["**/*.spec.ts", "**/*.test.ts", "node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      // Stub out Next.js server-only guard so Vitest can import server modules.
      "server-only": resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
});
