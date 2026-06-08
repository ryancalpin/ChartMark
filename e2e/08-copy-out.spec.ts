import { test, expect } from "@playwright/test";
import { EDITOR, openNote, focusEditorEnd, insertToken } from "./helpers";

test.describe("Copy-out flattens tokens to clean plain text", () => {
  test("selecting all and copying yields prose + token values, no metadata", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "k");

    await page.locator(EDITOR).click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("ControlOrMeta+c");

    const clip = await page.evaluate(() => navigator.clipboard.readText());

    // Note prose and the token's value both survive.
    expect(clip).toContain("acute decompensated heart failure");
    expect(clip).toContain("Potassium");
    // None of the token's internal provenance metadata leaks into plain text.
    expect(clip).not.toContain("draftValue");
    expect(clip).not.toContain("lockState");
    expect(clip).not.toContain("fhirResourceId");
    expect(clip).not.toContain("data-attrs");
  });
});
