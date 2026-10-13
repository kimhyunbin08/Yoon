# Piece Room (working name, KR: 조각방) — Product Spec

Source: user interview (2026-10).
Status: v0.4 (implemented). Sections: 1 Ideation · 2 PRD · 3 TRD · 4 Design Spec · 5 Open Questions. Agent instructions live in `AGENTS.md`.

Platform decision: **laptop only** (desktop browser, landscape). No phone, no tablet, no sync.

---

## 1. Ideation

### 1.1 One-liner
A pastel study room you leave running while you study. It times your study like 열품타, and the time you put in drops random pieces that you spend to unlock pretty themes and decorations for the room.

### 1.2 Who it is for
One user: a student who wants a cozy room on screen while studying. What the interview established:
- Track study time like 열품타 and turn it into random pieces.
- Different times of day drop different pieces.
- Spend pieces as materials to unlock pretty themes and decorations.
- Purpose: something nice to look at, not a productivity fix.
- Daily use: left open all day as a backdrop while studying.
- Design: pastel, a desk in front, a window straight ahead.
- Later: extra features inside the room, such as a timer or a diary.

### 1.3 Product principles (derived from the interview)
1. **The room is the product.** It must look good full screen for hours. Every other screen is secondary.
2. **Reward time, never punish it.** Leaving it on is the intended use. No caps, no idle penalties, no streak loss.
3. **Calm, not gamey.** No rankings, no notifications nagging, no loud reward effects.
4. **Single user, zero friction.** No sign-up. Open it and it works.

### 1.4 Core loop
```
Open room ─► Start timer, leave it running (window shows the time of day)
   ▲                                   │
   │                                   ▼ every 30 min of timer time
Decorate room ◄─ Unlock theme ◄─ Random piece (set depends on time of day)
```

### 1.5 Later ideas (not MVP)
Diary (일기장) inside the room, ambient sounds (rain, café, pencil), more themes, sharing to friends.

---

## 2. PRD

### 2.1 Goal
The user keeps it as her default study backdrop for 2 weeks straight and asks for more themes. That is the only success criterion.

### 2.2 Non-goals for MVP
Accounts, sync, mobile/tablet layouts, social, rankings, payments, native apps, anti-cheat, free-form drag placement, diary.

### 2.3 User stories (MVP)
| ID | She wants to… | Acceptance criteria |
|---|---|---|
| US-1 | open the app and see her room | No login. Room renders full screen within 1 s from cached assets. Installable as a desktop PWA (Chrome/Edge; Safari via Add to Dock). |
| US-2 | start / pause / stop a study timer | Timer survives reload and closing the tab (stored start timestamp). No upper limit. |
| US-3 | get pieces for studying | 1 piece per 30 min of timer time, awarded live while running (small, quiet toast), not only at stop. Leftover minutes carry over to the next session. |
| US-4 | collect different pieces at different times | Room shows the current time window and its piece set. |
| US-5 | browse her pieces | Collection grid by time window; owned count; unowned as silhouette. |
| US-6 | unlock a theme with pieces | Theme shows recipe with owned/required. Unlock consumes pieces and places the theme's items in the room right away. |
| US-7 | decorate her room | Unlocked themes provide items placed into fixed slots. One item per slot. Can also apply a whole theme in one tap. |
| US-8 | see how long she studied | Today total on the room; 7-day bars in Records. |
| US-9 | not lose her room | Export / import a backup JSON file. Reminder after every 3rd unlocked theme. |

### 2.4 Game rules
**Time windows** (device local time):
| Window | KR | Hours | Example piece set |
|---|---|---|---|
| dawn | 새벽 | 05:00–09:00 | morning light, dew, steaming mug |
| day | 낮 | 09:00–17:00 | clouds, potted plant, pencils |
| evening | 저녁 | 17:00–21:00 | sunset glass, warm lamp, cat |
| night | 밤 | 21:00–05:00 | stars, moon, candle |

- A piece belongs to the window in which its 30-min block completes.
- Rarity per roll: common 70%, rare 25%, special 5%.
- Pity: after 8 rolls without rare or better, the next roll is at least rare.
- Paused time does not count. No caps of any kind.
- Minutes left over when a session ends (under 30) carry into the next session, so stopping never loses progress.

**Themes**: a theme costs a recipe of 6–12 pieces from 1–2 windows and unlocks 2–4 room items plus a matching window view. MVP content: 4 themes, 24 piece types (6 per window). Add themes after she has used it for a week.

---

## 3. TRD

### 3.1 Stack
- Next.js (App Router, TypeScript), static export, deployed on Vercel as an installable PWA.
- Storage: IndexedDB via `idb-keyval` (one small dependency). No backend, no auth.
- Styling: Tailwind CSS with tokens from §4.2.
- Content (pieces, themes, items) as a typed TS file `content/catalog.ts`.
- Art: original SVG drawn for this project (see §4.3). No third-party image assets.

Why no Supabase: one user, one laptop, no competition to protect. A backend adds auth and ops for nothing.

### 3.2 Architecture
```
┌──────────────── PWA (browser) ───────────────┐
│ Room (SVG) + HUD + panels (one page)         │
│      │          │                            │
│      ▼          ▼                            │
│   lib/game.ts (pure functions: blocks,       │
│               window, roll, pity, unlock)    │
│      │                                       │
│      ▼                                       │
│   lib/store.ts ── IndexedDB (state v1)       │
│ content/catalog.ts (static, versioned)       │
└──────────────────────────────────────────────┘
```

### 3.3 State shape (single IndexedDB key `state`)
```ts
type State = {
  version: 1;
  timer: { segments: { start: number; end: number | null }[]; blocksAwarded: number }; // open segment = running
  carryMs: number; // leftover focus from earlier sessions, < 30 min
  daily: Record<string, number>; // local YYYY-MM-DD -> focused ms, split at midnight
  pieces: Partial<Record<PieceId, number>>;
  rollsSinceRare: number;
  unlockedThemes: ThemeId[];
  room: Partial<Record<Slot, ItemId>>;
};
```

### 3.4 Game logic (`lib/game.ts`, pure, unit tested)
| Function | Behavior |
|---|---|
| `start / pause / resume / end` | Segment-based timer. `pause` adds the closed segment to `daily`. `end` awards, then stores the remainder in `carryMs`. |
| `focusedMs(timer, now)` | Sum of segment lengths (open segment counts up to `now`). |
| `pendingBlocks(state, now)` | `floor((carryMs + focusedMs) / 30min) − blocksAwarded` |
| `blockCompletedAt(state, k)` | Walks segments to find the wall-clock time block k finished, so it lands in the right window even if the app was closed. |
| `windowAt(ts)` / `skyPhaseAt(ts)` | Local hour → drop window (4) / sky phase (8, visual only). |
| `roll(window, rollsSinceRare, rng)` | Rarity with pity, then uniform piece within window+rarity. |
| `award` / `tick` | Awards all pending blocks. `tick` also stops the timer if the clock moved backwards. |
| `unlock` / `place` / `applyTheme` | Throw `INSUFFICIENT_PIECES`, `ALREADY_UNLOCKED`, `ITEM_LOCKED`, `SLOT_MISMATCH`. |
| `migrate(raw)` | Validates stored or imported state, throws `INVALID_STATE`. An unreadable stored copy is kept under a `state-corrupt-*` key. |

`tick` runs once on app open (catches blocks completed while closed) and every 10 s.

### 3.5 Edge cases
- Tab closed for hours with timer running: on reopen, all completed blocks are awarded with their correct windows. This is intended ("틀어놓기").
- Device clock changes: if `now < startedAt`, stop timer and keep awarded pieces.
- Midnight crossing: windows use local time; Records split sessions by local date.
- Catalog update removes a piece: unknown ids are kept in state but hidden.
- Storage cleared by browser: mitigated by `navigator.storage.persist()` on first run + JSON backup (US-9).
- State migration: `version` field; `migrate()` runs on load.

### 3.6 Tests
- Vitest for `lib/game.ts`: focused time with pauses, block assignment across window boundaries and midnight, pity, unlock success/failure, migration.
- One Playwright smoke with a fake clock: start timer, advance 30 min, see a piece, import a backup, unlock a theme, reload, state persists.

---

## 4. Design Spec

### 4.1 Direction
Pastel, soft, quiet. A front-facing study room: desk in the foreground, window straight ahead. It should feel like a lo-fi "study with me" scene that belongs to her. UI floats lightly over the room and fades out when idle.

### 4.2 Tokens
| Token | Light | Night (auto in night window) |
|---|---|---|
| `--bg` | `#FBF7F2` cream | `#1E2033` |
| `--surface` | `#FFFFFF` (85% opacity over room) | `#2A2D45` (85%) |
| `--text` | `#3B3A45` | `#ECEAF5` |
| `--text-muted` | `#8A8797` | `#A6A3B8` |
| `--primary` | `#B9A7E8` lavender | `#C8B9F0` |
| `--accent-pink` | `#F6C1CF` | `#E8A9BA` |
| `--accent-mint` | `#BDE5D3` | `#9FD1BC` |
| `--accent-peach` | `#FFD6B8` | `#E9BB98` |
| `--rare` | `#9EC5F2` | same |
| `--special` | `#F2C97E` | same |

Text on pastel fills uses `--text`, never white (contrast ≥ 4.5:1). Font: Pretendard, sizes 12/14/16/20/28/48. Timer: tabular numerals. Radius 16 for cards, 999 for buttons. Shadow `0 4px 16px rgb(59 58 69 / 0.08)`.

### 4.3 Room scene
- **Laptop only, landscape.** Scene is a 16:10 stage (1440×900 design size) scaled to fit the window with `object-fit: cover` behavior; narrower windows crop the side walls, never the window or desk. Minimum supported window: 1024×640.
- Composition: window center back wall, shelf left wall, frame/poster right wall, desk across the bottom, lamp on desk, floor strip.
- Slots: `window`, `wall`, `shelf`, `desk`, `lighting`, `floor`.
- **Mood (from the mood board): "beauty inside emptiness".** Out the window, a lone ivory tower rises from a sea of clouds. Low-poly faces (two tones per surface) with a few square "pixel" marks. Calm and empty, never busy.
- **Sky follows 8 phases** (visual only; drops still use the 4 windows in §2.4). Mood board hex values, softened toward white/lavender to stay pastel:

| Phase | Hours | Top → bottom (source) | Room tint |
|---|---|---|---|
| predawn | 03–05 | `#708090` → `#4B0082` | lavender, stars |
| dawn | 05–07 | `#E6E6FA` → `#FFD1DC` | faint peach, low sun |
| morning | 07–10 | `#87CEEB` → `#F0F8FF` | none |
| midday | 10–14 | `#00BFFF` → `#FFFFFF` | none |
| afternoon | 14–17 | `#FFD700` → `#F5F5DC` | faint gold |
| evening | 17–19 | `#FFA500` → `#FF7F50` | coral, lamps glow |
| twilight | 19–21 | `#4B0082` → `#FF00FF` | violet, first stars |
| night | 21–03 | `#191970` → `#000080` | indigo, moon, lamps glow |

- Theme windows change the foreground (garden hedge, night sea with lighthouse); the tower stays on the horizon.
- Art: original flat pastel illustrations as SVG, drawn for this project. One React component per room item and piece (`components/art/`), colored via CSS variables so time-of-day tints and night mode apply without new files. Style rules: 2–3 flat fills per object, no outlines, one darker shade of the base fill for shadow, rounded corners, no gradients except the window sky. No 3D.

### 4.4 Ambient mode (the main mode)
- After 8 s without input, all UI fades out except a small timer pill (top right) and today's total. Any mouse move or key press brings UI back. Cursor hides in ambient mode.
- Full screen button and `F` key. Wake Lock API keeps the screen on while the timer runs.
- Keyboard: `Space` start/pause, `F` full screen, `Esc` exit full screen/close sheets, `1–4` open menu sections.
- New piece: a 3 s quiet toast in the corner ("새벽 조각을 얻었어요 · 이슬"). No sound, no modal.

### 4.5 Screens
| Screen | Content | Primary action |
|---|---|---|
| Room | Full room, timer pill, current window chip, today total | `공부 시작` / `일시정지` / `끝내기` |
| Pieces (조각함) | Right drawer: tabs by window, 3-col grid, silhouettes | click → detail |
| Themes (테마) | Right drawer: live room preview per theme + recipe `have/need` | `열기` when complete, then `방에 통째로 적용` |
| Decorate (꾸미기) | Room with slot highlights (click a slot), bottom sheet with slot tabs + items | click to place, `비우기` |
| Records (기록) | Right drawer: today, last 7 days, 7-day bars | `백업하기`, `불러오기` (confirm before replacing) |

Navigation: everything is one page; panels open over the room. Small floating menu (4 icons) on the room's left edge, keys `1–4`; hidden in ambient mode.

### 4.6 States
| State | Treatment |
|---|---|
| First run | Bare room (desk + window). One line: "30분 공부하면 첫 조각이 나와요". |
| Empty pieces | Silhouettes + "공부하면 조각이 모여요". |
| Theme not affordable | Missing pieces listed with the window they drop in. |
| Storage unavailable (private mode) | Banner "이 모드에서는 기록이 저장되지 않아요". |
| Import failed | Toast "백업 파일을 읽을 수 없어요"; current state untouched. |

### 4.7 Motion and accessibility
- Window sky cross-fades over 2 s on window change. Lamp glow and steam loop subtly (4 s); all loops off under `prefers-reduced-motion`.
- Theme unlock: 600 ms soft reveal of the items into their slots.
- Click targets ≥ 32 px, visible focus ring on all controls. Alt text from `nameKo` on every piece and item.

---

## 5. Open Questions
Resolved: laptop only (no sync); art is original SVG made by the agent.

1. **Duplicates.** After all themes are unlocked, extra pieces have no use. Proposal: 5 duplicates → 1 chosen piece, in v1.1.
2. **Diary (일기장).** Lightest version: a notebook item on the desk that opens a one-line daily note. v1.1 candidate.
3. **Ambient sound.** Would she use rain/café sounds while it is running? Cheap to add, but sound is a taste call.
