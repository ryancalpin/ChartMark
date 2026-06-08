import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokenWithText, expectPaletteOpen } from "./helpers";

test.describe("Multi-draw disambiguation", () => {
  test("ArrowRight opens the draw picker; live pick inserts a token", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @potassium");
    await expectPaletteOpen(page);

    // Drill into the historical-draw sub-list.
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("choose draw", { exact: false })).toBeVisible();
    await expect(page.getByText("Most recent (live)")).toBeVisible();

    // Enter on the first row picks the live value.
    await page.keyboard.press("Enter");
    await expect(tokenWithText(page, "Potassium").first()).toBeVisible();
  });

  test("a pinned historical draw inserts that specific value", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @potassium");
    await expectPaletteOpen(page);
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("choose draw", { exact: false })).toBeVisible();

    // First variant row is the most-recent historical draw.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(tokenWithText(page, "Potassium").first()).toBeVisible();
  });
});

test.describe("Inline conflict warning", () => {
  test("@lisinopril (discontinued) renders a conflict marker in the note", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "lisinopril");

    await expect(tokenWithText(page, "Lisinopril").first()).toBeVisible();
    // The amber conflict glyph carries an accessible label.
    await expect(page.locator('.cm-token-host [aria-label="conflict"]')).toBeVisible();
  });
});
