import { describe, expect, it } from "vitest";
import { initialState, migrate, type State } from "./game";
import {
  MAX_REWARDS,
  MAX_TEXT,
  MAX_TODOS,
  addReward,
  addTodo,
  boardLines,
  claimReward,
  clearDone,
  doneToday,
  editTodo,
  moveTodo,
  removeReward,
  removeTodo,
  toggleTodo,
} from "./todos";

const at = (h: number, m = 0, day = 14) => new Date(2026, 9, day, h, m).getTime();
const withTodos = (n: number, now = at(9)) => {
  let s: State = initialState();
  for (let i = 0; i < n; i++) s = addTodo(s, `할 일 ${i}`, now, `t${i}`);
  return s;
};
const finish = (s: State, ids: string[], now: number) => ids.reduce((acc, id) => toggleTodo(acc, id, now), s);

describe("to-dos", () => {
  it("adds trimmed text, ignores empty, caps length and count", () => {
    let s = addTodo(initialState(), "  영어 단어 30개  ", at(9), "a");
    expect(s.todos).toEqual([{ id: "a", text: "영어 단어 30개", done: false, createdAt: at(9), doneAt: null }]);
    expect(addTodo(s, "   ", at(9), "b")).toBe(s);
    s = addTodo(s, "x".repeat(200), at(9), "c");
    expect(s.todos[1].text).toHaveLength(MAX_TEXT);
    const full = withTodos(MAX_TODOS);
    expect(addTodo(full, "one more", at(9), "z")).toBe(full);
  });

  it("toggles, edits, removes, and reorders", () => {
    let s = withTodos(3);
    s = toggleTodo(s, "t1", at(10));
    expect(s.todos[1]).toMatchObject({ done: true, doneAt: at(10) });
    s = toggleTodo(s, "t1", at(11));
    expect(s.todos[1]).toMatchObject({ done: false, doneAt: null });
    s = editTodo(s, "t0", " 수학 ");
    expect(s.todos[0].text).toBe("수학");
    expect(editTodo(s, "t0", "  ")).toBe(s);
    s = moveTodo(s, "t2", -1);
    expect(s.todos.map((t) => t.id)).toEqual(["t0", "t2", "t1"]);
    expect(moveTodo(s, "t0", -1)).toBe(s);
    s = removeTodo(s, "t2", at(12));
    expect(s.todos.map((t) => t.id)).toEqual(["t0", "t1"]);
  });

  it("clears only to-dos finished before today", () => {
    let s = withTodos(3, at(9, 0, 13));
    s = toggleTodo(s, "t0", at(20, 0, 13)); // yesterday
    s = toggleTodo(s, "t1", at(9, 0, 14)); // today
    const c = clearDone(s, at(10, 0, 14));
    expect(c.todos.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(clearDone(c, at(11, 0, 14))).toBe(c);
  });

  it("shows open to-dos first on the board, then done, with a hidden count", () => {
    let s = withTodos(6);
    s = finish(s, ["t0"], at(10));
    const { lines, more } = boardLines(s);
    expect(lines.map((t) => t.id)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(more).toBe(2);
  });
});

describe("인장", () => {
  it("awards one 인장 when 5 to-dos are finished in a day, at most once", () => {
    let s = withTodos(8);
    s = finish(s, ["t0", "t1", "t2", "t3"], at(10));
    expect(s.seals).toBe(0);
    s = finish(s, ["t4"], at(11));
    expect(s.seals).toBe(1);
    expect(s.sealAwardedOn).toBe("2026-10-14");
    s = finish(s, ["t5", "t6", "t7"], at(12));
    expect(s.seals).toBe(1);
    expect(doneToday(s, at(12))).toBe(8);
  });

  it("takes the 인장 back if the same day drops below 5", () => {
    let s = finish(withTodos(5), ["t0", "t1", "t2", "t3", "t4"], at(10));
    expect(s.seals).toBe(1);
    s = toggleTodo(s, "t4", at(11));
    expect(s.seals).toBe(0);
    expect(s.sealAwardedOn).toBeNull();
    s = toggleTodo(s, "t4", at(12));
    expect(s.seals).toBe(1);
  });

  it("does not count yesterday's finished to-dos toward today", () => {
    let s = withTodos(8, at(9, 0, 13));
    s = finish(s, ["t0", "t1", "t2"], at(20, 0, 13));
    s = finish(s, ["t3", "t4"], at(9, 0, 14));
    expect(s.seals).toBe(0);
  });
});

describe("나에게 주는 상", () => {
  it("adds, caps, and removes rewards", () => {
    let s = addReward(initialState(), " 케이크 먹기 ", "r1");
    expect(s.rewards).toEqual([{ id: "r1", text: "케이크 먹기" }]);
    for (let i = 0; i < 20; i++) s = addReward(s, `상 ${i}`, `x${i}`);
    expect(s.rewards).toHaveLength(MAX_REWARDS);
    expect(removeReward(s, "r1").rewards).toHaveLength(MAX_REWARDS - 1);
  });

  it("claims a reward for 5 인장 and logs it", () => {
    let s: State = { ...addReward(initialState(), "영화 보기", "r1"), seals: 6 };
    s = claimReward(s, "r1", at(20));
    expect(s.seals).toBe(1);
    expect(s.claimed).toEqual([{ text: "영화 보기", at: at(20) }]);
    expect(() => claimReward(s, "r1", at(21))).toThrow("NOT_ENOUGH_SEALS");
    expect(() => claimReward({ ...s, seals: 5 }, "nope", at(21))).toThrow("UNKNOWN_REWARD");
  });
});

describe("state v8", () => {
  it("upgrades v7 with empty to-dos, 인장, and rewards", () => {
    const v7 = { ...initialState(), version: 7 } as Record<string, unknown>;
    for (const k of ["todos", "seals", "sealAwardedOn", "rewards", "claimed"]) delete v7[k];
    const s = migrate(v7);
    expect(s.version).toBe(8);
    expect(s).toMatchObject({ todos: [], seals: 0, sealAwardedOn: null, rewards: [], claimed: [] });
  });

  it("rejects malformed to-dos", () => {
    expect(() => migrate({ ...initialState(), todos: [{ id: 1 }] })).toThrow("INVALID_STATE");
  });
});
