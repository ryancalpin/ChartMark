import { test, expect } from "@playwright/test";
import { openNote, focusEditorEnd, insertToken, tokenWithText } from "./helpers";

test.describe("Linked-token detail panel", () => {
  test("clicking a problem token opens the detail side panel", async ({ page }) => {
    await openNote(page);
    await focusEditorEnd(page);
    await insertToken(page, "hfref");

    const token = tokenWithText(page, "HFrEF").first();
    await expect(token).toBeVisible();
    await token.getByRole("button").click();

    // Scope to the side panel — the linked token's hover tooltip can echo the
    // same summary text (notably on WebKit, which keeps :hover after the click).
    const panel = page.locator("aside");
    await expect(panel.getByRole("heading", { name: "Detail" })).toBeVisible();
    await expect(panel.getByText("Heart failure with reduced ejection fraction")).toBeVisible();
    await expect(panel.getByText("I50.22")).toBeVisible(); // ICD-10

    await page.getByRole("button", { name: "close" }).click();
    await expect(page.getByRole("heading", { name: "Detail" })).toBeHidden();
  });
});

test.describe("Admin overlays", () => {
  test("Metrics dashboard opens and reflects signed notes", async ({ page }) => {
    await openNote(page);
    // Empty state before any signing.
    await page.getByRole("button", { name: "Metrics" }).click();
    await expect(page.getByRole("heading", { name: "Pitch Metrics" })).toBeVisible();
    await expect(page.getByText(/No signed notes yet|Notes signed/)).toBeVisible();
    await page.getByRole("button", { name: "close" }).click();

    // Sign a note, then the dashboard should count it.
    await page.getByRole("button", { name: "Sign note" }).click();
    await expect(page.getByText("Signed", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Metrics" }).click();
    await expect(page.getByText("Notes signed")).toBeVisible();
  });

  test("Audit viewer opens the medicolegal provenance trail", async ({ page }) => {
    await openNote(page);
    await page.getByRole("button", { name: "Audit" }).click();
    await expect(
      page.getByRole("heading", { name: "Admin · Medicolegal Audit Trail" }),
    ).toBeVisible();
    await expect(page.getByText("never shown to providers", { exact: false })).toBeVisible();
  });
});
