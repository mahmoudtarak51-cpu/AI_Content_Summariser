import { expect, test } from "@playwright/test";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function signIn(page: Parameters<typeof test>[0]["page"]) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  expect(email, "E2E_USER_EMAIL must be defined for pdf-download e2e").toBeTruthy();
  expect(
    password,
    "E2E_USER_PASSWORD must be defined for pdf-download e2e",
  ).toBeTruthy();

  await page.goto("/");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
}

// ─── US3: PDF download button states ─────────────────────────────────────────

test.describe("PDF download — disabled state (no output)", () => {
  test("download button is absent or disabled before any output is generated", async ({
    page,
  }) => {
    await signIn(page);

    const downloadBtn = page.getByRole("button", { name: /download/i });

    // Either the button does not exist yet, or it exists but is disabled.
    const count = await downloadBtn.count();
    if (count > 0) {
      await expect(downloadBtn).toBeDisabled();
    }
    // If count === 0 the button is correctly absent — test passes by design.
  });
});

test.describe("PDF download — enabled state (output present)", () => {
  test.beforeEach(async ({ page }) => {
    // Capture blob sizes when URL.createObjectURL is called (before page load).
    await page.addInitScript(() => {
      const orig = URL.createObjectURL.bind(URL);
      (window as unknown as Record<string, unknown>).__blobSizes = {} as Record<string, number>;
      URL.createObjectURL = function (blob: Blob) {
        const url = orig(blob);
        ((window as unknown as Record<string, unknown>).__blobSizes as Record<string, number>)[url] = blob.size;
        return url;
      };
    });

    await signIn(page);

    // Mock the summarize API so we don't consume real quota.
    await page.route("**/api/summarize", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          output:
            "Solid-state batteries use a solid electrolyte, offering higher energy density and improved safety over lithium-ion cells.",
        }),
      });
    });

    // Generate an output so the download button becomes available.
    await page.getByLabel(/topic/i).fill("Latest advances in solid-state batteries");
    await page.getByRole("button", { name: /summarize/i }).click();

    // Wait for the output panel to show generated content.
    const outputRegion = page.getByRole("region", {
      name: /summary output|output/i,
    });
    await expect(outputRegion).toBeVisible({ timeout: 30_000 });
    await expect(outputRegion).toContainText(/\S+/, { timeout: 30_000 });
  });

  test("download button is enabled after output is generated", async ({ page }) => {
    await expect(page.getByRole("button", { name: /download/i })).toBeEnabled();
  });

  test("clicking the download button triggers a PDF file download", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("topic-summary.pdf");
  });

  test("downloaded file has a non-zero size", async ({ page }) => {
    // The blob size was captured at createObjectURL time via addInitScript.
    const blobSize = await page.evaluate(() => {
      const anchor = document.querySelector<HTMLAnchorElement>(
        'a[download="topic-summary.pdf"]',
      );
      if (!anchor) return 0;
      const sizes = (window as unknown as Record<string, unknown>).__blobSizes as Record<string, number>;
      return sizes?.[anchor.href] ?? 0;
    });
    expect(blobSize).toBeGreaterThan(0);
  });
});
