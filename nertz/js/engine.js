/* engine.js — Nertz game state & rules for the human player.
 * The engine is UI-agnostic; it emits events the UI subscribes to.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const D = Nertz.deck;

  // Default table rules; modes override these for variant play.
  const DEFAULT_RULES = { nertzSize: 13, workPiles: 4, stockFlip: 3 };

  class Engine {
    /**
     * @param {object} opts
     *   opts.rng           - random fn (for deterministic daily mode)
     *   opts.foundations   - shared foundations array (shared with AI)
     *   opts.playerId      - id used to tag foundation cards
     *   opts.onFoundation  - cb(card) when human plays to a foundation
     *   opts.rules         - {nertzSize, workPiles, stockFlip} variant overrides
     */
    constructor(opts) {
      opts = opts || {};
      this.rng = opts.rng || Math.random;
      this.playerId = opts.playerId || "you";
      this.foundations = opts.foundations || [];
      this.onFoundation = opts.onFoundation || function () {};
      this.rules = Object.assign({}, DEFAULT_RULES, opts.rules || {});
      this.listeners = {};
      this.reset();
    }

    on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); return this; }
    emit(evt, payload) { (this.listeners[evt] || []).forEach((f) => f(payload)); }

    reset() {
      const full = D.shuffle(D.buildDeck(this.playerId), this.rng);
      // Nertz pile (rules.nertzSize cards), top face up.
      this.nertz = full.slice(0, this.rules.nertzSize);
      this.nertz.forEach((c, i) => (c.faceUp = i === this.nertz.length - 1));
      // Work (tableau) piles, 1 card each, face up.
      this.work = [];
      let idx = this.rules.nertzSize;
      for (let i = 0; i < this.rules.workPiles; i++) {
        const c = full[idx++];
        c.faceUp = true;
        this.work.push([c]);
      }
      // Remainder is the stock; waste starts empty.
      this.stock = full.slice(idx);
      this.stock.forEach((c) => (c.faceUp = false));
      this.waste = [];
      this.stockCycles = 0;
      this.score = 0;            // running tally of foundation cards played
      this.movesMade = 0;
      this.finished = false;
      this.emit("change");
    }

    // ---- accessors -------------------------------------------------------
    peek(source) { return this._peekSource(source); } // public: identity of a source's playable card
    nertzTop() { return this.nertz[this.nertz.length - 1] || null; }
    wasteTop() { return this.waste[this.waste.length - 1] || null; }
    workTop(i) { const p = this.work[i]; return p[p.length - 1] || null; }

    // ---- stock -----------------------------------------------------------
    flipStock() {
      if (this.finished) return;
      if (this.stock.length === 0) {
        if (this.waste.length === 0) return;
        // Recycle waste back into stock (face down), preserving order.
        this.stock = this.waste.reverse();
        this.stock.forEach((c) => (c.faceUp = false));
        this.waste = [];
        this.stockCycles++;
      } else {
        const n = Math.min(this.rules.stockFlip, this.stock.length);
        for (let i = 0; i < n; i++) {
          const c = this.stock.pop();
          c.faceUp = true;
          this.waste.push(c);
        }
      }
      this.emit("change");
    }

    // ---- foundation plays ------------------------------------------------
    // source: {zone:'nertz'|'waste'|'work', pileIndex?}
    playToFoundation(source) {
      if (this.finished) return false;
      // Only the top card of a work pile may go to a foundation — never a
      // buried card (which would drag the cards above it off into the void).
      if (source.zone === "work" && source.cardIndex != null) {
        const p = this.work[source.pileIndex];
        if (source.cardIndex !== p.length - 1) return false;
      }
      const card = this._peekSource(source);
      if (!card) return false;

      // Try to extend an existing foundation, else start one with an Ace.
      let target = null;
      for (const f of this.foundations) {
        if (D.canStackFoundation(card, f)) { target = f; break; }
      }
      if (!target && card.rank === 1) {
        target = { id: "f" + this.foundations.length + "_" + card.suit + Date.now(),
                   suit: card.suit, symbol: card.symbol, color: card.color,
                   top: 0, cards: [] };
        this.foundations.push(target);
      }
      if (!target) return false;

      this._removeSource(source);
      card.owner = this.playerId;
      card.faceUp = true;
      target.cards.push(card);
      target.top = card.rank;
      this.score++;
      this.movesMade++;
      this.onFoundation(card);
      this.emit("foundation", { card, foundation: target });
      this._afterMove();
      return true;
    }

    // ---- tableau plays ---------------------------------------------------
    // Move a card (and any valid run above it for work piles) to work pile `dest`.
    moveToWork(source, dest) {
      if (this.finished) return false;
      const destTop = this.workTop(dest);

      if (source.zone === "work") {
        const pile = this.work[source.pileIndex];
        const start = source.cardIndex != null ? source.cardIndex : pile.length - 1;
        const run = pile.slice(start);
        if (!this._isValidRun(run)) return false;
        if (!D.canStackTableau(run[0], destTop)) return false;
        if (source.pileIndex === dest) return false;
        pile.splice(start);
        this.work[dest].push(...run);
      } else {
        const card = this._peekSource(source);
        if (!card) return false;
        if (!D.canStackTableau(card, destTop)) return false;
        this._removeSource(source);
        this.work[dest].push(card);
      }
      this.movesMade++;
      this._afterMove();
      return true;
    }

    _isValidRun(run) {
      for (let i = 0; i < run.length - 1; i++) {
        if (!D.canStackTableau(run[i + 1], run[i])) return false;
      }
      return run.every((c) => c.faceUp);
    }

    // ---- source helpers --------------------------------------------------
    _peekSource(s) {
      if (s.zone === "nertz") return this.nertzTop();
      if (s.zone === "waste") return this.wasteTop();
      if (s.zone === "work") {
        const p = this.work[s.pileIndex];
        const i = s.cardIndex != null ? s.cardIndex : p.length - 1;
        return p[i] || null;
      }
      return null;
    }

    _removeSource(s) {
      if (s.zone === "nertz") {
        this.nertz.pop();
        const t = this.nertzTop();
        if (t) t.faceUp = true;
      } else if (s.zone === "waste") {
        this.waste.pop();
      } else if (s.zone === "work") {
        const p = this.work[s.pileIndex];
        const i = s.cardIndex != null ? s.cardIndex : p.length - 1;
        p.splice(i);
      }
    }

    _afterMove() {
      this.emit("change");
      if (this.nertz.length === 0 && !this.finished) {
        this.finished = true;
        this.emit("nertz", { by: this.playerId }); // Nertz! round over
      }
    }

    // Is there at least one legal move available? (used for "stuck" hints)
    hasAnyMove() {
      const sources = [];
      if (this.nertzTop()) sources.push({ zone: "nertz" });
      if (this.wasteTop()) sources.push({ zone: "waste" });
      this.work.forEach((p, i) => { if (p.length) sources.push({ zone: "work", pileIndex: i }); });
      for (const s of sources) {
        const card = this._peekSource(s);
        for (const f of this.foundations) if (D.canStackFoundation(card, f)) return true;
        if (card.rank === 1) return true;
        for (let d = 0; d < this.work.length; d++) {
          if (s.zone === "work" && s.pileIndex === d) continue;
          if (D.canStackTableau(card, this.workTop(d))) return true;
        }
      }
      return this.stock.length > 0 || this.waste.length > 0;
    }

    // Final Nertz score: +1 per foundation card, -2 per card left in nertz.
    finalScore() {
      const founded = this.foundations.reduce(
        (n, f) => n + f.cards.filter((c) => c.owner === this.playerId).length, 0);
      return founded - 2 * this.nertz.length;
    }

    nertzRemaining() { return this.nertz.length; }
  }

  Nertz.Engine = Engine;
})(typeof window !== "undefined" ? window : this);
