/* ai.js — lightweight Nertz bots that compete for the shared foundations.
 * Each bot owns a real 52-card deck and greedily races to empty its Nertz pile,
 * playing onto the same foundations the human uses. Bots have no visible
 * tableau (abstracted), which keeps them fast while still creating real
 * competition for foundation slots.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const D = Nertz.deck;

  const PROFILES = {
    easy:   { name: "Rookie",  tick: [1500, 2500], mistake: 0.45 },
    normal: { name: "Sharp",   tick: [1000, 1800], mistake: 0.22 },
    hard:   { name: "Ace",     tick: [650, 1200],  mistake: 0.07 },
  };

  const AVATARS = ["🦊", "🐼", "🦉", "🐙", "🦁", "🐢"];

  class Bot {
    constructor(opts) {
      this.id = opts.id;
      this.name = opts.name;
      this.avatar = opts.avatar;
      this.foundations = opts.foundations;
      this.rng = opts.rng || Math.random;
      this.profile = PROFILES[opts.difficulty] || PROFILES.normal;
      this.onPlay = opts.onPlay || function () {};
      // The bot owns a full 52-card deck. The first 13 are its Nertz pile
      // (which it races to empty); the rest are its hand/stock. We model the
      // whole deck as one reachable pool — a competent player can dig through
      // their tableau & stock to reach any card over time — so the bot never
      // deadlocks on Nertz ordering the way a top-only model would. Nertz
      // cards are flagged so we can prioritise them and track the race.
      const full = D.shuffle(D.buildDeck(this.id), this.rng);
      this.pool = full.map((card, i) => ({ card, isNertz: i < 13 }));
      this.nertzCount = 13;
      this.active = false;
      this._timer = null;
      this.foundationCount = 0;
    }

    start() { this.active = true; this._schedule(); }
    stop() { this.active = false; if (this._timer) clearTimeout(this._timer); }

    _schedule() {
      if (!this.active) return;
      const [lo, hi] = this.profile.tick;
      const delay = lo + this.rng() * (hi - lo);
      this._timer = setTimeout(() => this._tick(), delay);
    }

    // Greedy scan of the pool for the best foundation play this instant.
    // Prefers reducing the Nertz pile, then building higher foundations.
    _bestPlay() {
      let best = null;
      for (let i = 0; i < this.pool.length; i++) {
        const entry = this.pool[i];
        const card = entry.card;
        for (const f of this.foundations) {
          if (D.canStackFoundation(card, f)) {
            const w = (entry.isNertz ? 100 : 0) + f.top;
            if (!best || w > best.w) best = { idx: i, entry, foundation: f, w };
          }
        }
        if (card.rank === 1) { // can open a new foundation
          const w = (entry.isNertz ? 100 : 0) + 1;
          if (!best || w > best.w) best = { idx: i, entry, foundation: null, w };
        }
      }
      return best;
    }

    _tick() {
      if (!this.active) return;
      const slip = this.rng() < this.profile.mistake; // sometimes "misses" a play
      if (!slip) {
        const play = this._bestPlay();
        if (play) this._commit(play);
      }
      this._schedule();
    }

    _commit(play) {
      const card = play.entry.card;
      let target = play.foundation;
      if (!target) {
        target = { id: "f_" + this.id + "_" + card.suit + "_" + this.foundationCount,
                   suit: card.suit, symbol: card.symbol, color: card.color,
                   top: 0, cards: [] };
        this.foundations.push(target);
      }
      card.owner = this.id;
      card.faceUp = true; // cards on a foundation are always face-up
      target.cards.push(card);
      target.top = card.rank;
      this.foundationCount++;

      this.pool.splice(play.idx, 1);
      if (play.entry.isNertz) this.nertzCount--;
      this.onPlay({ bot: this, card, foundation: target });
    }

    nertzRemaining() { return this.nertzCount; }
    finalScore() { return this.foundationCount - 2 * this.nertzCount; }
  }

  Nertz.PROFILES = PROFILES;
  Nertz.AVATARS = AVATARS;
  Nertz.Bot = Bot;
})(typeof window !== "undefined" ? window : this);
