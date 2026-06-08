import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Builds the app and serves the production bundle via `vite preview`
 * on a fixed port, then drives it in headless Chromium. The live-update demo
 * fires 12s after note open, so the per-test timeout is generous.
 */
const PORT = 4317;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // `list` for live console output; `html` (never auto-opened) is uploaded as a
  // CI artifact so failed runs ship their traces/screenshots for debugging.
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // clipboard-read is needed by the copy-out spec and is Chromium-only.
      use: { ...devices["Desktop Chrome"], permissions: ["clipboard-read", "clipboard-write"] },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
