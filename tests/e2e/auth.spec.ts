import { expect, test } from "@playwright/test";

test.describe("Auth flow", () => {
  test("shows sign-in for protected summarizer access", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("allows email/password sign-in and shows summarize controls", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    expect(email, "E2E_USER_EMAIL must be defined for auth e2e").toBeTruthy();
    expect(
      password,
      "E2E_USER_PASSWORD must be defined for auth e2e",
    ).toBeTruthy();

    await page.goto("/");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("button", { name: /summarize/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });
});
