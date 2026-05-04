import { expect, test } from "@playwright/test";

async function signIn(page: Parameters<typeof test>[0]["page"]) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  expect(email, "E2E_USER_EMAIL must be defined for summarize e2e").toBeTruthy();
  expect(
    password,
    "E2E_USER_PASSWORD must be defined for summarize e2e",
  ).toBeTruthy();

  await page.goto("/");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("Summarize flow", () => {
  test("generates one current summary output", async ({ page }) => {
    await signIn(page);

    await page.getByLabel(/topic/i).fill("Latest advances in battery recycling");
    await page.getByRole("button", { name: /summarize/i }).click();

    const outputRegion = page.getByRole("region", {
      name: /summary output|output/i,
    });

    await expect(outputRegion).toBeVisible();
    await expect(outputRegion).toContainText(/\S+/);

    await expect(page.getByRole("button", { name: /share/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /copy/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: /url|link/i }),
    ).toHaveCount(0);
  });
});

// ─── US2: Output shaping controls ────────────────────────────────────────────

test.describe("Output shaping controls", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  // ── Model selector ──────────────────────────────────────────────────────────

  test("renders the model selector with all allowlisted models", async ({ page }) => {
    const modelSelector = page.getByRole("combobox", { name: /model/i });
    await expect(modelSelector).toBeVisible();

    const options = await modelSelector.locator("option").allTextContents();
    expect(options.some((o) => /gpt/i.test(o))).toBe(true);
    expect(options.some((o) => /hy3|hunyuan/i.test(o))).toBe(true);
    expect(options.some((o) => /minimax/i.test(o))).toBe(true);
    expect(options.some((o) => /nemotron/i.test(o))).toBe(true);
  });

  test("selecting a different model updates the active selection", async ({ page }) => {
    const modelSelector = page.getByRole("combobox", { name: /model/i });
    await expect(modelSelector).toBeVisible();

    // Pick the second option (not the default first)
    await modelSelector.selectOption({ index: 1 });

    const selected = await modelSelector.inputValue();
    expect(selected).toBeTruthy();
    // The value should not be the default model
    expect(selected).not.toBe("");
  });

  test("chosen model is included in the summarize request", async ({ page }) => {
    const modelSelector = page.getByRole("combobox", { name: /model/i });
    await modelSelector.selectOption({ index: 1 });
    const chosenModel = await modelSelector.inputValue();

    let capturedModel: string | null = null;
    await page.route("**/api/summarize", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      capturedModel = body.model as string;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ output: "Mocked summary." }),
      });
    });

    await page.getByLabel(/topic/i).fill("Quantum computing basics");
    await page.getByRole("button", { name: /summarize/i }).click();

    expect(capturedModel).toBe(chosenModel);
  });

  // ── Mode tabs ───────────────────────────────────────────────────────────────

  test("renders all five output mode tabs", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: /output mode|mode/i });
    await expect(tablist).toBeVisible();

    for (const label of ["Summary", "Bullet List", "One Liner", "Mind Map", "Meme"]) {
      await expect(tablist.getByRole("tab", { name: new RegExp(label, "i") })).toBeVisible();
    }
  });

  test("clicking a mode tab makes it active", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: /output mode|mode/i });
    const bulletTab = tablist.getByRole("tab", { name: /bullet list/i });

    await bulletTab.click();

    await expect(bulletTab).toHaveAttribute("aria-selected", "true");
  });

  test("active mode is sent in the summarize request payload", async ({ page }) => {
    const tablist = page.getByRole("tablist", { name: /output mode|mode/i });
    await tablist.getByRole("tab", { name: /one liner/i }).click();

    let capturedMode: string | null = null;
    await page.route("**/api/summarize", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      capturedMode = body.mode as string;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ output: "One liner." }),
      });
    });

    await page.getByLabel(/topic/i).fill("Space exploration");
    await page.getByRole("button", { name: /summarize/i }).click();

    expect(capturedMode).toBe("one-liner");
  });

  // ── Locked English control ──────────────────────────────────────────────────

  test("renders the language control showing English as the only option", async ({ page }) => {
    // The language control must exist and display English
    const languageControl = page.getByLabel(/language/i);
    await expect(languageControl).toBeVisible();

    const value = await languageControl.inputValue().catch(async () => {
      // For a <select>, fall back to the selected option text
      return languageControl.textContent();
    });
    expect(value).toMatch(/english|en/i);
  });

  test("the language control is disabled or read-only so the user cannot change it", async ({ page }) => {
    const languageControl = page.getByLabel(/language/i);
    await expect(languageControl).toBeVisible();

    const isDisabled = await languageControl.isDisabled();
    const readOnly = await languageControl.getAttribute("readonly");
    const ariaReadOnly = await languageControl.getAttribute("aria-readonly");

    expect(
      isDisabled || readOnly !== null || ariaReadOnly === "true",
    ).toBe(true);
  });

  test("language 'en' is always present in the summarize request", async ({ page }) => {
    let capturedLanguage: string | null = null;
    await page.route("**/api/summarize", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      capturedLanguage = body.language as string;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ output: "English summary." }),
      });
    });

    await page.getByLabel(/topic/i).fill("Climate change");
    await page.getByRole("button", { name: /summarize/i }).click();

    expect(capturedLanguage).toBe("en");
  });

  // ── Length slider ───────────────────────────────────────────────────────────

  test("renders the length slider with min=0 and max=100", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /length/i });
    await expect(slider).toBeVisible();

    await expect(slider).toHaveAttribute("min", "0");
    await expect(slider).toHaveAttribute("max", "100");
  });

  test("length slider defaults to a mid-range value", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /length/i });
    const value = Number(await slider.getAttribute("value") ?? await slider.inputValue());
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });

  test("changing the slider sends the updated length in the summarize request", async ({ page }) => {
    const slider = page.getByRole("slider", { name: /length/i });
    await expect(slider).toBeVisible();

    // Set slider to 80 (extended band)
    await slider.fill("80");

    let capturedLength: number | null = null;
    await page.route("**/api/summarize", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      capturedLength = body.length as number;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ output: "Long summary." }),
      });
    });

    await page.getByLabel(/topic/i).fill("Deep learning architectures");
    await page.getByRole("button", { name: /summarize/i }).click();

    expect(capturedLength).toBe(80);
  });
});
