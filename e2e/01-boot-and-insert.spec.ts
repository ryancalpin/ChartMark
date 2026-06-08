import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, tokens, tokenWithText, expectPaletteOpen } from "./helpers";

test.describe("Boot + basic token insertion", () => {
  test("app boots with the seeded progress-note skeleton", async ({ page }) => {
    await openNote(page);
    await expect(page.getByRole("heading", { name: "Subjective" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Objective" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assessment & Plan" })).toBeVisible();
    // Lifecycle starts in draft.
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign note" })).toBeVisible();
    // Patient banner resolved from the chart.
    await expect(page.getByText("MRN WFB-0042-1138")).toBeVisible();
  });

  test("typing @ opens the palette and Enter inserts a live token", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @potassium");
    await expectPaletteOpen(page);

    await page.keyboard.press("Enter");

    await expect(tokenWithText(page, "Potassium").first()).toBeVisible();
    // Palette dismissed after insert.
    await expect(page.getByText("Tab:", { exact: false })).toBeHidden();
  });

  test("Escape dismisses the palette without inserting", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @potassium");
    await expectPaletteOpen(page);
    await page.keyboard.press("Escape");

    await expect(page.getByText("Tab:", { exact: false })).toBeHidden();
    await expect(tokens(page)).toHaveCount(0);
  });
});
