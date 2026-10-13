import { expect, test } from "@playwright/test";
import { initialState } from "../lib/game";

test("study, earn pieces, unlock a theme, persist across reload", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 13, 10, 0) });
  await page.goto("/");

  await page.getByRole("button", { name: "공부 시작" }).click();
  // 15 minutes = 3 drops of 1–5 pieces each.
  await page.clock.fastForward("15:05");
  await expect(page.getByText(/조각 \d+개/).first()).toBeVisible();
  // Session counter: 3 drops of 1–5 pieces each.
  const earned = Number(await page.getByLabel("이번에 모은 조각").locator("span").textContent());
  expect(earned).toBeGreaterThanOrEqual(3);
  expect(earned).toBeLessThanOrEqual(15);
  await expect(page.getByText("다음 조각까지")).toHaveCount(0);
  // Ambient mode hid the controls while idle; moving the mouse brings them back.
  await page.mouse.move(700, 400);
  await page.getByRole("button", { name: "끝내기" }).click();

  // Load enough pieces through the backup import to unlock a theme.
  await page.keyboard.press("4");
  const backup = { ...initialState(), pieces: { dew: 30, sunbeam: 25, sprout: 30, feather: 10, "pink-cloud": 10 } };
  await page.getByTestId("backup-input").setInputFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "바꾸기" }).click();
  await page.keyboard.press("Escape");

  await page.keyboard.press("2");
  const garden = page.getByRole("article").filter({ hasText: "새벽 정원" });
  await garden.getByRole("button", { name: "열기" }).click();
  await expect(garden.getByRole("button", { name: "방에 통째로 적용" })).toBeVisible();

  await page.reload();
  await page.keyboard.press("2");
  await expect(page.getByRole("article").filter({ hasText: "새벽 정원" }).getByText("열림")).toBeVisible();
});
