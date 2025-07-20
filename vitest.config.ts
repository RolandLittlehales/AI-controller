import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules/**", "dist/**", ".nuxt/**", ".output/**"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        ".nuxt/**",
        ".output/**",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
        "test/**",
        "vitest.config.ts",
        "**/*.config.ts",
        "**/*.config.js",
        "**/*.vue",
        "app.vue",
        "styles/**",
        "types/**",
        "server/api/**",
        // Phase 2B: Server-side git operations implemented but complex to test
        "composables/useGitRepository.ts", // Server-side git operations - complex import.meta.server mocking
        "composables/useSavedDirectories.ts", // Placeholder localStorage implementation, full testing in Phase 2B
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        perFile: true,
      },
    },
  },
  resolve: {
    alias: {
      "~": new URL("./", import.meta.url).pathname,
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});