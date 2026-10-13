import { expect, test } from "@playwright/test";
import { initialState } from "../lib/game";

test("study, earn pieces, unlock a theme, persist across reload", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 13, 10, 0) });
  await page.goto("/");

  await page.getByRole("button", { name: "공부 시작" }).click();
  // 15 minutes = 3 rolls; dry pity guarantees at least one piece.
  await page.clock.fastForward("15:05");
  await expect(page.getByText(/조각.*얻었어요/).first()).toBeVisible();
  // Ambient mode hid the controls while idle; moving the mouse brings them back.
  await page.mouse.move(700, 400);
  await page.getByRole("button", { name: "끝내기" }).click();

  // Load enough pieces through the backup import to unlock a theme.
  await page.keyboard.press("4");
  const backup = { ...initialState(), pieces: { dew: 6, sunbeam: 5, sprout: 6, feather: 2, "pink-cloud": 2 } };
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
