/* blackjack.js — Nertz Royale minigame: one hand of blackjack vs a dealer.
 * Plain JS, zero-build, classic <script> tag, file:// friendly. */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  Nertz.minigames = Nertz.minigames || {};

  const KEY = "blackjack";

  // ---- pure total calculation --------------------------------------------
  function calcTotal(cards) {
    let hard = 0, aces = 0;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].rank;
      if (r === 1) { hard += 1; aces++; }
      else if (r >= 11) hard += 10;
      else hard += r;
    }
    const soft = (aces > 0 && hard + 10 <= 21) ? hard + 10 : null;
    const value = soft != null ? soft : hard;
    return { hard: hard, soft: soft, value: value, isSoft: soft != null, bust: hard > 21 };
  }
  function totalLabel(t) {
    return t.isSoft ? (t.hard + " / " + t.soft) : String(t.value);
  }
  function isBlackjack(cards) {
    return cards.length === 2 && calcTotal(cards).value === 21;
  }

  // ---- style injection (once) --------------------------------------------
  function ensureStyle() {
    if (document.getElementById("mg-bj-style")) return;
    const css = [
      ".bj-overlay{position:fixed;inset:0;background:rgba(3,12,9,.7);z-index:90;",
      "display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit;}",
      ".bj-sheet{max-width:540px;width:100%;margin:16px;border-radius:20px;padding:20px;",
      "background:linear-gradient(180deg,#10334a,#0a2133);color:var(--text,#eaf3ef);",
      "position:relative;box-shadow:0 20px 60px rgba(0,0,0,.5);box-sizing:border-box;}",
      ".bj-quit{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:10px;",
      "border:0;background:rgba(255,255,255,.08);color:var(--text,#eaf3ef);font-size:16px;",
      "cursor:pointer;line-height:1;}",
      ".bj-quit:hover{background:rgba(255,255,255,.16);}",
      ".bj-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}",
      ".bj-opp-avatar{font-size:28px;}",
      ".bj-opp-name{font-weight:800;color:var(--gold,#f5c451);}",
      ".bj-title{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim,#9fc3b4);}",
      ".bj-stake{margin-left:auto;font-weight:800;color:var(--gold,#f5c451);",
      "background:rgba(245,196,81,.12);border-radius:10px;padding:4px 10px;font-size:13px;}",
      ".bj-table{display:flex;flex-direction:column;gap:16px;background:rgba(0,0,0,.18);",
      "border-radius:var(--radius,16px);padding:14px;margin-bottom:12px;}",
      ".bj-side .bj-label{display:flex;align-items:center;gap:8px;font-size:12px;",
      "text-transform:uppercase;letter-spacing:.06em;color:var(--text-dim,#9fc3b4);margin-bottom:6px;}",
      ".bj-total{font-variant-numeric:tabular-nums;font-weight:800;color:var(--text,#eaf3ef);",
      "background:rgba(255,255,255,.08);border-radius:8px;padding:1px 8px;font-size:13px;}",
      ".bj-hand{display:flex;flex-wrap:wrap;gap:8px;min-height:var(--card-h,106px);}",
      ".bj-flip-anim{animation:bjFlip .4s ease;}",
      "@keyframes bjFlip{0%{transform:scaleX(1);}45%{transform:scaleX(0);}100%{transform:scaleX(1);}}",
      ".bj-message{min-height:20px;text-align:center;font-weight:700;color:var(--text-dim,#9fc3b4);",
      "margin-bottom:10px;font-size:14px;}",
      ".bj-actions{display:flex;gap:10px;}",
      ".bj-btn{flex:1;border:0;border-radius:12px;padding:12px 8px;font-weight:800;font-size:14px;",
      "cursor:pointer;background:linear-gradient(180deg,var(--accent,#38e0a6),var(--accent-deep,#16a079));",
      "color:#062018;transition:transform .1s,opacity .15s;}",
      ".bj-btn:active{transform:scale(.96);}",
      ".bj-btn:disabled{opacity:.35;cursor:default;transform:none;}",
      ".bj-btn.bj-double{background:linear-gradient(180deg,var(--gold,#f5c451),var(--gold-deep,#d39a26));}",
      ".bj-end{text-align:center;}",
      ".bj-end-title{font-size:20px;font-weight:900;margin-bottom:6px;}",
      ".bj-end-title.bj-win{color:var(--accent,#38e0a6);}",
      ".bj-end-title.bj-lose{color:var(--red-soft,#e2545b);}",
      ".bj-end-delta{font-size:15px;font-weight:800;color:var(--gold,#f5c451);margin-bottom:14px;}",
      ".bj-btn.bj-continue{background:linear-gradient(180deg,var(--gold,#f5c451),var(--gold-deep,#d39a26));",
      "width:100%;}",
      "@media (max-width:400px){.bj-sheet{padding:14px;}.bj-btn{font-size:13px;padding:10px 6px;}}"
    ].join("");
    const style = document.createElement("style");
    style.id = "mg-bj-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // ---- main entry ---------------------------------------------------------
  function open(opts) {
    opts = opts || {};
    const stake = Math.max(0, Math.floor(opts.stake || 0));
    const opponent = Object.assign({ name: "Dealer", avatar: "🤵" }, opts.opponent || {});
    const onDone = typeof opts.onDone === "function" ? opts.onDone : function () {};
    const H = g.Nertz.h;
    const audio = g.Nertz.audio || { play: function () {} };

    ensureStyle();

    let deckArr = g.Nertz.deck.shuffle(g.Nertz.deck.buildDeck("mg"));
    let player = [];
    let dealer = [];
    let doubled = false;
    let ended = false;
    let done = false;
    const timers = new Set();

    function later(ms, fn) {
      const id = setTimeout(function () { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    }
    function clearTimers() {
      timers.forEach(function (id) { clearTimeout(id); });
      timers.clear();
    }
    function draw() { return deckArr.pop(); }

    // ---- DOM scaffold -----------------------------------------------------
    const overlay = el("div", "bj-overlay");
    const sheet = el("div", "bj-sheet");
    overlay.appendChild(sheet);

    const quitBtn = el("button", "bj-quit", "✕");
    quitBtn.type = "button";
    quitBtn.setAttribute("aria-label", "Quit");
    sheet.appendChild(quitBtn);

    const header = el("div", "bj-header");
    const avatarEl = el("div", "bj-opp-avatar", opponent.avatar);
    const nameWrap = el("div", "");
    const titleEl = el("div", "bj-title", "Blackjack vs");
    const nameEl = el("div", "bj-opp-name", opponent.name);
    nameWrap.append(titleEl, nameEl);
    const stakeEl = el("div", "bj-stake", "Stake " + stake);
    header.append(avatarEl, nameWrap, stakeEl);
    sheet.appendChild(header);

    const table = el("div", "bj-table");
    const dealerSide = el("div", "bj-side");
    const dealerLabel = el("div", "bj-label");
    dealerLabel.append(el("span", "", "Dealer"), (function () { const s = el("span", "bj-total", "0"); dealerLabel._total = s; return s; })());
    const dealerTotalEl = dealerLabel._total;
    const dealerHandEl = el("div", "bj-hand bj-dealer-hand");
    dealerSide.append(dealerLabel, dealerHandEl);

    const playerSide = el("div", "bj-side");
    const playerLabel = el("div", "bj-label");
    playerLabel.append(el("span", "", "You"), (function () { const s = el("span", "bj-total", "0"); playerLabel._total = s; return s; })());
    const playerTotalEl = playerLabel._total;
    const playerHandEl = el("div", "bj-hand bj-player-hand");
    playerSide.append(playerLabel, playerHandEl);

    table.append(dealerSide, playerSide);
    sheet.appendChild(table);

    const messageEl = el("div", "bj-message", "Dealing…");
    sheet.appendChild(messageEl);

    const actions = el("div", "bj-actions");
    const hitBtn = el("button", "bj-btn bj-hit", "Hit");
    const standBtn = el("button", "bj-btn bj-stand", "Stand");
    const doubleBtn = el("button", "bj-btn bj-double", "Double");
    [hitBtn, standBtn, doubleBtn].forEach(function (b) { b.type = "button"; b.disabled = true; });
    actions.append(hitBtn, standBtn, doubleBtn);
    sheet.appendChild(actions);

    const endPanel = el("div", "bj-end");
    endPanel.hidden = true;
    const endTitle = el("div", "bj-end-title", "");
    const endDelta = el("div", "bj-end-delta", "");
    const continueBtn = el("button", "bj-btn bj-continue", "Continue");
    continueBtn.type = "button";
    endPanel.append(endTitle, endDelta, continueBtn);
    sheet.appendChild(endPanel);

    document.body.appendChild(overlay);

    // ---- rendering ----------------------------------------------------
    function renderHands() {
      playerHandEl.innerHTML = "";
      player.forEach(function (c) { playerHandEl.appendChild(H.cardEl(c)); });
      dealerHandEl.innerHTML = "";
      dealer.forEach(function (c) { dealerHandEl.appendChild(H.cardEl(c)); });
      playerTotalEl.textContent = totalLabel(calcTotal(player));
      const visibleDealer = dealer.filter(function (c) { return c.faceUp; });
      dealerTotalEl.textContent = dealer.length ? totalLabel(calcTotal(visibleDealer)) : "0";
    }

    function drawTo(hand, faceUp) {
      const c = draw();
      if (!c) return null;
      c.faceUp = faceUp;
      hand.push(c);
      audio.play("deal");
      renderHands();
      return c;
    }

    function revealHole() {
      const hole = dealer.find(function (c) { return !c.faceUp; });
      if (!hole) return;
      hole.faceUp = true;
      audio.play("flip");
      renderHands();
      const nodes = dealerHandEl.querySelectorAll(".card");
      const idx = dealer.indexOf(hole);
      if (nodes[idx]) nodes[idx].classList.add("bj-flip-anim");
    }

    function setActionsEnabled(hit, stand, dbl) {
      hitBtn.disabled = !hit;
      standBtn.disabled = !stand;
      doubleBtn.disabled = !dbl;
    }

    // ---- finish / teardown ------------------------------------------------
    function finalize(delta, summary) {
      if (done) return;
      done = true;
      clearTimers();
      overlay.remove();
      onDone({ won: delta > 0, delta: delta, summary: summary });
    }

    function showEnd(delta, headline) {
      ended = true;
      setActionsEnabled(false, false, false);
      messageEl.textContent = "";
      actions.hidden = true;
      endPanel.hidden = false;
      endTitle.textContent = headline;
      endTitle.className = "bj-end-title " + (delta > 0 ? "bj-win" : delta < 0 ? "bj-lose" : "");
      endDelta.textContent = delta > 0 ? ("+" + delta + " coins") : delta < 0 ? (delta + " coins") : "Push — stake returned";
      if (delta > 0) audio.play("win");
      else if (delta < 0) audio.play("lose");
      continueBtn.onclick = function () { finalize(delta, headline); };
    }

    quitBtn.onclick = function () {
      if (done || ended) return;
      audio.play("select");
      finalize(-stake, "Folded — stake forfeited.");
    };

    // ---- settlement ---------------------------------------------------
    function settleAfterStand() {
      const pt = calcTotal(player);
      const dt = calcTotal(dealer);
      const mult = doubled ? 2 : 1;
      if (dt.bust) showEnd(stake * mult, "Dealer busts! You win!");
      else if (pt.value > dt.value) showEnd(stake * mult, "You win!");
      else if (pt.value < dt.value) showEnd(-stake * mult, "Dealer wins.");
      else showEnd(0, "Push.");
    }

    function dealerStep() {
      const t = calcTotal(dealer);
      if (t.value < 17) {
        drawTo(dealer, true);
        later(650, dealerStep);
      } else {
        settleAfterStand();
      }
    }

    function dealerTurn() {
      messageEl.textContent = "Dealer's turn…";
      later(450, function () {
        revealHole();
        later(600, dealerStep);
      });
    }

    function endOnPlayerBust() {
      const mult = doubled ? 2 : 1;
      later(350, function () {
        revealHole();
        later(500, function () { showEnd(-stake * mult, "Bust! You lose."); });
      });
    }

    function resolveNaturalBlackjack() {
      messageEl.textContent = "Blackjack!";
      later(450, function () {
        revealHole();
        later(600, function () {
          if (isBlackjack(dealer)) showEnd(0, "Both blackjack — push.");
          else showEnd(Math.ceil(1.5 * stake), "Blackjack! 3:2 payout.");
        });
      });
    }

    // ---- player actions -----------------------------------------------
    function afterPlayerCardsChanged() {
      const t = calcTotal(player);
      if (t.bust) { setActionsEnabled(false, false, false); endOnPlayerBust(); return; }
      setActionsEnabled(true, true, player.length === 2);
    }

    hitBtn.onclick = function () {
      if (ended || hitBtn.disabled) return;
      audio.play("select");
      drawTo(player, true);
      afterPlayerCardsChanged();
    };
    standBtn.onclick = function () {
      if (ended || standBtn.disabled) return;
      audio.play("select");
      setActionsEnabled(false, false, false);
      dealerTurn();
    };
    doubleBtn.onclick = function () {
      if (ended || doubleBtn.disabled || player.length !== 2) return;
      audio.play("select");
      doubled = true;
      setActionsEnabled(false, false, false);
      drawTo(player, true);
      const t = calcTotal(player);
      if (t.bust) endOnPlayerBust(); else dealerTurn();
    };

    // ---- initial deal ---------------------------------------------------
    function dealInitial() {
      later(0, function () { drawTo(player, true); });
      later(300, function () { drawTo(dealer, true); });
      later(600, function () { drawTo(player, true); });
      later(900, function () {
        drawTo(dealer, false);
        if (isBlackjack(player)) resolveNaturalBlackjack();
        else { messageEl.textContent = "Your move."; afterPlayerCardsChanged(); }
      });
    }

    dealInitial();
  }

  Nertz.minigames[KEY] = { open: open };
})(typeof window !== "undefined" ? window : this);

/* manual test — from the browser console on the Nertz Royale page:
Nertz.minigames.blackjack.open({stake:20, opponent:{name:'Tester',avatar:'🦝'}, onDone:r=>console.log(r)})
*/
