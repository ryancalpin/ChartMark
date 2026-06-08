import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokens, tokenWithText, expectPaletteOpen } from "./helpers";

test.describe("Clinical aliases", () => {
  test("@lasix resolves to the canonical Furosemide order", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "lasix");
    await expect(tokenWithText(page, "Furosemide").first()).toBeVisible();
  });

  test("@k resolves to Potassium", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "k");
    await expect(tokenWithText(page, "Potassium").first()).toBeVisible();
  });

  test("@bp resolves to the blood-pressure vital", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "bp");
    await expect(tokenWithText(page, "142/88").first()).toBeVisible();
  });

  test("@pcn renders the penicillin allergy with its reaction", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "pcn");
    const allergy = tokenWithText(page, "Penicillin").first();
    await expect(allergy).toBeVisible();
    await expect(allergy).toContainText("Anaphylaxis");
  });
});

test.describe("Panel macros", () => {
  test("@bmp expands to separate Potassium / Creatinine / eGFR tokens", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);

    await page.keyboard.type(" @bmp");
    await expectPaletteOpen(page);
    await page.keyboard.press("Enter");

    // The macro fans out into ≥3 tokens.
    await expect.poll(() => tokens(page).count()).toBeGreaterThanOrEqual(3);
    const joined = (await tokens(page).allInnerTexts()).join(" | ");
    expect(joined).toContain("Potassium");
    expect(joined).toContain("Creatinine");
    expect(joined).toContain("eGFR");
  });
});
