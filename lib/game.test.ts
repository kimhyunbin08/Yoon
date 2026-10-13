import { describe, expect, it } from "vitest";
import { PIECE_BY_ID } from "../content/catalog";
import {
  BLOCK_MS,
  applyTheme,
  award,
  end,
  focusedMs,
  initialState,
  migrate,
  nextWindowChange,
  pause,
  place,
  resume,
  roll,
  skyPhaseAt,
  start,
  studiedOn,
  tick,
  unlock,
  windowAt,
} from "./game";

// Local-time helper so tests pass in any TZ.
const at = (h: number, m = 0, day = 13) => new Date(2026, 9, day, h, m).getTime();
const MIN = 60_000;
const rng0 = () => 0.99; // always common, last piece in pool

describe("time windows", () => {
  it("maps hours to windows", () => {
    expect(windowAt(at(4, 59))).toBe("night");
    expect(windowAt(at(5))).toBe("dawn");
    expect(windowAt(at(9))).toBe("day");
    expect(windowAt(at(17))).toBe("evening");
    expect(windowAt(at(21))).toBe("night");
    expect(windowAt(at(0))).toBe("night");
  });

  it("maps hours to sky phases", () => {
    expect(skyPhaseAt(at(1))).toBe("night");
    expect(skyPhaseAt(at(3))).toBe("predawn");
    expect(skyPhaseAt(at(12))).toBe("midday");
    expect(skyPhaseAt(at(20))).toBe("twilight");
  });

  it("finds the next window change, across midnight", () => {
    expect(nextWindowChange(at(8, 30))).toEqual({ window: "day", at: at(9) });
    expect(nextWindowChange(at(22))).toEqual({ window: "dawn", at: at(5, 0, 14) });
  });
});

describe("timer", () => {
  it("excludes paused time", () => {
    let s = start(initialState(), at(10));
    s = pause(s, at(10, 20));
    s = resume(s, at(10, 50));
    expect(focusedMs(s.timer, at(11))).toBe(30 * MIN);
  });

  it("awards one piece per 30 minutes, none before", () => {
    const s = start(initialState(), at(10));
    expect(award(s, at(10, 29), rng0).drops).toHaveLength(0);
    const r = award(s, at(10, 30), rng0);
    expect(r.drops).toHaveLength(1);
    expect(award(r.state, at(10, 45), rng0).drops).toHaveLength(0);
  });

  it("assigns a block to the window where it completes", () => {
    const s = start(initialState(), at(8, 45));
    const { drops } = award(s, at(9, 15), rng0);
    expect(drops[0].window).toBe("day");
    expect(PIECE_BY_ID[drops[0].pieceId].window).toBe("day");
  });

  it("shifts completion time by pauses", () => {
    let s = start(initialState(), at(8));
    s = pause(s, at(8, 20));
    s = resume(s, at(8, 50));
    const { drops } = award(s, at(9), rng0);
    expect(drops[0].at).toBe(at(9));
    expect(drops[0].window).toBe("day");
  });

  it("catches up blocks completed while the app was closed", () => {
    const s = start(initialState(), at(20));
    const { drops } = tick(s, at(23, 10), rng0);
    expect(drops.map((d) => d.window)).toEqual(["evening", "night", "night", "night", "night", "night"]);
  });

  it("carries leftover minutes into the next session", () => {
    let r = end(start(initialState(), at(10)), at(10, 40), rng0);
    expect(r.drops).toHaveLength(1);
    expect(r.state.carryMs).toBe(10 * MIN);
    const s = start(r.state, at(12));
    r = award(s, at(12, 20), rng0);
    expect(r.drops).toHaveLength(1);
  });

  it("splits study time at midnight", () => {
    const s = end(start(initialState(), at(23, 30)), at(0, 30, 14), rng0).state;
    expect(s.daily["2026-10-13"]).toBe(30 * MIN);
    expect(s.daily["2026-10-14"]).toBe(30 * MIN);
  });

  it("counts the running segment in today's total", () => {
    const s = start(initialState(), at(10));
    expect(studiedOn(s, "2026-10-13", at(10, 45))).toBe(45 * MIN);
  });

  it("stops the timer if the clock moves backwards", () => {
    const s = start(initialState(), at(10));
    const r = tick(s, at(9), rng0);
    expect(r.state.timer.segments).toHaveLength(0);
  });
});

describe("drops", () => {
  it("guarantees a rare after 8 commons", () => {
    let since = 0;
    const rarities = [];
    for (let i = 0; i < 9; i++) {
      const r = roll("day", since, rng0);
      since = r.rollsSinceRare;
      rarities.push(r.rarity);
    }
    expect(rarities.slice(0, 8).every((r) => r === "common")).toBe(true);
    expect(rarities[8]).toBe("rare");
    expect(since).toBe(0);
  });

  it("rolls special under 5%", () => {
    expect(roll("night", 0, () => 0.01).rarity).toBe("special");
    expect(roll("night", 0, () => 0.2).rarity).toBe("rare");
  });

  it("awards a whole long session with the right count", () => {
    const s = start(initialState(), at(9));
    expect(award(s, at(9) + 10 * BLOCK_MS, rng0).drops).toHaveLength(10);
  });
});

describe("themes and room", () => {
  const rich = () => ({
    ...initialState(),
    pieces: { dew: 2, sunbeam: 2, sprout: 3, feather: 1, "pink-cloud": 1 },
  });

  it("unlocks a theme and consumes pieces", () => {
    const s = unlock(rich(), "dawn-garden");
    expect(s.unlockedThemes).toEqual(["dawn-garden"]);
    expect(s.pieces).toEqual({ dew: 0, sunbeam: 0, sprout: 1, feather: 0, "pink-cloud": 0 });
    expect(() => unlock(s, "dawn-garden")).toThrow("ALREADY_UNLOCKED");
  });

  it("refuses to unlock without pieces", () => {
    expect(() => unlock(initialState(), "dawn-garden")).toThrow("INSUFFICIENT_PIECES");
  });

  it("guards room placement", () => {
    expect(() => place(initialState(), "floor", "garden-rug")).toThrow("ITEM_LOCKED");
    const s = unlock(rich(), "dawn-garden");
    expect(() => place(s, "wall", "garden-rug")).toThrow("SLOT_MISMATCH");
    expect(place(s, "floor", "garden-rug").room.floor).toBe("garden-rug");
    expect(place(place(s, "floor", "garden-rug"), "floor", null).room).toEqual({});
  });

  it("applies a whole theme", () => {
    const s = applyTheme(unlock(rich(), "dawn-garden"), "dawn-garden");
    expect(s.room).toEqual({ window: "garden-window", shelf: "garden-plants", floor: "garden-rug" });
  });
});

describe("migrate", () => {
  it("round-trips valid state", () => {
    const s = start(initialState(), at(10));
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("rejects junk", () => {
    expect(() => migrate(null)).toThrow("INVALID_STATE");
    expect(() => migrate({ version: 2 })).toThrow("INVALID_STATE");
    expect(() => migrate({ version: 1, pieces: [] })).toThrow("INVALID_STATE");
  });
});
