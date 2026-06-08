import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokens, tokenWithText } from "./helpers";

test.describe("Date tokens roll in draft, freeze at signing", () => {
  // Fixture admits the patient 3 days ago → Hospital Day 4, deterministically.
  test("@hospitalday resolves and locks at signing", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "hospitalday");

    const token = tokenWithText(page, "Hospital Day").first();
    await expect(token).toContainText("Hospital Day 4");
    // Draft: live/editable, not yet locked.
    await expect(token.locator('[aria-label="locked"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();

    // Frozen: the resolved value is retained and the lock glyph appears.
    await expect(tokenWithText(page, "Hospital Day").first()).toContainText("Hospital Day 4");
    await expect(page.locator('.cm-token-host [aria-label="locked"]')).toBeVisible();
  });

  test("@today resolves to a formatted calendar date", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "today");

    // e.g. "June 8, 2026" — assert the shape, not a hard-coded date.
    await expect(tokens(page).first()).toContainText(/[A-Z][a-z]+ \d{1,2}, \d{4}/);
  });
});
