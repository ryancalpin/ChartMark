import { expect, type Page, type Locator } from "@playwright/test";

/**
 * Shared helpers for driving the ChartMark editor. The app has no test ids, so
 * we lean on the stable DOM contract:
 *   - the ProseMirror mount (`.ProseMirror`)
 *   - the `@` command palette, whose header shows "Tab: <category>"
 *   - token nodes, which the NodeView renders as `span.cm-token-host`
 *     (the React chip — value, icon, conflict glyph — is portaled inside).
 *
 * Note: `data-chart-token` / `data-type` only exist in the schema's `toDOM`
 * (serialization / clipboard), NOT in the live editor DOM. In-editor we match
 * tokens by `.cm-token-host` and assert on their rendered text.
 */

export const EDITOR = ".ProseMirror";

/** Open the note and wait for the seeded skeleton + resolved chart to render. */
export async function openNote(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(EDITOR)).toBeVisible();
  await expect(page.getByText("Type @ to pull live chart data.")).toBeVisible();
  await expect(page.getByText("John Doe")).toBeVisible();
}

/** Place the cursor at the end of the seeded HPI line (a known word boundary). */
export async function focusEditorEnd(page: Page): Promise<void> {
  const para = page.locator(`${EDITOR} p`, { hasText: "acute decompensated" });
  await para.click();
  await page.keyboard.press("End");
}

/** All token nodes currently in the document. */
export function tokens(page: Page): Locator {
  return page.locator(`${EDITOR} .cm-token-host`);
}

/** Token node(s) whose rendered chip contains `text`. */
export function tokenWithText(page: Page, text: string): Locator {
  return page.locator(`${EDITOR} .cm-token-host`, { hasText: text });
}

/** Wait for the `@` palette to be open (its header carries "Tab:"). */
export async function expectPaletteOpen(page: Page): Promise<void> {
  await expect(page.getByText("Tab:", { exact: false })).toBeVisible();
}

/**
 * Type `@query` at the cursor and open the palette. Leaves a leading space so
 * the mention trigger fires at a word boundary. Does NOT press Enter.
 */
export async function openPalette(page: Page, query: string): Promise<void> {
  await page.keyboard.type(` @${query}`);
  await expectPaletteOpen(page);
}

/** Insert the top palette result for `@query`; waits for a new token to mount. */
export async function insertToken(page: Page, query: string): Promise<void> {
  const before = await tokens(page).count();
  await openPalette(page, query);
  await page.keyboard.press("Enter");
  await expect
    .poll(async () => tokens(page).count(), { timeout: 7_000 })
    .toBeGreaterThan(before);
}
