import { describe, expect, it } from "vitest";
import { PIECE_BY_ID } from "../content/catalog";
import {
  applyTheme,
  award,
  end,
  focusedMs,
  initialState,
  migrate,
  nextWindowChange,
  pause,
  pieceCount,
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
const cycle = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
// One piece per drop (count rng 0 → 1), common rarity, last piece in pool.
const always = () => cycle(0, 0.99, 0.99);

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

  it("rolls once per 5 focused minutes, not before", () => {
    const s = start(initialState(), at(10));
    expect(award(s, at(10, 4), always()).drops).toHaveLength(0);
    const r = award(s, at(10, 5), always());
    expect(r.drops).toHaveLength(1);
    expect(award(r.state, at(10, 9), always()).drops).toHaveLength(0);
    expect(award(s, at(11), always()).drops).toHaveLength(12);
  });

  it("assigns a roll to the window where its block completes", () => {
    const s = start(initialState(), at(8, 57));
    const { drops } = award(s, at(9, 2), always());
    expect(drops[0].window).toBe("day");
    expect(PIECE_BY_ID[drops[0].pieceId].window).toBe("day");
  });

  it("shifts completion time by pauses", () => {
    let s = start(initialState(), at(8, 55));
    s = pause(s, at(8, 58));
    s = resume(s, at(9, 10));
    const { drops } = award(s, at(9, 12), always());
    expect(drops[0].at).toBe(at(9, 12));
    expect(drops[0].window).toBe("day");
  });

  it("catches up rolls completed while the app was closed", () => {
    const s = start(initialState(), at(20, 50));
    const { drops } = tick(s, at(21, 10), always());
    expect(drops.map((d) => d.window)).toEqual(["evening", "night", "night", "night"]);
  });

  it("carries leftover minutes into the next session", () => {
    let r = end(start(initialState(), at(10)), at(10, 7), always());
    expect(r.drops).toHaveLength(1);
    expect(r.state.carryMs).toBe(2 * MIN);
    r = award(start(r.state, at(12)), at(12, 3), always());
    expect(r.drops).toHaveLength(1);
  });

  it("splits study time at midnight", () => {
    const s = end(start(initialState(), at(23, 30)), at(0, 30, 14), always()).state;
    expect(s.daily["2026-10-13"]).toBe(30 * MIN);
    expect(s.daily["2026-10-14"]).toBe(30 * MIN);
  });

  it("counts the running segment in today's total", () => {
    const s = start(initialState(), at(10));
    expect(studiedOn(s, "2026-10-13", at(10, 45))).toBe(45 * MIN);
  });

  it("stops the timer if the clock moves backwards", () => {
    const s = start(initialState(), at(10));
    const r = tick(s, at(9), always());
    expect(r.state.timer.segments).toHaveLength(0);
  });
});

describe("drops", () => {
  it("drops 1–5 pieces by weight, 3 in the middle band", () => {
    expect([0, 0.15, 0.5, 0.75, 0.95, 0.9999].map((r) => pieceCount(() => r))).toEqual([1, 2, 3, 4, 5, 5]);
  });

  it("puts every piece of one drop at the same time and window", () => {
    const s = start(initialState(), at(10));
    const { drops } = award(s, at(10, 5), cycle(0.5, 0.99, 0.99)); // count 3
    expect(drops).toHaveLength(3);
    expect(new Set(drops.map((d) => d.at))).toEqual(new Set([at(10, 5)]));
  });

  it("counts pieces earned this session and resets on the next start", () => {
    let r = award(start(initialState(), at(10)), at(10, 10), cycle(0.5, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99)); // 2 drops × 3
    expect(r.state.timer.piecesEarned).toBe(6);
    r = award(r.state, at(10, 15), cycle(0.5, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99));
    expect(r.state.timer.piecesEarned).toBe(9);
    const ended = end(r.state, at(10, 16), always()).state;
    expect(ended.timer.piecesEarned).toBe(0);
    expect(start(ended, at(11)).timer.piecesEarned).toBe(0);
  });

  it("never gives an empty 5 minutes", () => {
    const s = start(initialState(), at(10));
    const { drops } = award(s, at(11), () => 0.99);
    expect(new Set(drops.map((d) => d.at)).size).toBe(12);
  });

  it("guarantees a rare after 8 commons", () => {
    let since = 0;
    const rarities = [];
    for (let i = 0; i < 9; i++) {
      const r = roll("day", since, () => 0.99);
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

  it("averages about 36 pieces an hour with real randomness", () => {
    let seed = 42;
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const hours = 200;
    const r = award(start(initialState(), at(9)), at(9) + hours * 60 * MIN, rng);
    const perHour = r.drops.length / hours;
    expect(perHour).toBeGreaterThan(35);
    expect(perHour).toBeLessThan(37);
  });
});

describe("themes and room", () => {
  const rich = () => ({
    ...initialState(),
    pieces: { dew: 30, sunbeam: 25, sprout: 31, feather: 10, "pink-cloud": 10 },
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

  it("upgrades v1 (30-minute blocks) without re-awarding or losing time", () => {
    const v1 = {
      version: 1,
      timer: { segments: [{ start: at(10), end: null }], blocksAwarded: 2 },
      carryMs: 10 * MIN,
      daily: {},
      pieces: { dew: 1 },
      rollsSinceRare: 3,
      unlockedThemes: [],
      room: {},
    };
    const s = migrate(v1);
    expect(s.version).toBe(4);
    expect(s.timer.blocksAwarded).toBe(12);
    expect(s.timer.piecesEarned).toBe(0);
    // 10 min carry + 60 min focused = 70 min = 14 rolls; 12 already paid as two v1 pieces.
    expect(award(s, at(11), always()).drops).toHaveLength(2);
  });

  it("drops v2's dry-pity counter", () => {
    const v2 = { ...initialState(), version: 2, rollsSinceDrop: 1 };
    const s = migrate(v2);
    expect(s.version).toBe(4);
    expect("rollsSinceDrop" in s).toBe(false);
  });

  it("spends idle carry once, so the next session cannot award it again", () => {
    const idle = { ...initialState(), carryMs: 12 * MIN };
    const r = tick(idle, at(10), always());
    expect(r.drops).toHaveLength(2);
    expect(r.state.carryMs).toBe(2 * MIN);
    expect(award(start(r.state, at(11)), at(11, 2), always()).drops).toHaveLength(0);
  });

  it("rejects junk", () => {
    expect(() => migrate(null)).toThrow("INVALID_STATE");
    expect(() => migrate({ version: 5 })).toThrow("INVALID_STATE");
    expect(() => migrate({ version: 3, pieces: [] })).toThrow("INVALID_STATE");
  });
});
