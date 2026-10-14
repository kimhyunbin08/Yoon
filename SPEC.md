# StillRoom — Product Spec

Source: user interview (2026-10).
Status: v0.11 (implemented). Live: https://stillroom-app.vercel.app (also https://jogakbang.vercel.app, kept so existing local data stays reachable).
Sections: 1 Ideation · 2 PRD · 3 TRD · 4 Design Spec · 5 Open Questions · 6 Market Research & Decisions · 7 Next Development Steps (planned, not built). Agent instructions live in `AGENTS.md`.

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
   │                                   ▼ 1–5 pieces every 5 min of timer time
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
| US-2 | start / pause / stop a study timer | Timer survives reload and closing the tab (stored start timestamp). No upper limit. While a session is running or paused, the timer pill shows the session time and the pieces earned since start ("이번에 모은 조각 27개"); the end toast repeats both ("이번 공부 45분 · 조각 27개"). No countdown to the next drop. |
| US-3 | get pieces for studying | Every 5 min of timer time she gets 1–5 random pieces (3 is most common), awarded live while running with one small, quiet toast per drop. Leftover minutes carry over to the next session. |
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

- Every 5 focused minutes = 1 drop of 1–5 pieces. Count weights: 1 → 10%, 2 → 20%, 3 → 40%, 4 → 20%, 5 → 10% (mean 3, ≈ 36 pieces per focused hour).
- Each piece in a drop rolls its own rarity and type. A drop belongs to the window in which its 5-min block completes.
- Rarity per roll: common 70%, rare 25%, special 5%.
- Pity: after 8 rolls without rare or better, the next roll is at least rare.
- Paused time does not count. No caps of any kind.
- Minutes left over when a session ends (under 5) carry into the next session, so stopping never loses progress.

**Themes**: a theme costs a recipe of 105–140 pieces (≈ 3–4 focused hours, mostly in its windows) from 1–2 windows and unlocks 2–5 room items plus a matching window view. Content: 5 themes, 24 piece types (6 per window). Add themes after she has used it for a week.

| Theme | Recipe (windows) | Items |
|---|---|---|
| 새벽 정원 dawn-garden | dawn + day, 105 | garden window, plant shelf, mint rug |
| 햇살 카페 sunny-cafe | day + evening, 120 | latte & cake, pendant lamp, menu board |
| 노을 고양이 sunset-cat | evening, 105 | sleeping cat, sunset poster, books & cactus |
| 별밤 도서관 starry-library | night + dawn, 140 | night-sea window, star garland, candle & books, moon clock |
| 네온 글리치 neon-glitch | night + evening, 115 (star 30, firefly 30, warm-light 25, sunset-glass 15, letter 10, aurora 5) | city-night window with blinds, neon sign, boombox & cassettes, neon tube, CRT monitor |

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
  version: 4; // v1 counted 30-min blocks (migrate multiplies blocksAwarded by 6); v3 drops v2's rollsSinceDrop; v4 adds timer.piecesEarned
  timer: { segments: { start: number; end: number | null }[]; blocksAwarded: number; piecesEarned: number }; // open segment = running; piecesEarned resets on start
  carryMs: number; // leftover focus from earlier sessions, < 5 min
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
| `pendingBlocks(state, now)` | `floor((carryMs + focusedMs) / 5min) − blocksAwarded` |
| `blockCompletedAt(state, k)` | Walks segments to find the wall-clock time block k finished, so it lands in the right window even if the app was closed. |
| `windowAt(ts)` / `skyPhaseAt(ts)` | Local hour → drop window (4) / sky phase (8, visual only). |
| `award` per block | `pieceCount(rng)` picks 1–5 by the weights above, then `roll` runs once per piece. While idle, blocks are paid from `carryMs` directly so a later session can't pay them twice. |
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
- One Playwright smoke with a fake clock: start timer, advance 15 min, see pieces, import a backup, unlock a theme, reload, state persists.

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
| `--primary` | `#FBF6EC` ivory (fill) + `--primary-line` `#E6DCC8` 1px border | `#F1E8D6` ivory |
| `--ring` | `#A38B5B` deep ivory (focus ring, decorate slot outline; ≥ 3:1 on white) | `#E3D3B0` |
| `--accent-pink` | `#F6C1CF` | `#E8A9BA` |
| `--accent-mint` | `#BDE5D3` | `#9FD1BC` |
| `--accent-peach` | `#FFD6B8` | `#E9BB98` |
| `--rare` | `#9EC5F2` | same |
| `--special` | `#F2C97E` | same |

Text on pastel fills uses `--text`, never white (contrast ≥ 4.5:1). Font: Pretendard, sizes 12/14/16/20/28/48. Timer: tabular numerals. Radius 16 for cards, 999 for buttons. Shadow `0 4px 16px rgb(59 58 69 / 0.08)`.

### 4.3 Room scene
- **Laptop only, landscape.** Scene is a 16:10 stage (1440×900 design size) scaled to fit the window with `object-fit: cover` behavior; narrower windows crop the side walls, never the window or desk. Minimum supported window: 1024×640.
- Composition: window center back wall, shelf left wall, frame/poster right wall, desk across the bottom, lamp on desk, floor strip.
- **White scene, color from light only** (supersedes the prism backdrop, D12). Inside the room SVG every art fill maps to three paper whites (`--paper-1` `#FFFFFF`, `--paper-2` `#F3F1ED`, `--paper-3` `#E4E0DA`); only ink details (eyes) stay dark. Color comes exclusively from light and shadow: the sky in the window, the window light, the time-of-day shade, and lamp glows. Piece icons in the UI keep their colors (they are collectibles, not part of the scene).
- **Lofi line-art form** (reference: lofi room illustration; form only):
  - Every opaque shape of the window frame, window view, curtains, shelf, desk, base objects, and room items is outlined in `--line-art` (a time-tinted graphite: the phase's `--prism-1` mixed into `#4A4857`). Compound shapes built from overlapping circles (clouds, hedges) are outlined once around the silhouette (stroke-under, fill-over), never along internal seams.
  - **Colored-pencil texture:** the whole line-art group runs through one static SVG filter: fractal-noise displacement (scale ≈ 2) for a hand-drawn wobble, and a noise mask that punches grain into strokes.
  - **Window light:** a shaft from the window glass falls diagonally down-right to the floor. Inside it, `--light` (a saturated per-phase color) is applied twice: an `overlay` layer that makes lines and shadows inside the light glow in color, and a low-opacity `multiply` wash so white surfaces show the color too. Outside it, everything is shaded with `--shade` at `--shade-opacity`.
  - **Leaf shadow:** a soft palm-leaf shadow inside the light patch on the floor.
  - **Ground shadows** under the desk; **base decor:** a tall leafy floor plant at the left wall.
  - **Neon glitch theme (retro punk):** its neon sign, neon tube, CRT screen, and lit city windows are light sources, so they are the only theme art allowed to carry color: `--neon-pink` `#FF4FA3` and `--neon-cyan` `#2DE2E6`, plus colored glows that stay faintly visible even at midday (`max(var(--glow), 0.35)`). Glitch is static: an RGB-split filter on the theme's items (red and cyan fringes on the pencil lines), CRT scanlines, and a few offset glitch bars. No animation.
  - Static only (no animated light), so the room stays cheap to leave open for hours.

| Phase | `--light` |
|---|---|
| predawn | `#8E9BEA` |
| dawn | `#FF9DB8` |
| morning | `#FFD27A` |
| midday | `#FFE27A` |
| afternoon | `#FFB95C` |
| evening | `#FF8556` |
| twilight | `#C27BFF` |
| night | `#7C8BFF` |
- Slots: `window`, `wall`, `shelf`, `desk`, `lighting`, `floor`.
- **Mood (from the mood board): "beauty inside emptiness".** Out the window: open sky, outlined clouds, and soft rolling hills over a sea of clouds. No tower. Calm and empty, never busy.
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

- Theme windows change the foreground (garden hedge, night sea with lighthouse).
- Art: original SVG drawn for this project. One React component per room item and piece (`components/art/`), colored via CSS variables: in the room the palette maps to paper whites, in the UI pieces keep their pastel colors. Style rules: simple shapes, a `--line-art` outline on opaque shapes (applied by the room's line-art group, not per shape), rounded corners, no gradients except the window sky, window light, and glows. No 3D.

### 4.4 Ambient mode (the main mode)
- After 8 s without input, all UI fades out except a small timer pill (top right) and today's total. Any mouse move or key press brings UI back. Cursor hides in ambient mode.
- Full screen button and `F` key. Wake Lock API keeps the screen on while the timer runs.
- Keyboard: `Space` start/pause, `F` full screen, `Esc` exit full screen/close sheets, `1–4` open menu sections.
- New pieces: one 3 s quiet toast per drop ("새벽 조각 3개 · 이슬 ×2, 참새 깃털"). Catch-up after the app was closed collapses into one toast. No sound, no modal.

### 4.5 Screens
| Screen | Content | Primary action |
|---|---|---|
| Room | Full room, timer pill (session time + pieces earned this session), current window chip, today total | `공부 시작` / `일시정지` / `끝내기` |
| Pieces (조각함) | Right drawer: tabs by window, 3-col grid, silhouettes | click → detail |
| Themes (테마) | Right drawer: live room preview per theme + recipe `have/need` | `열기` when complete, then `방에 통째로 적용` |
| Decorate (꾸미기) | Room with slot highlights (click a slot), bottom sheet with slot tabs + items | click to place, `비우기` |
| Records (기록) | Right drawer: today, last 7 days, 7-day bars | `백업하기`, `불러오기` (confirm before replacing) |

Navigation: everything is one page; panels open over the room. Small floating menu (4 icons) on the room's left edge, keys `1–4`; hidden in ambient mode.

### 4.6 States
| State | Treatment |
|---|---|
| First run | Bare room (desk + window). One line: "5분마다 조각이 1~5개 나와요". |
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

---

## 6. Market Research & Decisions (2026-10-13)

### 6.1 What comparable products do
| Product | Reward mechanic | Takeaway for StillRoom |
|---|---|---|
| Study Bunny | Coins for every minute on task, spent on items and music. | Fine-grained progress feels good; 5-min rolls sit between per-minute and per-session. |
| Forest | One tree per session; coins unlock species and ambient tracks. | Session-end rewards alone feel slow for a backdrop left on all day. |
| Focus Friend (Hank Green) | Finished sessions earn currency for room decorations in themes; no ads, cosmetic-only purchases. Hit #1 free on the App Store. | Room decorating by theme is a proven cozy loop. Keep it calm and cosmetic. |
| Spirit City: Lofi Sessions | XP unlocks room cosmetics; collectible spirits are discovered at random while focusing; no shop. | Random discovery during focus + decor earned only through play fits StillRoom exactly. |
| 열품타 | Stopwatch, app blocking, study groups, white noise; no decorating rewards found. | The timer is table stakes; the room and collection are the differentiator. |

Research on variable rewards: variable-ratio schedules drive the most consistent repeat behavior, and visible progress is the other reliable driver. The same sources warn that randomness should serve the user, not compete with focus.

### 6.2 Decisions
| # | Decision | Why | Rejected |
|---|---|---|---|
| D1 | One roll per 5 focused minutes | User request; fine-grained progress (Study Bunny) without per-minute noise. | 30-min blocks (too slow for an all-day backdrop), per-minute (toast spam). |
| D2 | ~~60% drop chance per roll~~ (superseded by D7) | Variable reward, matching Spirit City's random discovery. | Guaranteed piece every 5 min (predictable, inflates economy 1.6×). |
| D3 | ~~Dry pity after 2 empty rolls~~ (superseded by D7) | "Reward time, never punish it" (§1.3): max 15 min without a piece. | Pure randomness (long dry streaks feel like punishment). |
| D4 | ~~Empty rolls are silent~~ (moot after D7: every drop has pieces) | Calm, not gamey (§1.3); no "꽝" message. | Showing misses (adds noise and disappointment). |
| D5 | ~~Recipes ×3 (20–28 pieces)~~ (rescaled ×5 in D8) | Keeps 4 themes from being finished on day one at ≈ 7.7 pieces/h. | Keeping old recipes (every theme in ~1 h). |
| D6 | State v2 with migration (v1 blocks × 6) | Existing local data keeps its progress with no double payouts. | Resetting state. |
| D7 | Every 5 min: 1–5 pieces, weighted to 3 (10/20/40/20/10) | User request (2026-10-13): never an empty 5 minutes, 3 most common, 4–5 still feel like a lucky haul. | Uniform 1–5; weighting toward 1. |
| D8 | Recipes ×5 (105–140 pieces) and state v3 | ≈ 36 pieces/h is ~4.7× the D2 economy; ×5 keeps ≈ 3–4 h per theme. v3 removes the unused dry-pity counter. | Keeping D5 recipes (each theme in under an hour). |
| D9 | Timer pill shows pieces earned this session; next-drop countdown removed (state v4) | User request (2026-10-13): the running total is the motivating number; a countdown adds clock-watching. Stored in state so it survives reload. | In-memory counter (lost on reload). |
| D10 | ~~Prism backdrop on white~~ (blooms removed in D12): ivory wall/floor with time-of-day pastel blooms; UI accent becomes ivory; focus/outline use deep ivory `--ring` | User request (2026-10-13) with a "+prism" mood board. Radial gradients instead of blur filters keep an all-day backdrop cheap. A separate `--ring` keeps focus visible, since ivory on white is invisible. | Per-theme bloom colors; wall-only change; lavender accent kept. |
| D11 | Lofi line-art form: outlines on furniture and items, window light beam via outside shading, leaf shadow, ground shadows, floor plant | User request (2026-10-13) with a lofi room reference (form only). Redrawing the existing SVG keeps time-of-day color, decorating, and crisp scaling. Outlines come from one CSS rule on a group, so new art gets them for free. | AI-generated raster background (breaks slot alignment and the original-SVG rule). |
| D12 | White scene; color only from light and shadow; colored-pencil lines; outlined window view; tower and prism blooms removed; window light via overlay + multiply wash | User request (2026-10-13). Overlay alone does nothing on pure white, so a light multiply wash carries the color on white surfaces while overlay saturates lines and shadows. Palette remap is scoped to the room so collectible icons stay colorful. | Recoloring each art component by hand; overlay only (invisible on white). |
| D13 | Neon glitch theme: a 5th unlockable theme, static glitch (RGB split, scanlines, glitch bars), neon colors only on light-emitting parts | User request (2026-10-14): one retro-punk glitch theme, still (not animated). Keeps the "color only from light" rule by making neon and screens the light. | Whole-room glitch mode; periodic glitch flicker. |

Taste call to revisit after a week of real use: if themes still go too fast, raise recipes rather than shrinking drops (bigger drops are the fun part).

Sources: [Study Bunny listing](https://gridfiti.com/?p=17933), [Forest on the App Store](https://apps.apple.com/au/app/forest-focus-for-productivity/id866450515), [Focus Friend on the App Store](https://apps.apple.com/US/app/id6742278016), [Focus Friend coverage](https://blog.washcoll.edu/wordpress/theelm/2025/09/new-focus-friend-study-app-by-hank-green-explodes-in-popularity/), [Spirit City on Steam](https://store.steampowered.com/app/2113850/), [Spirit City coverage](https://www.tubefilter.com/2024/03/07/spirit-city-lofi-girl-sessions-focus-game/), [열품타 on the App Store](https://apps.apple.com/kr/app/%EC%97%B4%EC%A0%95%ED%92%88%EC%9D%80-%ED%83%80%EC%9D%B4%EB%A8%B8/id1441909643), [Variable rewards](https://concepts.dsebastien.net/concept/variable-rewards/).

---

## 7. Next Development Steps (planned, not built)

Captured 2026-10-14 from the user: the wall board (today the 햇살 카페 menu board) could show a to-do list or a real Google Calendar, so the room becomes a screen she actually works from, not only a backdrop.

### 7.1 Goal
Turn a wall surface into a **live board** that shows today's to-dos and today's calendar, drawn in the room's pencil style. The room stays calm (§1.3): no reminders, no badges, no notifications. It is something to glance at, like a real corkboard.

### 7.2 Step A — To-do board (local, no accounts)
- **Where:** a new base fixture, a pencil-drawn cork board on the right wall, always present. It does not use a theme slot, so themes keep decorating and the board never disappears. (Open question Q7.1.)
- **In the room:** up to 5 open to-dos as handwritten-style lines (SVG `<text>`, Pretendard), done ones struck through for the rest of the day. If there are more, show "+3".
- **Editing:** click the board or press `5` → a right drawer like the other panels: add (Enter), check off, edit, delete, drag to reorder. Keyboard first.
- **Rules:** done items clear at local midnight (kept in history for Records later). No due times, no alarms.
- **State:** v5 adds `todos: { id; text; done; createdAt; doneAt | null; order }[]` (max 50, text ≤ 80 chars). Migration fills `[]`. Included in JSON backup.
- **Tests:** pure helpers in `lib/game.ts`-style module (`lib/todos.ts`): add/toggle/reorder/clear-at-midnight, migration v4 → v5; e2e: add, check, reload, persists.
- **Effort:** human ~1 day / CC ~1 hour.

### 7.3 Step B — Google Calendar on the board (read-only)
Show today's events (time + title, next event highlighted) under the to-dos. Read-only: StillRoom never writes to her calendar.

Two ways to get the data; pick one before building (Q7.2):

| | B1. Google sign-in (OAuth, browser only) | B2. Secret iCal address (recommended for one user) |
|---|---|---|
| How | Google Identity Services token client in the PWA, scope `calendar.events.readonly`, Calendar API `events.list` for today | She pastes her calendar's "Secret address in iCal format" once; a tiny Vercel Function fetches and parses it (calendar.google.com does not send CORS headers, so the browser can't fetch it directly) |
| Setup | Google Cloud project, OAuth client, consent screen, her account as test user | Copy one URL from Google Calendar settings |
| Daily use | Access tokens are short-lived and renewing needs a click; in Testing mode consent also lapses after 7 days. Bad fit for an app left open all day. | Works unattended; refresh every 15 min while open |
| Warnings | "Unverified app" screen until sensitive-scope verification | None |
| Security | Token in memory only | The secret URL is a credential: stored only in her browser (IndexedDB), sent to our function per request, never logged or stored server-side; she can reset it in Google Calendar anytime |
| Backend | None | One stateless function (`app/api/ical/route.ts` → requires leaving pure static export or a separate function) |

- **Architecture impact (B2):** today the app is `output: "export"` with no server. B2 needs one serverless route; switch to the default Next.js build on Vercel (pages stay static, one Node function). Update §3.1 and AGENTS.md when built.
- **Board rendering:** times in the room's pencil style; the current event gets the window-light color (`--light`) as its only accent, consistent with "color only from light".
- **Failure states:** offline → last fetched agenda with "마지막 업데이트 14:20"; bad/expired URL or revoked token → board shows "캘린더 다시 연결" in place of events; never a modal.
- **Tests:** iCal parsing (recurring events, all-day, time zones, today-only filter) as unit tests with fixture `.ics` files; function returns 400 on non-Google hosts (no open proxy).
- **Effort:** B2 human ~2 days / CC ~2 hours; B1 similar code but more console setup.

### 7.4 Open questions for these steps
- **Q7.1** Board placement: a new always-present cork board (recommended), or let the existing wall items (menu board, neon sign) show the content when placed?
- **Q7.2** Calendar source: B2 secret iCal (recommended for a single user, no re-login) or B1 Google sign-in?
- **Q7.3** Which calendars: primary only, or let her pick several?
- **Q7.4** Should finished to-dos count toward anything (e.g., a bonus piece)? Default no: rewards stay tied to study time only.

Sources: [Use the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Choose Google Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth), [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification), [Manage App Audience](https://support.google.com/cloud/answer/15549945?hl=en).
