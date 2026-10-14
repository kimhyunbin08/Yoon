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
  const backup = { ...initialState(), pieces: { dawn: 60, day: 20 } };
  await page.getByTestId("backup-input").setInputFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "바꾸기" }).click();
  await page.keyboard.press("Escape");

  await page.keyboard.press("2");
  const garden = page.getByRole("article").filter({ hasText: "새벽 정원" });
  await garden.getByRole("button", { name: "열기" }).click();
  await expect(garden.getByRole("button", { name: "방에 통째로 적용" })).toBeVisible();

  // Saving is async (IndexedDB); wait for the write before reloading.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const req = indexedDB.open("keyval-store");
            req.onsuccess = () => {
              const get = req.result.transaction("keyval").objectStore("keyval").get("state");
              get.onsuccess = () => resolve(get.result?.unlockedThemes ?? []);
            };
          }),
      ),
    )
    .toContain("dawn-garden");
  await page.reload();
  await page.keyboard.press("2");
  await expect(page.getByRole("article").filter({ hasText: "새벽 정원" }).getByText("열림")).toBeVisible();
});

test("to-dos: add, check, see them on the wall board, persist across reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "공부 시작" })).toBeVisible(); // shortcuts attach after load
  await page.keyboard.press("5");
  const input = page.getByLabel("새 할 일");
  await input.fill("영어 단어 30개");
  await input.press("Enter");
  await input.fill("수학 문제집 2장");
  await input.press("Enter");
  await page.getByRole("checkbox", { name: "영어 단어 30개 끝냄" }).click();
  await expect(page.getByRole("checkbox", { name: "영어 단어 30개 끝냄" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");

  // The paper board on the wall (an empty calendar slot) shows both.
  const board = page.locator("svg text", { hasText: "수학 문제집 2장" });
  await expect(board.first()).toBeVisible();

  // Saving is async (IndexedDB); wait for the write before reloading.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const req = indexedDB.open("keyval-store");
            req.onsuccess = () => {
              const get = req.result.transaction("keyval").objectStore("keyval").get("state");
              get.onsuccess = () => resolve(get.result?.todos?.length ?? 0);
            };
          }),
      ),
    )
    .toBe(2);
  await page.reload();
  await expect(page.locator("svg text", { hasText: "영어 단어 30개" }).first()).toBeVisible();
});
