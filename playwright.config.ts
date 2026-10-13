import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  use: { baseURL: "http://127.0.0.1:3100", viewport: { width: 1440, height: 900 } },
  webServer: { command: "npm run dev -- --port 3100 --hostname 127.0.0.1", url: "http://127.0.0.1:3100", reuseExistingServer: true, timeout: 120_000 },
});
