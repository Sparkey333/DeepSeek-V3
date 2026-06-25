# Nertz Royale ♠♥♦♣

A fast-play **Nertz** (a.k.a. Nerts / Pounce / Racing Demon) card game for the
browser — a faithful recreation of the classic real-time solitaire race, then
improved in design, feel, and depth.

> Zero build step, zero dependencies. Just open `index.html`.

## Run it

```bash
# from the repo root
cd nertz
python3 -m http.server 8000   # then visit http://localhost:8000
# …or simply double-click index.html
```

Works fully offline (`file://` friendly). Progress is saved in your browser's
`localStorage`.

## How to play

Nertz is real-time solitaire: you race the bots to empty your **Nertz pile**
onto the **shared foundations** in the middle.

- **Nertz pile** (top-left, red badge) — 13 cards. Empty this to call *“Nertz!”*
  and win the round.
- **Work piles** (×4) — build **down in alternating colors** (e.g. red 8 on
  black 9). Move single cards or whole runs between them.
- **Stock / Waste** — tap the stock to flip three cards; play the top of the waste.
- **Foundations** (center, shared) — build **up by suit** from Ace → King.
  Anyone can start a foundation with an Ace and anyone can build on it — so
  speed matters.

**Controls**
- **Tap** a card → instantly plays it to a foundation if it fits (fast play).
- **Drag** a card → drop it on a foundation or a work pile.
- **💡 Hint** highlights cards that can go to a foundation right now.

**Scoring** (classic Nertz): `+1` per card you got onto a foundation,
`-2` per card left in your Nertz pile. Highest score wins the round.

## Modes

| Mode | Description |
|------|-------------|
| ⚡ **Fast Play** | One quick round vs the bots. Jump straight in. |
| 🏁 **Ranked Race** | Same game, but results feed XP, levels & the leaderboard. |
| 📅 **Daily Challenge** | A deterministic daily shuffle — everyone gets the same deal. |
| 🌙 **Zen Solo** | No bots, no pressure. Practice the patience layer solo. |

Configure **opponents (1–3)** and **difficulty (Rookie / Sharp / Ace)** from the
menu.

## Progression & gamification

- **XP & levels** — earn XP from foundation cards and wins; level curve ramps
  gently then steepens (`progression.js`).
- **Coins** — a soft currency (reserved for future cosmetics/card backs).
- **Achievements** — First Shuffle, Speed Demon, Hot Streak, Ace Slayer, …
- **Local leaderboard** — top 50 ranked scores, sorted high-to-low.
- **Stats** — games, wins, win-rate, best score, best streak, fastest win.

## Architecture

Plain ES5-ish modules on a global `Nertz` namespace (so it runs from `file://`
with no bundler). Each file has one job:

| File | Responsibility |
|------|----------------|
| `js/deck.js` | Card model, shuffles, seeded RNG, stacking rules. |
| `js/engine.js` | Human game state & rules (UI-agnostic, event-emitting). |
| `js/ai.js` | Greedy bots that compete for the shared foundations. |
| `js/storage.js` | `localStorage` persistence (degrades to memory). |
| `js/progression.js` | XP/levels/achievements/reward math (pure functions). |
| `js/ui.js` | Rendering, pointer drag + tap, overlays, confetti, toasts. |
| `js/main.js` | Orchestration: menu, modes, loop, panels, results. |

The engine and AI share one `foundations` array, which is what makes the race
feel competitive — a bot can grab the foundation slot you were eyeing.

## Roadmap (the “expanded modes” plan)

The current build nails the **core game + single-device progression**. Planned
next, in rough order:

1. **Seasonal ladder & ranks** — Bronze→Diamond tiers with soft MMR, weekly resets.
2. **Online multiplayer** — real-time rooms (WebSocket authoritative server),
   the engine is already deterministic-friendly via the seeded RNG.
3. **Cosmetics economy** — spend coins on card backs / felt themes; the `coins`
   field and settings panel are already wired.
4. **Daily quests & battle-pass** — layered objectives feeding the XP curve.
5. **Global leaderboards & friends** — swap `storage.js`'s local board for a
   backend adapter (same interface).
6. **Accessibility pass** — full keyboard play, colorblind suits, screen-reader
   labels (reduce-motion + left-handed layout already shipped).

Each of these slots into the existing module boundaries without a rewrite —
`storage.js` becomes a network adapter, `engine.js` stays the source of truth.
