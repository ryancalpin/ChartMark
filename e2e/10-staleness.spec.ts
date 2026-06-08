import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken } from "./helpers";

test.describe("Staleness", () => {
  // Weight was measured 6h ago; the vital staleness threshold is 4h.
  test("@weight renders a stale badge", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "weight");

    await expect(page.locator(".cm-token-host", { hasText: "stale" })).toBeVisible();
  });

  test("a stale token raises a 'Stale data' flag at sign time", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "weight");

    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText(/Review before signing/)).toBeVisible();
    await expect(page.getByText("Stale data", { exact: true })).toBeVisible();
  });
});
