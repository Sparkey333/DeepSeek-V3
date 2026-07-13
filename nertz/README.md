# Nertz Royale ♠♥♦♣

A fast-play **Nertz** (a.k.a. Nerts / Pounce / Racing Demon) card game for the
browser — a faithful recreation of the classic real-time solitaire race, then
improved in design, feel, and depth.

> Zero build step, zero dependencies. Just open `index.html`.

**📊 [Project tracker](tracker.html)** — live status board (milestones, the Gullwash Saga chapters, build history, and links to every artifact).

## Run it

- **Instant play:** double-click **`Nertz-Royale.html`** — the whole game in one
  self-contained file. No server, no install, works offline on any OS.
- **From source:** `cd nertz && python3 -m http.server 8000`, then open
  http://localhost:8000 (or just open `index.html`).
- **As a desktop app / `.dmg`:** see **[DESKTOP.md](DESKTOP.md)** — `npm install`
  then `npm run dist` builds a macOS `.dmg` (and `dist:win` / `dist:linux` for
  the other platforms).

Progress is saved in your browser's `localStorage`.

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
| 🗺️ **Story — The Sandpiper Revival** | The story-mode pilot (à la *Golf Story*): 14 quests mixing Nertz races, poker, blackjack & golf solitaire. |
| ⚡ **Fast Play** | Classic 1v1 sprint. Jump straight in. |
| 🌀 **Blitz** | 7-card Nertz pile, single stock flips, turbo bot. +15% XP. |
| 🎲 **Wild Shuffle** | Two random rule mutators every round (pile sizes, flip counts, table widths, bot speeds). +25% XP. |
| 🌙 **Zen Solo** | No bots, no pressure. Practice the patience layer solo. |
| 🏁 **Ranked Race** | Full table (1–3 bots). Results feed XP, levels & the leaderboard. |
| 🏆 **Tournament** | Best-of-3 rounds, cumulative score, interim standings, champion's rewards. |
| 📅 **Daily Challenge** | A deterministic daily shuffle — everyone gets the same deal. One ranked shot a day. |

Rule variants are first-class: the engine takes `{nertzSize, workPiles, stockFlip}`
and bots take speed multipliers, so modes (and story quests) genuinely play differently.

### Story: The Sandpiper Revival
Gullwash-by-the-Sea — a washed-up seaside town where the ferry stopped coming in
2011 and nobody told the ferry schedule sign. Reopen the boarded-up **Sandpiper
Social Club** quest by quest: mentor Betts and her collapsing sailor proverbs,
Admiral Crumbs (a seagull who steals exactly one ace per match), and the rival
Preston Featherstonhaugh III, whose name is pronounced differently every scene.
14 beats across 6 locations mix **Nertz races** (with rule twists), **5-card-draw
poker**, **blackjack**, and **golf solitaire**, with coin wagers (10→95 ◈),
dialogue, retry-on-lose, theme unlocks, and a title reward at the finale.

### Battle system: Charms & Hexes ⚔️
Bank **4 cards** to the foundations to charge a **spark ◆** (hold up to 3). Spend
them on table magic against rival players (buttons above the table, or keys 1/2/3):
**❄️ Frost (1◆)** — the leading rival plays at half speed for 9s · **🌫️ Fog (2◆)** —
every rival stalls for 5s · **🃏 Jinx (3◆)** — the leader fumbles their next 3 plays.
Available in every vs-bot mode except Daily. In haunted story quests the **Undertow
surges back** — freezing your stock for seconds at a time.

The saga's full architecture — snowflake expansion, hero's journey, the Gray
Dealer, chapter mini-arcs 1–5, battle symbolism — lives in **[STORY_BIBLE.md](STORY_BIBLE.md)**.
Chapter 2, *The Undertow*, is playable now (10 quests).

### Duality toggles ☯
- **Day / Night form** — the ☀️/🌙 button in the top bar flips the whole app
  between dark felt and light ivory chrome; works with every table theme.
- **Card faces** — Settings → Card faces: *Classic* (traditional pip layouts)
  or *Minimal* (big flat rank + suit).

### Polish
- **Real card faces** — classic French-deck pip layouts, court-card monograms, ornate aces.
- **Card flights** — every play (yours and each bot's) animates to the centre, **one at a time**.
- **Sound** — synthesized card snaps, chimes, and fanfares (no asset files; respects the Sound setting).
- **Themes** — six table skins: Classic Felt, Midnight Neon, Royal Velvet, Sakura, Forest, Noir.

## Progression & gamification

- **XP & levels** — earn XP from foundation cards and wins; level curve ramps
  gently then steepens (`progression.js`).
- **Coins** — a soft currency (reserved for future cosmetics/card backs).
- **Achievements** — First Shuffle, Speed Demon, Hot Streak, Ace Slayer, …
- **Local leaderboard** — top 50 ranked scores, sorted high-to-low.
- **Stats** — games, wins, win-rate, best score, best streak, fastest win.
- **Themes** — three toggleable table looks (Classic Felt / Midnight Neon /
  Royal Velvet) in Settings. They render procedurally today and are wired to
  swap in real artwork the moment it lands (see [ASSETS_BRIEF.md](ASSETS_BRIEF.md)).

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
