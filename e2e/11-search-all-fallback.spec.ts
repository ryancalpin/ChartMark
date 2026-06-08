import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, tokenWithText, expectPaletteOpen } from "./helpers";

test.describe("Empty-category search-all fallback", () => {
  // "penicillin" only matches an allergy; filtering to "medication" yields nothing.
  test("a no-match category offers 'search all chart data', then broadens", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @penicillin");
    await expectPaletteOpen(page);

    // Tab: all → medication. No medication matches "penicillin".
    await page.keyboard.press("Tab");
    await expect(page.getByText("search all chart data", { exact: false })).toBeVisible();

    // Enter on the fallback broadens the category back to "all".
    await page.keyboard.press("Enter");
    await expect(page.getByText("search all chart data", { exact: false })).toBeHidden();

    // The allergy result is now reachable; Enter inserts it.
    await page.keyboard.press("Enter");
    await expect(tokenWithText(page, "Penicillin").first()).toBeVisible();
  });
});
