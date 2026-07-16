# 📖 Nertz Royale — Story Bible: *The Gullwash Saga*

The narrative design document for the story mode. Built with the **snowflake
method** (expand from one sentence outward), a **hero's journey** spine, and a
tragicomic tone: *Golf Story* warmth over a slowly rising dark tide.
Chapters 1–2 are implemented (`js/story-content.js`, `js/story-content2.js`);
chapters 3–5 are specified here, ready to author.

---

## 1. Snowflake — Step 1: The Sentence

> A drifting card player comes home to revive a dying seaside club and
> discovers the town's luck was gambled away decades ago — to a gray spirit
> who collects joy as debt.

## 2. Snowflake — Step 2: The Paragraph (setup + three disasters + ending)

Gullwash-by-the-Sea forgot how to play; you reopen the Sandpiper Social Club
one eccentric local at a time, until the lights being back on wakes what
sleeps under the water feature *(Disaster 1 — end of Ch.1/Ch.2: the Undertow
rises and friends are "Grayed")*. Preston, the pompous rival, is revealed as
the tragic heir to the debt — his grandfather sold the town's fortune at a
gray table in 1988, and the Dealer now calls the whole ledger due *(Disaster
2 — Ch.3: your first duel with the Gray Dealer is rigged; you lose your own
luck and every card you touch comes up gray)*. Luckless, you learn what Betts
always knew — luck was never owned, only lent between people — and the town
antes its own small fortunes to stake you for the final game *(Disaster 3 —
Ch.4: the Dealer counters by putting the whole TOWN on the table)*. In the
last hand you refuse to win luck back — you *fold* it forward, voiding the
ledger, breaking the Dealer's one rule: everything must be owed *(Ending —
Ch.5: the club becomes what it was always meant to be — the place the town
keeps its luck together)*.

## 3. Snowflake — Step 3: Character Sheets

| Character | Ambition | Story goal | Conflict | Epiphany | Voice/gag |
|---|---|---|---|---|---|
| **You** (silent-ish) | belong somewhere | revive the club | your winning streak is literally borrowed luck | luck is shared, not owned | reaction beats; the town speaks for you |
| **Betts** ⚓ (mentor) | atone | train you | she sat at the 1988 table — and folded early, saving herself | sincerity beats superstition | sailor proverbs that collapse mid-sentence… until they don't |
| **Preston** 🎩 (shadow→ally) | be worthy of a name | escape the ledger | serving the Dealer vs. saving the town | "It's just Preston." | name pronounced differently every scene; yacht = 3 canoes in a trench coat |
| **The Gray Dealer** 🌫️ (core enemy) | balance every book | collect Gullwash's joy-debt | cannot comprehend a gift | (none — that's the tragedy) | speaks in ledger terms; ellipses…; unfailingly courteous |
| **The Collector** 🕴️ (henchman) | a good review from the Dealer | repossess luck | develops a taste for chowder (and doubt) | defects in Ch.4 for one (1) bowl | jokes 40 years out of date; enters rooms without doors |
| **Admiral Crumbs** 🐦 (trickster guide) | ??? | steals one ace per match | seagull | the stolen aces were being HIDDEN from the Dealer all along — Ch.5 payoff | ( urp ) |
| **Trent** 📋 (flunky→defector) | lamination | file everything | loyalty vs. Form 33-G | paperwork can be heroism | upside-down clipboard, "there's a form for that" |
| Gus 📢 / Doreen 🥣 / Milo 📊 / Ferdinand 📮 | the chorus | keep the town's heart beating | get Grayed in Ch.2 | community = stakes | whisper-shouting; experimental chowder; fake statistics; the unsent gray letters |

## 4. The Core Enemy & The Dark-Spiritual Layer

**The Gray Dealer** is not evil — it is *accounting*. An old tide-spirit that
believes every good thing is a loan: every lucky draw, every warm evening,
every "one more hand" among friends accrues interest. Gray is its color
because gray is what's left when the suits are collected — ♠♥♦♣ drained to
ledger-ink. Its manifestations (already in-game):

- **The Undertow** — surges that freeze your stock mid-race (`haunt` beats).
- **The Grayed** — townsfolk playing hollow-eyed for the Dealer (Ch.2 boss race).
- **The gray ace** — a suitless card that appears where it was always waiting.
- **3:33** — the Gray Hour; clocks stop, gulls fly backwards, fish get polite.

Rule of tone: the dark layer is *eerie, never gory*; every scare is answered
by a joke within two lines, and every joke near the finale is answered by a
sincere beat. Comedy is the town's immune system — that's the theme.

## 5. Battle Symbolism

- **The suits are the town's four virtues**: ♠ grit, ♥ bonds, ♦ fortune,
  ♣ renewal. The four shared foundations are Gullwash's four hearthstones —
  every card banked is literally *restoring the town's fire*.
- **Calling "Nertz!"** is an act of defiance — emptying your burden-pile in
  front of the thing that wants you buried in it.
- **Sparks ◆ (hex charges)** are "table manners" — Betts's folk magic. Four
  banked cards = one favor the table owes you. Spending them on **Frost /
  Fog / Jinx** is the town's small magic pushing back; the Dealer's haunts
  are the same force with the sign flipped.
- **Races vs. the Grayed** are exorcisms; you don't defeat friends, you
  *win them back*.

## 6. Hero's Journey Mapping

| Stage | Where it lands |
|---|---|
| Ordinary world / Call | Ch.1 b1 — the boarded-up club |
| Refusal → Mentor | Ch.1 — Betts and the kitchen-table race |
| Crossing the threshold | Ch.1 finale → Ch.2 b1 (the glow) |
| Tests, allies, enemies | Ch.2 — hex training, Trent's waiver, the Collector |
| Approach the inmost cave | Ch.2 b8-b10 — the Grayed; the invitation |
| **Ordeal** | Ch.3 — the rigged duel; your luck is taken |
| Reward (seized) | Ch.3 — the Dealer's true name in the ledger |
| The road back | Ch.4 — town antes its luck; the Collector defects |
| Resurrection | Ch.5 — the final hand, played luckless & staked by everyone |
| Return with elixir | Ch.5 — the ledger folded forward; Founder's Day returns |

## 7. Chapter Mini-Arcs (each with its own disaster)

| Ch. | Title | Mini-arc | Turn/disaster | Comedy:Tragedy | Status |
|---|---|---|---|---|---|
| 1 | The Sandpiper Revival | reopen the club, gather the chorus | Preston humiliated — and *relieved*? | 80:20 | ✅ shipped (14 beats) |
| 2 | The Undertow | learn the charms, meet the gray economy | friends Grayed; invitation to the deep table | 65:35 | ✅ shipped (10 beats) |
| 3 | The Room Below | duel the Dealer; **lose rigged**; luckless arc begins | every card you draw turns gray | 50:50 | 📋 spec below |
| 4 | The Ante | the town stakes you; Collector defects for chowder | the Dealer puts Gullwash itself on the table | 60:40 | 📋 spec |
| 5 | Founder's Day | the last hand; Crumbs's ace-hoard payoff | you fold to win; Betts finishes one proverb, perfectly | 70:30 (earned) | 📋 spec |

### Ch.3 "The Room Below" — beat spec (11 beats)
b1 dialogue: descent below the water feature; the room is dry and it shouldn't be.
b2 nertz (haunt, hard, workPiles 3): "Narrow Table" — the Dealer thins the world.
b3 blackjack vs the Collector (stake 100): he hesitates on the hit. First crack.
b4 nertz vs Dealer proxy "The House Hand" (hard ×2, turbo): rigged — scripted
   loss is allowed to pass the beat (first-ever `objective:{type:'survive'}` —
   reach score 10 even in defeat). Your luck is collected.
b5 dialogue: the luckless morning. Colors literally desaturate (auto-switch
   Noir theme while luckless — mechanical tie-in).
b6 golf (target 28): "Muscle Memory" — Milo proves skill persists without luck.
b7 nertz (no hexes allowed — sparks disabled, the table owes you nothing):
   win a race on pure play. The arc's thesis in mechanics.
b8 poker vs Preston (stake 10 — all you have left): he *lets* you win, badly,
   and you both know it. Tragic-warm.
b9 nertz 3 bots: the chorus plays AT your side (first `ally` bot flag —
   one bot banks to shared foundations without racing you).
b10 dialogue: Betts confesses 1988. The proverb collapses into plain truth.
b11 dialogue: the Dealer's true name found in Trent's laminate archive.

### Ch.4 "The Ante" / Ch.5 "Founder's Day" — headline beats
- Town-ante ceremony (each named NPC hands you a keepsake = +1 permanent max
  spark, capstone systems reward).
- Collector defection over Doreen's experimental chowder ("it glows BACK").
- Final gauntlet: blitz race → golf → blackjack → poker → the Last Hand
  (poker vs the Dealer, special: winning delta is *given away* in the outro).
- Crumbs returns the hoarded aces — 52 gray cards regain their suits, one per
  town memory named aloud. Founder's Day Nertz Royale = post-game freeplay
  tournament vs the whole cast.

## 8. Conflict Matrix (keep every scene double-loaded)

| Layer | Chapter 1–2 examples | Chapter 3–5 escalation |
|---|---|---|
| Internal | do I belong here? | am I only my luck? |
| Interpersonal | Preston's rivalry; Trent's loyalty | Betts's guilt; Preston's self-worth |
| Supernatural | haunts, the Grayed | rigged duel; town on the table |
| Comic relief valve | chowder, clipboards, ( urp ) | jokes aimed *at* the abyss — and landing |

## 9. Systems ↔ Story Tie-ins (implemented / planned)

| System | Fiction | Status |
|---|---|---|
| Sparks ◆ + Frost/Fog/Jinx | Betts's "table manners" folk magic | ✅ live (all vs-bot modes; taught in c2b2) |
| Haunt surges (stock freeze) | the Undertow testing your grip | ✅ live (`nertz.haunt` beats) |
| Theme unlocks | places remembered: Forest (lighthouse), Royal (the club's true colors) | ✅ live |
| `survive` objective, `ally` bots, luckless (hexless) beats, +max-spark keepsakes | Ch.3–5 mechanics | 📋 next |

## 10. Tone Bible (writing rules)

1. Every scare answered by a joke within two lines; near the finale, invert.
2. NPCs never mock the player — the world is absurd *with* you, not at you.
3. The Dealer is polite. Politeness is the horror.
4. Running gags are load-bearing: each recurs ≥1×/chapter and pays off once.
5. Lines ≤140 chars; dialect through rhythm, not spelling.
6. Family friendly: wagers are "friendly stakes," dread over danger, no death —
   things are *collected*, and collection is reversible by play.
