import { test, expect } from "@playwright/test";
import { tokens } from "./helpers";
import { openNote } from "./helpers";

test.describe("Smart templates", () => {
  test("loading HF Admission Note wires pre-resolved tokens", async ({ page }) => {
    await openNote(page);

    await page
      .locator('select[title="Load a smart template"]')
      .selectOption({ label: "HF Admission Note" });

    // Title updates to the template name.
    await expect(page.getByRole("heading", { name: "HF Admission Note" })).toBeVisible();

    // The template drops many live-wired tokens already resolved.
    await expect.poll(() => tokens(page).count()).toBeGreaterThanOrEqual(8);
    const joined = (await tokens(page).allInnerTexts()).join(" | ");
    expect(joined).toContain("Furosemide");
    expect(joined).toContain("BNP");
    expect(joined).toContain("HFrEF");
  });
});
