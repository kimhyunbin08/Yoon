# AGENTS.md

Instructions for coding agents (Claude Code, Codex) working in this repo.

## Project
StillRoom: a personal pastel study-room PWA for one user, on one laptop. Timer → 1–5 random pieces every 5 focused minutes, by time of day → unlock themes → decorate the room. Local-only (IndexedDB), no database, no accounts of our own. Two stateless routes (`app/api/google/token`, `app/api/naver/caldav`) for the optional calendar connections.

Live: https://stillroom-app.vercel.app (Vercel project `jogakbang`, team Meditor). Every push to `main` deploys to production.

Read `SPEC.md` before changing anything. §1.3 (principles), §2.4 (game rules), and §4 (design) are the source of truth.

## Commands
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest (lib/game.ts)
npm run test:e2e     # Playwright smoke (first time: npx playwright install chromium)
npm run lint && npm run typecheck
npm run build        # static page + one function; env: NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

## Layout
```
app/                 single page + globals.css (tokens, 8 sky phases); api/google/token (OAuth code/refresh exchange); api/naver/caldav (CalDAV read proxy); privacy/ (policy for the OAuth consent screen)
components/App.tsx   timer actions, ticking, shortcuts, ambient mode, wake lock
components/Room.tsx  room scene, slots, window view, window light, line-art group
components/Hud.tsx   window chip, timer pill, controls, menu, toasts
components/Panels.tsx pieces, themes, decorate, records, to-dos
components/art/      original SVG art: pieces.tsx, items.tsx (first items), themes/<theme>.tsx (one item per slot)
lib/game.ts          pure game logic (no I/O)
lib/todos.ts         pure to-do, 인장, and reward helpers (no I/O)
lib/calendar.ts      pure agenda helpers: today's events from Calendar API items
lib/google.ts        Google sign-in popup, token renewal, Calendar fetch, agenda store
lib/naver.ts         Naver id + app password, CalDAV fetch through the route, agenda store
lib/ical.ts          pure iCalendar (VEVENT) parser for CalDAV responses
lib/store.ts         IndexedDB load/save, backup export/import
content/catalog.ts   pieces, themes, 12 room slots, recipes, items (typed). Ids are persisted: add, never rename.
public/              manifest, sw.js, icons
e2e/                 Playwright smoke
```

## Rules
1. Game logic stays pure in `lib/game.ts`, with time and RNG injected. Any rule change updates `SPEC.md` §2.4 and the Vitest cases in the same commit.
2. Never add caps, idle penalties, streak loss, or nagging notifications (`SPEC.md` §1.3).
3. Bump `State.version` and add a `migrate()` step for any state shape change.
4. Desktop windows of any size: draw on the 1440×900 stage; the room always fits whole (meet + overscanned wall/floor, so new background art must extend past the stage). UI sizes are rem-based off the fluid root font size: no fixed px for UI sizes. Do not build phone or tablet layouts.
5. Art is original SVG drawn in this repo, following the style rules in `SPEC.md` §4.3. Do not add third-party images, icon packs, or copied artwork. Color art through CSS variables, never hardcoded hex.
6. Use tokens from `SPEC.md` §4.2. No hardcoded hex in components.
7. The room must stay smooth when left open for hours: only the timer pill re-renders each second, never the whole scene.
8. Every control is keyboard reachable with a visible focus ring. Keep the shortcuts in `SPEC.md` §4.4 working.
9. UI copy is Korean. Code, comments, and commits are English. Use Conventional Commits.
10. No new dependencies without a stated reason in the commit or PR description.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
