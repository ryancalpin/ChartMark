import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokenWithText } from "./helpers";

test.describe("Consult linked token", () => {
  test("@nephrology shows a hover summary card, then opens the detail panel", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "nephrology");

    const chip = tokenWithText(page, "Nephrology").first().getByRole("button");
    await expect(chip).toBeVisible();

    // Hovering surfaces a one-line summary card so the reader needn't open the note.
    await chip.hover();
    await expect(page.getByText("Cardiorenal syndrome", { exact: false })).toBeVisible();
    await expect(page.getByText("Click to open detail panel", { exact: false })).toBeVisible();

    // Clicking opens the full consult record in the side panel.
    await chip.click();
    const panel = page.locator("aside");
    await expect(panel.getByRole("heading", { name: "Detail" })).toBeVisible();
    await expect(panel.getByText("Nephrology Consult", { exact: true })).toBeVisible();
    await expect(panel.getByText("cardiorenal", { exact: false }).first()).toBeVisible();
  });
});
