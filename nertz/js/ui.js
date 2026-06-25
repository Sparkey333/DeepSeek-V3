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
    const tl = el("div", "corner tl");
    tl.append(el("span", "c-rank", card.label), el("span", "c-suit", card.symbol));
    const br = el("div", "corner br");
    br.append(el("span", "c-rank", card.label), el("span", "c-suit", card.symbol));
    const center = el("div", "pip-center", card.symbol);
    e.append(tl, center, br);
    return e;
  }

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
          this.api.tap && this.api.tap(d.source);
          return;
        }
        const pt = e.changedTouches ? e.changedTouches[0] : e;
        const target = this._dropTargetAt(pt.clientX, pt.clientY);
        if (target) this.api.drop && this.api.drop(d.source, target);
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
