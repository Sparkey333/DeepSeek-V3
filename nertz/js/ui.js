/* ui.js — rendering, pointer interaction (drag + tap), overlays & FX. */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const D = Nertz.deck;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  // ---- card element ------------------------------------------------------
  function cardEl(card, opts) {
    opts = opts || {};
    const e = el("div", "card");
    if (!card.faceUp) { e.classList.add("face-down"); return e; }
    if (card.color === "red") e.classList.add("red");
    e.dataset.cardId = card.id;

    // Minimal duality form (settings → Card faces → Minimal): big rank + suit.
    if (Nertz.cardForm === "alt") {
      e.classList.add("alt-face");
      const corner = el("div", "corner tl");
      corner.append(el("span", "c-rank", card.label), el("span", "c-suit", card.symbol));
      e.append(corner, el("div", "alt-rank", card.label), el("div", "alt-suit", card.symbol));
      return e;
    }

    // corner indices (top-left, and bottom-right rotated 180°)
    const tl = el("div", "corner tl");
    tl.append(el("span", "c-rank", card.label), el("span", "c-suit", card.symbol));
    const br = el("div", "corner br");
    br.append(el("span", "c-rank", card.label), el("span", "c-suit", card.symbol));
    e.append(tl, br);

    const rank = card.rank;
    if (rank === 1) {
      // Ace — one large ornate centre pip
      const field = el("div", "pip-field");
      const p = el("div", "pip ace-pip", card.symbol);
      p.style.left = "50%"; p.style.top = "50%";
      field.appendChild(p);
      e.append(field);
    } else if (rank >= 11) {
      // Court card — typographic monogram + faint suit watermark
      e.classList.add("court-card");
      const wm = el("div", "court-wm", card.symbol);
      const court = el("div", "court");
      court.append(el("div", "court-letter", card.label), el("div", "court-suit", card.symbol));
      e.append(wm, court);
    } else {
      // Number card — classic pip layout
      const field = el("div", "pip-field");
      (PIPS[rank] || []).forEach(([x, y]) => {
        const p = el("div", "pip" + (y > 0.5 ? " flip" : ""), card.symbol);
        p.style.left = x * 100 + "%";
        p.style.top = y * 100 + "%";
        field.appendChild(p);
      });
      e.append(field);
    }
    return e;
  }

  // Classic French-deck pip positions: [xFrac(0|.5|1), yFrac]. y>0.5 → rotated.
  const PIPS = {
    2: [[.5, .10], [.5, .90]],
    3: [[.5, .10], [.5, .5], [.5, .90]],
    4: [[0, .12], [1, .12], [0, .88], [1, .88]],
    5: [[0, .12], [1, .12], [.5, .5], [0, .88], [1, .88]],
    6: [[0, .12], [1, .12], [0, .5], [1, .5], [0, .88], [1, .88]],
    7: [[0, .12], [1, .12], [.5, .31], [0, .5], [1, .5], [0, .88], [1, .88]],
    8: [[0, .12], [1, .12], [.5, .31], [0, .5], [1, .5], [.5, .69], [0, .88], [1, .88]],
    9: [[0, .12], [1, .12], [0, .38], [1, .38], [.5, .5], [0, .62], [1, .62], [0, .88], [1, .88]],
    10: [[0, .12], [1, .12], [.5, .26], [0, .38], [1, .38], [0, .62], [1, .62], [.5, .74], [0, .88], [1, .88]],
  };

  class UI {
    constructor() {
      this.api = {};                 // handlers wired by main.js
      this.drag = null;
      this.refs = {
        foundations: $("#foundations"),
        nertzSlot: $("#nertzSlot"),
        stockSlot: $("#stockSlot"),
        wasteSlot: $("#wasteSlot"),
        workRow: $("#workRow"),
        oppStrip: $("#oppStrip"),
        fx: $("#fxLayer"),
        toast: $("#toastHost"),
      };
      this._bindPointer();
    }

    setApi(api) { this.api = api; }

    // ============ RENDER ============
    render(engine) {
      this._renderNertz(engine);
      this._renderStock(engine);
      this._renderWaste(engine);
      this._renderWork(engine);
      this._renderFoundations(engine.foundations);
    }

    _renderNertz(engine) {
      const slot = this.refs.nertzSlot;
      slot.querySelectorAll(".card, .nertz-count").forEach((n) => n.remove());
      const top = engine.nertzTop();
      if (top) {
        const c = cardEl(top);
        this._makeDraggable(c, { zone: "nertz" });
        slot.appendChild(c);
        const badge = el("div", "nertz-count", String(engine.nertz.length));
        slot.appendChild(badge);
      }
    }

    _renderStock(engine) {
      const slot = this.refs.stockSlot;
      slot.querySelectorAll(".card").forEach((n) => n.remove());
      if (engine.stock.length) {
        const back = el("div", "card face-down");
        slot.appendChild(back);
      }
      slot.onclick = () => this.api.flipStock && this.api.flipStock();
    }

    _renderWaste(engine) {
      const slot = this.refs.wasteSlot;
      slot.querySelectorAll(".card").forEach((n) => n.remove());
      const top = engine.wasteTop();
      if (top) {
        const c = cardEl(top);
        this._makeDraggable(c, { zone: "waste" });
        slot.appendChild(c);
      }
    }

    _renderWork(engine) {
      const row = this.refs.workRow;
      row.innerHTML = "";
      const overlap = 26;
      engine.work.forEach((pile, i) => {
        const slot = el("div", "pile-slot");
        slot.dataset.zone = "work";
        slot.dataset.pileIndex = i;
        const stack = el("div", "work-pile");
        stack.style.height = (pile.length ? (pile.length - 1) * overlap : 0) + 106 + "px";
        pile.forEach((card, j) => {
          const c = cardEl(card);
          c.style.top = j * overlap + "px";
          if (card.faceUp) this._makeDraggable(c, { zone: "work", pileIndex: i, cardIndex: j });
          stack.appendChild(c);
        });
        slot.appendChild(stack);
        if (!pile.length) slot.appendChild(el("div", "pile-label", "Work"));
        row.appendChild(slot);
      });
    }

    _renderFoundations(foundations) {
      const host = this.refs.foundations;
      host.innerHTML = "";
      // Always show existing foundations + a couple of empty target slots.
      foundations.forEach((f) => {
        const slot = el("div", "pile-slot foundation-slot");
        slot.dataset.zone = "foundation";
        slot.dataset.foundationId = f.id;
        const topCard = f.cards[f.cards.length - 1];
        if (topCard) slot.appendChild(cardEl(topCard));
        host.appendChild(slot);
      });
      // empty ace-starting slots
      const empties = Math.max(1, 4 - foundations.length);
      for (let i = 0; i < empties; i++) {
        const slot = el("div", "pile-slot foundation-slot");
        slot.dataset.zone = "foundation";
        slot.dataset.foundationId = "new";
        slot.appendChild(el("div", "pile-label", "Ace"));
        host.appendChild(slot);
      }
    }

    renderOpponents(bots, leaderId) {
      const host = this.refs.oppStrip;
      host.innerHTML = "";
      bots.forEach((b) => {
        const o = el("div", "opp");
        o.dataset.botId = b.id; // so card-flight animations can originate here
        if (b.id === leaderId) o.classList.add("lead");
        const ava = el("div", "opp-ava", b.avatar);
        const meta = el("div", "opp-meta");
        meta.append(
          el("div", "opp-name", b.name),
          (() => { const n = el("div", "opp-nertz"); n.innerHTML = `Nertz <b>${b.nertzRemaining()}</b>`; return n; })()
        );
        const pip = el("div", "opp-pip");
        const fill = el("span");
        fill.style.width = Math.round((b.nertzRemaining() / 13) * 100) + "%";
        pip.appendChild(fill);
        meta.appendChild(pip);
        o.append(ava, meta);
        host.appendChild(o);
      });
    }

    // ============ POINTER (drag + tap) ============
    _makeDraggable(elm, source) { elm._source = source; elm.classList.add("draggable"); }

    _bindPointer() {
      const onDown = (e) => {
        const card = e.target.closest(".card.draggable");
        if (!card || !card._source) return;
        const pt = e.touches ? e.touches[0] : e;
        this.drag = {
          source: card._source, origin: card,
          startX: pt.clientX, startY: pt.clientY,
          moved: false, clone: null, offX: 0, offY: 0,
        };
        const r = card.getBoundingClientRect();
        this.drag.offX = pt.clientX - r.left;
        this.drag.offY = pt.clientY - r.top;
        this.drag.rect = r;
      };

      const onMove = (e) => {
        if (!this.drag) return;
        const pt = e.touches ? e.touches[0] : e;
        const dx = pt.clientX - this.drag.startX, dy = pt.clientY - this.drag.startY;
        if (!this.drag.moved && Math.hypot(dx, dy) < 6) return;
        if (e.cancelable) e.preventDefault();
        if (!this.drag.moved) {
          this.drag.moved = true;
          const clone = this.drag.origin.cloneNode(true);
          clone.classList.add("dragging");
          clone.style.position = "fixed";
          clone.style.pointerEvents = "none";
          clone.style.width = this.drag.rect.width + "px";
          clone.style.height = this.drag.rect.height + "px";
          clone.style.left = "0"; clone.style.top = "0";
          clone.style.zIndex = 9999;
          document.body.appendChild(clone);
          this.drag.clone = clone;
          this.drag.origin.style.opacity = "0.35";
        }
        this.drag.clone.style.transform =
          `translate(${pt.clientX - this.drag.offX}px, ${pt.clientY - this.drag.offY}px)`;
        this._highlightDrop(pt.clientX, pt.clientY);
      };

      const onUp = (e) => {
        if (!this.drag) return;
        const d = this.drag;
        this.drag = null;
        document.querySelectorAll(".drop-ok,.drop-bad").forEach((n) => n.classList.remove("drop-ok", "drop-bad"));
        if (d.clone) d.clone.remove();
        if (d.origin) d.origin.style.opacity = "";

        if (!d.moved) { // a tap → quick play to foundation
          const fromRect = d.origin ? d.origin.getBoundingClientRect() : d.rect;
          this.api.tap && this.api.tap(d.source, fromRect);
          return;
        }
        const pt = e.changedTouches ? e.changedTouches[0] : e;
        const target = this._dropTargetAt(pt.clientX, pt.clientY);
        if (target) this.api.drop && this.api.drop(d.source, target, d.rect);
      };

      document.addEventListener("mousedown", onDown);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchstart", onDown, { passive: false });
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    }

    _dropTargetAt(x, y) {
      const node = document.elementFromPoint(x, y);
      if (!node) return null;
      const slot = node.closest("[data-zone='foundation'],[data-zone='work']");
      if (!slot) return null;
      if (slot.dataset.zone === "foundation")
        return { zone: "foundation", foundationId: slot.dataset.foundationId };
      return { zone: "work", pileIndex: parseInt(slot.dataset.pileIndex, 10) };
    }

    _highlightDrop(x, y) {
      document.querySelectorAll(".drop-ok").forEach((n) => n.classList.remove("drop-ok"));
      const node = document.elementFromPoint(x, y);
      const slot = node && node.closest("[data-zone='foundation'],[data-zone='work']");
      if (slot) slot.classList.add("drop-ok");
    }

    // ============ FX ============
    _foundationCardEl(id) { return document.querySelector('#foundations [data-card-id="' + id + '"]'); }

    // Queue a card's flight to its foundation. Flights run ONE AT A TIME so two
    // cards never animate to the centre simultaneously — each play reads as a
    // distinct action. The destination is re-resolved by card id at draw time.
    queueFlight(card, fromRect, opts) {
      opts = opts || {};
      if (!this._flightQ) this._flightQ = [];
      const reduce = document.body.classList.contains("reduce-motion");
      if (!card || !fromRect || reduce) { this._popDest(card && card.id); if (opts.onDone) opts.onDone(); return; }
      // hide the placed card now so it doesn't show before its flight lands
      const destEl = this._foundationCardEl(card.id);
      if (destEl) destEl.style.visibility = "hidden";
      this._flightQ.push({ card, fromRect, opts });
      this._drainFlights();
    }

    _drainFlights() {
      if (this._flying || !this._flightQ || !this._flightQ.length) return;
      const job = this._flightQ.shift();
      const destEl = this._foundationCardEl(job.card.id);
      if (!destEl) { this._drainFlights(); return; } // already buried — skip
      this._flying = true;
      destEl.style.visibility = "hidden";
      const r = destEl.getBoundingClientRect();
      this._animateFly(job.card, job.fromRect, r, () => {
        destEl.style.visibility = "";
        destEl.classList.add("just-played");
        setTimeout(() => destEl.classList.remove("just-played"), 360);
        if (job.opts.onDone) job.opts.onDone();
        this._flying = false;
        this._drainFlights();
      }, job.opts);
    }

    _popDest(id) {
      const el2 = id && this._foundationCardEl(id);
      if (el2) { el2.style.visibility = ""; el2.classList.add("just-played"); setTimeout(() => el2.classList.remove("just-played"), 360); }
    }

    _animateFly(cardData, fromRect, toRect, onComplete, opts) {
      opts = opts || {};
      const c = cardEl({ label: cardData.label, symbol: cardData.symbol, color: cardData.color, rank: cardData.rank, faceUp: true });
      c.classList.add("fly-card");
      c.style.position = "fixed";
      c.style.left = "0"; c.style.top = "0"; c.style.margin = "0";
      c.style.width = fromRect.width + "px";
      c.style.height = fromRect.height + "px";
      document.body.appendChild(c);

      const sx = fromRect.left, sy = fromRect.top;
      const ex = toRect.left + (toRect.width - fromRect.width) / 2;
      const ey = toRect.top + (toRect.height - fromRect.height) / 2;
      const scale = toRect.width / fromRect.width || 1;
      const spin = opts.spin != null ? opts.spin : 10;
      const anim = c.animate(
        [
          { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, boxShadow: "0 6px 16px rgba(0,0,0,.4)" },
          { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 46}px) scale(${(1 + scale) / 2}) rotate(${spin}deg)`, offset: 0.55 },
          { transform: `translate(${ex}px, ${ey}px) scale(${scale}) rotate(0deg)`, boxShadow: "0 14px 34px rgba(0,0,0,.5)" },
        ],
        { duration: opts.duration || 440, easing: "cubic-bezier(.34,.65,.25,1)", fill: "forwards" }
      );
      const fin = () => { c.remove(); onComplete(); };
      anim.onfinish = fin; anim.oncancel = fin;
    }

    toast(msg, gold) {
      const t = el("div", "toast" + (gold ? " gold" : ""));
      t.textContent = msg;
      this.refs.toast.appendChild(t);
      setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; t.style.transition = ".3s"; }, 1600);
      setTimeout(() => t.remove(), 2000);
    }

    confetti() {
      if (document.body.classList.contains("reduce-motion")) return;
      const colors = ["#f5c451", "#38e0a6", "#e2545b", "#5aa9e6", "#fff"];
      const host = this.refs.fx;
      for (let i = 0; i < 90; i++) {
        const c = el("div", "confetti");
        c.style.background = colors[i % colors.length];
        c.style.left = Math.random() * 100 + "vw";
        c.style.top = "-20px";
        const dur = 1400 + Math.random() * 1400;
        const x = (Math.random() - 0.5) * 220;
        host.appendChild(c);
        c.animate(
          [
            { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${x}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 },
          ],
          { duration: dur, easing: "cubic-bezier(.2,.6,.3,1)" }
        ).onfinish = () => c.remove();
      }
    }

    // briefly highlight any cards that can be played (hint)
    flashHints(cards) {
      cards.forEach((id) => {
        const node = document.querySelector(`[data-card-id='${id}']`);
        if (node) {
          node.classList.add("playable-hint");
          setTimeout(() => node.classList.remove("playable-hint"), 1800);
        }
      });
    }
  }

  Nertz.UI = UI;
  Nertz.h = { el, $, cardEl };
})(typeof window !== "undefined" ? window : this);
