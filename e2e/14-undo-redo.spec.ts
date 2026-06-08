import { test, expect } from "@playwright/test";
import { EDITOR, openNote, focusEditorEnd, insertToken, tokens, tokenWithText } from "./helpers";

test.describe("Undo / redo preserves token provenance", () => {
  test("undo removes a token; redo restores it with the same id and value", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "k");

    const token = tokenWithText(page, "Potassium").first();
    await expect(token).toContainText("3.1");
    const id = await token.getAttribute("data-token-id");
    expect(id).toBeTruthy();

    // Undo reverses the insertion entirely.
    await page.locator(EDITOR).press("ControlOrMeta+z");
    await expect(tokens(page)).toHaveCount(0);

    // Redo restores the SAME node — provenance (tokenId + value) rides in the attrs.
    await page.locator(EDITOR).press("ControlOrMeta+Shift+z");
    const restored = tokenWithText(page, "Potassium").first();
    await expect(restored).toBeVisible();
    await expect(restored).toContainText("3.1");
    expect(await restored.getAttribute("data-token-id")).toBe(id);
  });
});
