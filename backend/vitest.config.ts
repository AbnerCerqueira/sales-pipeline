import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "vitest/config";

if (existsSync(".env.test")) {
  loadEnvFile(".env.test");
}

export default defineConfig({
  test: {
    globals: true,
    hookTimeout: 60_000,
    projects: [
      {
        extends: true,
        test: {
          include: ["test/**/unit/**/*.test.ts"],
          name: "unit",
        },
      },
      {
        extends: true,
        test: {
          globalSetup: "test/global-setup.ts",
          include: ["test/**/e2e/**/*.test.ts"],
          name: "e2e",
          setupFiles: ["test/setup-files/database.ts"],
        },
      },
    ],
    testTimeout: 60_000,
  },
});
