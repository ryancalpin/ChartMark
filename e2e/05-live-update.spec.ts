import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, tokenWithText, expectPaletteOpen } from "./helpers";

test.describe("Live chart updates", () => {
  // The scripted timeline repletes potassium (3.1 → 3.6) 12s after note open.
  test("an inserted @k token updates live when the chart changes", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @k");
    await expectPaletteOpen(page);
    await page.keyboard.press("Enter");

    const k = tokenWithText(page, "Potassium").first();
    await expect(k).toContainText("3.1");

    // Wait out the scripted update (fires ~12s after load).
    await expect(k).toContainText("3.6", { timeout: 20_000 });
  });

  test("the live change surfaces as a value-changed flag at sign time", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @k");
    await expectPaletteOpen(page);
    await page.keyboard.press("Enter");

    const k = tokenWithText(page, "Potassium").first();
    await expect(k).toContainText("3.6", { timeout: 20_000 });

    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText(/Review before signing/)).toBeVisible();
    await expect(page.getByText("Value changed", { exact: false })).toBeVisible();
  });
});
