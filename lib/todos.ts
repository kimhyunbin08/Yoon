// Pure to-do, 인장 (seal), and reward helpers (SPEC US-10, US-11, D20). No I/O: time and ids are passed in.
import { dayKey, type State, type Todo } from "./game";

export const MAX_TODOS = 50;
export const MAX_TEXT = 80;
export const MAX_REWARDS = 10;
const MAX_CLAIMED = 100;
export const TODOS_PER_SEAL = 5; // finishing this many in a day earns one 인장
export const SEALS_PER_REWARD = 5;

const clean = (text: string) => text.trim().slice(0, MAX_TEXT);

/** To-dos finished today (local day of `now`). */
export function doneToday(s: State, now: number): number {
  const today = dayKey(now);
  return s.todos.filter((t) => t.done && t.doneAt !== null && dayKey(t.doneAt) === today).length;
}

/**
 * Keeps 인장 in step with today's finished to-dos: award one when today reaches 5 (once per day),
 * take it back if the same day drops below 5 again, unless it was already spent.
 */
function settleSeal(s: State, now: number): State {
  const today = dayKey(now);
  const done = doneToday(s, now);
  if (done >= TODOS_PER_SEAL && s.sealAwardedOn !== today) return { ...s, seals: s.seals + 1, sealAwardedOn: today };
  if (done < TODOS_PER_SEAL && s.sealAwardedOn === today && s.seals > 0) return { ...s, seals: s.seals - 1, sealAwardedOn: null };
  return s;
}

export function addTodo(s: State, text: string, now: number, id: string): State {
  const t = clean(text);
  if (!t || s.todos.length >= MAX_TODOS) return s;
  const todo: Todo = { id, text: t, done: false, createdAt: now, doneAt: null };
  return { ...s, todos: [...s.todos, todo] };
}

export function toggleTodo(s: State, id: string, now: number): State {
  const todos = s.todos.map((t) => (t.id === id ? { ...t, done: !t.done, doneAt: t.done ? null : now } : t));
  return settleSeal({ ...s, todos }, now);
}

export function editTodo(s: State, id: string, text: string): State {
  const t = clean(text);
  if (!t) return s;
  return { ...s, todos: s.todos.map((x) => (x.id === id ? { ...x, text: t } : x)) };
}

export function removeTodo(s: State, id: string, now: number): State {
  return settleSeal({ ...s, todos: s.todos.filter((t) => t.id !== id) }, now);
}

/** Moves a to-do one step up (-1) or down (1). */
export function moveTodo(s: State, id: string, dir: -1 | 1): State {
  const i = s.todos.findIndex((t) => t.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= s.todos.length) return s;
  const todos = s.todos.slice();
  [todos[i], todos[j]] = [todos[j], todos[i]];
  return { ...s, todos };
}

/** Clears to-dos finished before today. Returns the same state object when nothing changes. */
export function clearDone(s: State, now: number): State {
  const today = dayKey(now);
  const todos = s.todos.filter((t) => !(t.done && t.doneAt !== null && dayKey(t.doneAt) !== today));
  return todos.length === s.todos.length ? s : { ...s, todos };
}

/** What the wall board shows: open first, then today's done ones; at most `max`, plus how many are hidden. */
export function boardLines(s: State, max = 4): { lines: Todo[]; more: number } {
  const ordered = [...s.todos.filter((t) => !t.done), ...s.todos.filter((t) => t.done)];
  return { lines: ordered.slice(0, max), more: Math.max(0, ordered.length - max) };
}

export function addReward(s: State, text: string, id: string): State {
  const t = clean(text);
  if (!t || s.rewards.length >= MAX_REWARDS) return s;
  return { ...s, rewards: [...s.rewards, { id, text: t }] };
}

export function removeReward(s: State, id: string): State {
  return { ...s, rewards: s.rewards.filter((r) => r.id !== id) };
}

/** Spends 5 인장 on one of her rewards. Throws NOT_ENOUGH_SEALS or UNKNOWN_REWARD. */
export function claimReward(s: State, id: string, now: number): State {
  const r = s.rewards.find((x) => x.id === id);
  if (!r) throw new Error("UNKNOWN_REWARD");
  if (s.seals < SEALS_PER_REWARD) throw new Error("NOT_ENOUGH_SEALS");
  return { ...s, seals: s.seals - SEALS_PER_REWARD, claimed: [...s.claimed, { text: r.text, at: now }].slice(-MAX_CLAIMED) };
}
