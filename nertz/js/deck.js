/* deck.js — card model & deck utilities for Nertz
 * Exposed on the global `Nertz` namespace (classic scripts, file:// friendly).
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});

  const SUITS = [
    { id: "s", name: "Spades", symbol: "♠", color: "black" },
    { id: "h", name: "Hearts", symbol: "♥", color: "red" },
    { id: "d", name: "Diamonds", symbol: "♦", color: "red" },
    { id: "c", name: "Clubs", symbol: "♣", color: "black" },
  ];

  const RANK_LABELS = {
    1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
    8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
  };

  let _uid = 0;
  function makeCard(suit, rank, owner) {
    return {
      id: "c" + _uid++,
      suit: suit.id,
      symbol: suit.symbol,
      color: suit.color,
      rank: rank,
      label: RANK_LABELS[rank],
      owner: owner || null, // player id who played it (for foundation scoring)
      faceUp: false,
    };
  }

  // Build a full 52-card deck. owner tags cards for scoring attribution.
  function buildDeck(owner) {
    const deck = [];
    for (const suit of SUITS) {
      for (let r = 1; r <= 13; r++) deck.push(makeCard(suit, r, owner));
    }
    return deck;
  }

  // Fisher–Yates shuffle with an optional seeded RNG.
  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Mulberry32 — small deterministic RNG for daily challenges / replays.
  function seededRng(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isRed(card) { return card.color === "red"; }

  // Can `card` legally land on `target` in a tableau (build down, alt color)?
  function canStackTableau(card, target) {
    if (!target) return true; // empty pile accepts anything
    return card.rank === target.rank - 1 && isRed(card) !== isRed(target);
  }

  // Can `card` go on a foundation pile (build up by suit)?
  function canStackFoundation(card, foundation) {
    if (!foundation) return card.rank === 1; // only an Ace can start one
    return card.suit === foundation.suit && card.rank === foundation.top + 1;
  }

  Nertz.deck = {
    SUITS, RANK_LABELS, makeCard, buildDeck, shuffle,
    seededRng, isRed, canStackTableau, canStackFoundation,
  };
})(typeof window !== "undefined" ? window : this);
