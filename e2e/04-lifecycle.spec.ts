import { test, expect } from "@playwright/test";
import { EDITOR, openNote, focusEditorEnd, insertToken, tokensOfType } from "./helpers";

test.describe("Signing + pre-sign review", () => {
  test("a clean note signs silently and locks", async ({ page }) => {
    await openNote(page);
    await page.getByRole("button", { name: "Sign note" }).click();

    // No flagged tokens ⇒ no drawer; goes straight to signed.
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add addendum" })).toBeVisible();
  });

  test("a flagged token opens the review drawer before signing", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "lisinopril"); // discontinued ⇒ fires a trigger

    await page.getByRole("button", { name: "Sign note" }).click();

    const drawer = page.locator("div").filter({ hasText: /Review before signing/ }).last();
    await expect(page.getByText(/Review before signing/)).toBeVisible();
    // The flag's reason chip ("Discontinued") and message both render; match the chip exactly.
    await expect(page.getByText("Discontinued", { exact: true })).toBeVisible();
    await expect(page.getByText("This medication order was discontinued.")).toBeVisible();

    // Acknowledge then sign from inside the drawer.
    await page.getByRole("button", { name: "Acknowledge" }).click();
    await expect(page.getByText("✓ Acknowledged")).toBeVisible();
    await drawer.getByRole("button", { name: "Sign note" }).click();

    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
  });

  test("signed content is immutable (append-only)", async ({ page }) => {
    await openNote(page);
    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();

    const before = await page.locator(EDITOR).innerText();
    // Try to type into the locked body — the lock plugin must reject it.
    await page.locator(`${EDITOR} p`, { hasText: "acute decompensated" }).click();
    await page.keyboard.press("End");
    await page.keyboard.type("XYZZY_SHOULD_NOT_APPEAR");
    await expect(page.locator(EDITOR)).not.toContainText("XYZZY_SHOULD_NOT_APPEAR");
    expect(await page.locator(EDITOR).innerText()).toBe(before);
  });
});

test.describe("Co-signature workflow", () => {
  test("submit for co-sign locks content, then attending finalizes", async ({ page }) => {
    await openNote(page);
    await page.locator("label", { hasText: "Co-sign" }).getByRole("checkbox").check();

    await page.getByRole("button", { name: "Submit for co-sign" }).click();
    await expect(page.getByText("Pending co-sign")).toBeVisible();

    await page.getByRole("button", { name: "Co-sign & finalize" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
  });
});

test.describe("Amendments", () => {
  test("Add addendum appends an attributed, timestamped block", async ({ page }) => {
    await openNote(page);
    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();

    // The addendum reason comes from a window.prompt.
    page.once("dialog", (d) => d.accept("Late result review"));
    await page.getByRole("button", { name: "Add addendum" }).click();

    await expect(page.getByText("1 addendum")).toBeVisible();
    await expect(page.locator(EDITOR)).toContainText("Addendum —");
    await expect(page.locator(EDITOR)).toContainText("Reason: Late result review");
  });
});
