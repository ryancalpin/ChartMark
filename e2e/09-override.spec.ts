import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokenWithText } from "./helpers";

/** Open the ▾ override editor on a pill token and return the popover locator. */
async function openOverride(page: import("@playwright/test").Page, token: import("@playwright/test").Locator) {
  await token.hover();
  await token.locator('button[title="Override value"]').click();
  const popover = page.locator('[data-token-interactive]', { hasText: "Override value" });
  await expect(popover).toBeVisible();
  return popover;
}

test.describe("Manual override (✎)", () => {
  test("typing a replacement value flags the token and shows it", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "hr"); // HR vital — a pill token with the ▾ affordance

    const popover = await openOverride(page, tokenWithText(page, "HR").first());
    await popover.getByRole("textbox").fill("CONFIRMED-72");
    await popover.getByRole("button", { name: "Save" }).click();

    await expect(tokenWithText(page, "CONFIRMED-72").first()).toBeVisible();
    await expect(page.locator('.cm-token-host [aria-label="overridden"]')).toBeVisible();
  });

  test("an override survives signing", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "hr");

    const popover = await openOverride(page, tokenWithText(page, "HR").first());
    await popover.getByRole("textbox").fill("CONFIRMED-72");
    await popover.getByRole("button", { name: "Save" }).click();
    await expect(tokenWithText(page, "CONFIRMED-72").first()).toBeVisible();

    // Override is an explicit provider choice → no pre-sign drawer, signs silently.
    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
    await expect(tokenWithText(page, "CONFIRMED-72").first()).toBeVisible();
  });

  test("'Use live value' clears the override", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "hr");

    let popover = await openOverride(page, tokenWithText(page, "HR").first());
    await popover.getByRole("textbox").fill("CONFIRMED-72");
    await popover.getByRole("button", { name: "Save" }).click();
    await expect(page.locator('.cm-token-host [aria-label="overridden"]')).toBeVisible();

    // Reopen on the now-overridden token and revert to the live value.
    popover = await openOverride(page, tokenWithText(page, "CONFIRMED-72").first());
    await popover.getByRole("button", { name: "Use live value" }).click();
    await expect(page.locator('.cm-token-host [aria-label="overridden"]')).toBeHidden();
  });
});
