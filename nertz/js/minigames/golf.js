/* golf.js — Golf Solitaire minigame (solo course challenge). KEY = 'golf'. */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  Nertz.minigames = Nertz.minigames || {};

  const STYLE_ID = "mg-golf-style";
  const CSS = [
    ".gf-overlay{position:fixed;inset:0;background:rgba(3,12,9,.7);z-index:90;",
    "display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}",
    ".gf-sheet{position:relative;width:100%;max-width:540px;margin:16px auto;",
    "background:linear-gradient(180deg,var(--felt-1),var(--felt-2) 60%,var(--felt-3));",
    "border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:16px;",
    "box-shadow:0 24px 60px rgba(0,0,0,.5);color:var(--text);box-sizing:border-box;",
    "--card-w:40px;--card-h:56px;}",
    ".gf-quit{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;",
    "border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);",
    "font-size:15px;font-weight:700;cursor:pointer;line-height:1;z-index:5;}",
    ".gf-quit:hover{background:rgba(255,255,255,.14);}",
    ".gf-head{padding-right:38px;margin-bottom:10px;}",
    ".gf-title{font-size:19px;font-weight:800;color:var(--gold);}",
    ".gf-sub{font-size:12px;color:var(--text-dim);margin-top:2px;}",
    ".gf-meter{margin-bottom:10px;}",
    ".gf-meter-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);margin-bottom:4px;}",
    ".gf-meter-row b{color:var(--text);font-size:13px;}",
    ".gf-chain{margin-left:auto;color:var(--gold);font-weight:800;font-size:12px;}",
    ".gf-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;}",
    ".gf-bar-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--accent-deep),var(--accent));transition:width .35s ease;}",
    ".gf-topline{display:flex;align-items:center;gap:14px;margin-bottom:12px;padding-bottom:12px;",
    "border-bottom:1px dashed rgba(255,255,255,.12);--card-w:56px;--card-h:78px;}",
    ".gf-stock,.gf-foundation{position:relative;width:var(--card-w);height:var(--card-h);}",
    ".gf-stock{cursor:pointer;}",
    ".gf-stock.gf-empty{cursor:default;}",
    ".gf-count{position:absolute;bottom:-6px;right:-6px;background:var(--gold);color:#2a1e00;",
    "font-size:10px;font-weight:800;border-radius:9px;padding:1px 6px;}",
    ".gf-empty-slot{width:100%;height:100%;border:2px dashed rgba(255,255,255,.18);border-radius:11px;",
    "display:grid;place-items:center;font-size:10px;color:var(--text-dim);}",
    ".gf-table{display:flex;gap:3px;overflow-x:auto;}",
    ".gf-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;}",
    ".gf-col .card:not(:first-child){margin-top:calc(var(--card-h) * -0.62);}",
    ".gf-col-empty{width:var(--card-w);height:var(--card-h);border:1.5px dashed rgba(255,255,255,.14);border-radius:9px;}",
    ".gf-exposed{cursor:pointer;transition:transform .15s ease;}",
    ".gf-exposed:hover{transform:translateY(-3px);}",
    ".gf-buried{pointer-events:none;}",
    ".gf-playable{box-shadow:0 0 0 2px var(--accent),0 0 8px rgba(56,224,166,.55);}",
    "@keyframes gf-shake-kf{10%,90%{transform:translateX(-1px);}20%,80%{transform:translateX(2px);}",
    "30%,50%,70%{transform:translateX(-4px);}40%,60%{transform:translateX(4px);}}",
    ".gf-shake{animation:gf-shake-kf .4s linear;}",
    ".gf-end{display:none;position:absolute;inset:10px;border-radius:16px;background:rgba(6,18,14,.94);",
    "align-items:center;justify-content:center;flex-direction:column;text-align:center;gap:10px;",
    "padding:20px;z-index:10;}",
    ".gf-end.show{display:flex;}",
    ".gf-end-title{font-size:22px;font-weight:800;color:var(--gold);}",
    ".gf-end-detail{font-size:14px;color:var(--text-dim);max-width:320px;}",
    ".gf-btn{border:0;border-radius:12px;padding:10px 22px;font-weight:800;font-size:14px;cursor:pointer;}",
    ".gf-btn-primary{background:linear-gradient(180deg,var(--accent),var(--accent-deep));color:#062018;}",
  ].join("");

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function open(opts) {
    opts = opts || {};
    ensureStyle();
    const H = Nertz.h, D = Nertz.deck, A = Nertz.audio;
    const stake = Math.max(0, Math.floor(opts.stake || 0));
    const opponent = opts.opponent;
    const onDone = typeof opts.onDone === "function" ? opts.onDone : function () {};

    let target = 25;
    if (opts.config && Number.isFinite(opts.config.target)) target = opts.config.target;
    target = Math.max(1, Math.min(35, Math.round(target)));

    // ---- deal ----
    const deck = D.shuffle(D.buildDeck("mg"));
    let di = 0;
    const columns = [];
    for (let c = 0; c < 7; c++) {
      const col = [];
      for (let r = 0; r < 5; r++) {
        const card = deck[di++];
        card.faceUp = true;
        col.push(card);
      }
      columns.push(col);
    }
    const stock = deck.slice(di);
    let foundation = stock.shift();
    foundation.faceUp = true;

    let cleared = 0, chain = 0, gameOver = false, finished = false;

    // ---- DOM scaffold ----
    const overlay = document.createElement("div");
    overlay.className = "gf-overlay";
    overlay.innerHTML =
      '<div class="gf-sheet">' +
        '<button class="gf-quit" type="button" aria-label="Quit">✕</button>' +
        '<div class="gf-head"><div class="gf-title">⛳ Golf Solitaire</div><div class="gf-sub"></div></div>' +
        '<div class="gf-meter">' +
          '<div class="gf-meter-row"><span>Cleared</span><b class="gf-cleared"></b><span class="gf-chain" hidden></span></div>' +
          '<div class="gf-bar"><div class="gf-bar-fill"></div></div>' +
        "</div>" +
        '<div class="gf-topline"><div class="gf-stock"></div><div class="gf-foundation"></div></div>' +
        '<div class="gf-table"></div>' +
        '<div class="gf-end">' +
          '<div class="gf-end-title"></div>' +
          '<div class="gf-end-detail"></div>' +
          '<button type="button" class="gf-btn gf-btn-primary gf-continue">Continue</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    const subEl = overlay.querySelector(".gf-sub");
    subEl.textContent = (opponent && opponent.name)
      ? (opponent.avatar || "⛳") + " Challenge from " + opponent.name
      : "Solo Course Challenge";

    const clearedEl = overlay.querySelector(".gf-cleared");
    const chainEl = overlay.querySelector(".gf-chain");
    const barFill = overlay.querySelector(".gf-bar-fill");
    const stockPile = overlay.querySelector(".gf-stock");
    const foundationPile = overlay.querySelector(".gf-foundation");
    const tableEl = overlay.querySelector(".gf-table");
    const endPanel = overlay.querySelector(".gf-end");
    const endTitle = overlay.querySelector(".gf-end-title");
    const endDetail = overlay.querySelector(".gf-end-detail");
    const continueBtn = overlay.querySelector(".gf-continue");
    const quitBtn = overlay.querySelector(".gf-quit");

    function shakeNode(node) {
      node.classList.add("gf-shake");
      node.addEventListener("animationend", function h() {
        node.classList.remove("gf-shake");
        node.removeEventListener("animationend", h);
      }, { once: true });
    }

    function anyLegalMove() {
      return columns.some(function (col) {
        if (!col.length) return false;
        return Math.abs(col[col.length - 1].rank - foundation.rank) === 1;
      });
    }

    function updateMeter() {
      clearedEl.textContent = cleared + " / " + target;
      barFill.style.width = Math.min(100, Math.round((cleared / target) * 100)) + "%";
      if (chain >= 2) { chainEl.hidden = false; chainEl.textContent = "🔥 ×" + chain; }
      else { chainEl.hidden = true; }
    }

    function renderStockFoundation() {
      stockPile.innerHTML = "";
      if (stock.length > 0) {
        stockPile.classList.remove("gf-empty");
        stockPile.appendChild(H.cardEl({ faceUp: false }));
        const badge = document.createElement("div");
        badge.className = "gf-count";
        badge.textContent = String(stock.length);
        stockPile.appendChild(badge);
      } else {
        stockPile.classList.add("gf-empty");
        const ph = document.createElement("div");
        ph.className = "gf-empty-slot";
        ph.textContent = "Empty";
        stockPile.appendChild(ph);
      }
      foundationPile.innerHTML = "";
      foundationPile.appendChild(H.cardEl(foundation));
    }

    function renderTableau() {
      tableEl.innerHTML = "";
      columns.forEach(function (col, ci) {
        const colEl = document.createElement("div");
        colEl.className = "gf-col";
        if (!col.length) {
          const ph = document.createElement("div");
          ph.className = "gf-col-empty";
          colEl.appendChild(ph);
        } else {
          col.forEach(function (card, i) {
            const node = H.cardEl(card);
            if (i === col.length - 1) {
              node.classList.add("gf-exposed");
              if (Math.abs(card.rank - foundation.rank) === 1) node.classList.add("gf-playable");
              node.addEventListener("click", function () { tapColumn(ci, node); });
            } else {
              node.classList.add("gf-buried");
            }
            colEl.appendChild(node);
          });
        }
        tableEl.appendChild(colEl);
      });
    }

    function render() {
      updateMeter();
      renderStockFoundation();
      renderTableau();
    }

    function tapColumn(ci, node) {
      if (gameOver) return;
      const col = columns[ci];
      if (!col.length) return;
      const card = col[col.length - 1];
      const legal = Math.abs(card.rank - foundation.rank) === 1;
      if (legal) {
        col.pop();
        foundation = card;
        cleared++;
        chain++;
        A.play("play");
        render();
        if (cleared >= 35) { endGame(); return; }
        if (stock.length === 0 && !anyLegalMove()) endGame();
      } else {
        A.play("invalid");
        chain = 0;
        updateMeter();
        shakeNode(node);
      }
    }

    function tapStock() {
      if (gameOver) return;
      if (!stock.length) {
        A.play("invalid");
        shakeNode(stockPile);
        return;
      }
      const next = stock.shift();
      next.faceUp = true;
      foundation = next;
      chain = 0;
      A.play("flip");
      render();
      if (stock.length === 0 && !anyLegalMove()) endGame();
    }
    stockPile.addEventListener("click", tapStock);

    function endGame() {
      gameOver = true;
      const won = cleared >= target;
      const delta = won ? stake : -Math.ceil(stake / 2);
      A.play(won ? "win" : "lose");
      endTitle.textContent = won ? "⛳ Course Cleared!" : "🚧 Round Over";
      endDetail.textContent = won
        ? "Cleared " + cleared + "/" + target + " cards — great round! +" + delta + " coins"
        : "Cleared " + cleared + "/" + target + " cards — couldn't finish. " + delta + " coins";
      endPanel.classList.add("show");
      const summary = won
        ? "Cleared " + cleared + "/" + target + " — carded a win! +" + delta + " coins"
        : "Cleared " + cleared + "/" + target + " — the course won this time. " + delta + " coins";
      continueBtn.onclick = function () { finish({ won: won, delta: delta, summary: summary }); };
    }

    function finish(result) {
      if (finished) return;
      finished = true;
      overlay.remove();
      onDone(result);
    }

    quitBtn.addEventListener("click", function () {
      if (finished) return;
      gameOver = true;
      const delta = -Math.ceil(stake / 2);
      const summary = "Quit after clearing " + cleared + "/" + target + ". " + delta + " coins";
      A.play("lose");
      finish({ won: false, delta: delta, summary: summary });
    });

    render();
  }

  Nertz.minigames.golf = { open: open };
})(typeof window !== "undefined" ? window : this);

/* manual test
   In the browser console (after loading nertz/index.html so deck.js, ui.js,
   audio.js and this file are all present):

     Nertz.minigames.golf.open({
       stake: 20,
       opponent: { name: 'Tester', avatar: '🦝' },
       onDone: r => console.log(r)
     })

   Checks:
   - 7 columns of 5 face-up fanned cards render, only the bottom card of
     each column has a subtle glow when it is +/-1 rank from the foundation
     (suit ignored; try tapping an Ace when the foundation shows a King —
     it must NOT be playable, and vice versa: A only pairs with 2, K only
     with Q).
   - Tapping a glowing (legal) card clears it, plays 'play', increments the
     "Cleared X / 25" meter and (after 2+ in a row) shows a "chain" badge
     that resets on a miss or a stock flip.
   - Tapping a non-glowing exposed card shakes it and plays 'invalid'; the
     buried cards above it are not clickable at all.
   - Tapping the stock flips the next card face up as the new foundation
     top, plays 'flip', and can change which tableau cards are highlighted.
   - Keep playing until either all 35 tableau cards clear, or the stock
     empties with no legal tableau move left; a win/lose panel appears with
     the right coin delta (+stake if cleared>=25, else -Math.ceil(stake/2)),
     plays 'win'/'lose', and clicking Continue removes the overlay and
     calls onDone exactly once with {won, delta, summary}.
   - Clicking ✕ at any point before that immediately forfeits with
     delta = -Math.ceil(stake/2) and also calls onDone exactly once.
*/
