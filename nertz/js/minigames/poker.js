/* poker.js — heads-up 5-card draw minigame for Nertz Royale story mode.
 * Contract: Nertz.minigames.poker.open({stake, opponent, config, onDone})
 * onDone fires exactly once with {won, delta, summary}.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  Nertz.minigames = Nertz.minigames || {};

  const CAT_NAMES = ["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight",
    "Flush", "Full House", "Four of a Kind", "Straight Flush"];
  const RANK_WORDS = { 2:"Twos",3:"Threes",4:"Fours",5:"Fives",6:"Sixes",7:"Sevens",8:"Eights",
    9:"Nines",10:"Tens",11:"Jacks",12:"Queens",13:"Kings",14:"Aces" };

  // ---- pure hand evaluation ----------------------------------------------
  // Returns {cat, tie:[...], name} — compare cat first, then tie lexicographically.
  // Aces are high (14) except in the wheel straight A-2-3-4-5 (high card 5).
  function evaluate(cards) {
    const vals = cards.map((c) => (c.rank === 1 ? 14 : c.rank)).sort((a, b) => b - a);
    const suits = cards.map((c) => c.suit);
    const isFlush = suits.every((s) => s === suits[0]);
    // straight detection (incl. wheel)
    let straightHigh = 0;
    const uniq = Array.from(new Set(vals));
    if (uniq.length === 5) {
      if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
      else if (uniq[0] === 14 && uniq[1] === 5 && uniq[1] - uniq[4] === 3) straightHigh = 5; // wheel
    }
    // rank counts
    const counts = {};
    vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    // groups sorted by count desc, then value desc
    const groups = Object.keys(counts).map(Number)
      .map((v) => ({ v, n: counts[v] }))
      .sort((a, b) => b.n - a.n || b.v - a.v);

    let cat, tie, name;
    if (straightHigh && isFlush) {
      cat = 8; tie = [straightHigh];
      name = straightHigh === 14 ? "Royal Flush" : "Straight Flush, " + hi(straightHigh) + " high";
    } else if (groups[0].n === 4) {
      cat = 7; tie = [groups[0].v, groups[1].v];
      name = "Four of a Kind, " + RANK_WORDS[groups[0].v];
    } else if (groups[0].n === 3 && groups[1].n === 2) {
      cat = 6; tie = [groups[0].v, groups[1].v];
      name = "Full House, " + RANK_WORDS[groups[0].v] + " over " + RANK_WORDS[groups[1].v];
    } else if (isFlush) {
      cat = 5; tie = vals.slice();
      name = "Flush, " + hi(vals[0]) + " high";
    } else if (straightHigh) {
      cat = 4; tie = [straightHigh];
      name = "Straight, " + hi(straightHigh) + " high";
    } else if (groups[0].n === 3) {
      cat = 3; tie = [groups[0].v].concat(groups.slice(1).map((x) => x.v));
      name = "Three of a Kind, " + RANK_WORDS[groups[0].v];
    } else if (groups[0].n === 2 && groups[1].n === 2) {
      cat = 2; tie = [groups[0].v, groups[1].v, groups[2].v];
      name = "Two Pair, " + RANK_WORDS[groups[0].v] + " over " + RANK_WORDS[groups[1].v];
    } else if (groups[0].n === 2) {
      cat = 1; tie = [groups[0].v].concat(groups.slice(1).map((x) => x.v));
      name = "Pair of " + RANK_WORDS[groups[0].v];
    } else {
      cat = 0; tie = vals.slice();
      name = "High Card, " + hi(vals[0]);
    }
    return { cat, tie, name };
  }
  function hi(v) { return v === 14 ? "Ace" : v === 13 ? "King" : v === 12 ? "Queen" : v === 11 ? "Jack" : String(v); }
  function compare(a, b) { // >0 a wins, <0 b wins, 0 tie
    if (a.cat !== b.cat) return a.cat - b.cat;
    for (let i = 0; i < Math.max(a.tie.length, b.tie.length); i++) {
      const d = (a.tie[i] || 0) - (b.tie[i] || 0);
      if (d) return d;
    }
    return 0;
  }

  // AI hold strategy: keep grouped ranks (pairs+); else keep J+ high cards (max 2).
  function aiHolds(cards) {
    const counts = {};
    cards.forEach((c) => { const v = c.rank === 1 ? 14 : c.rank; counts[v] = (counts[v] || 0) + 1; });
    const holds = cards.map((c) => counts[c.rank === 1 ? 14 : c.rank] >= 2);
    if (holds.some(Boolean)) return holds;
    // no pair: keep up to two high cards (J,Q,K,A)
    let kept = 0;
    return cards.map((c) => {
      const v = c.rank === 1 ? 14 : c.rank;
      if (v >= 11 && kept < 2) { kept++; return true; }
      return false;
    });
  }

  const CSS = "" +
    ".pk-overlay{position:fixed;inset:0;background:rgba(3,12,9,.72);z-index:90;display:flex;align-items:center;justify-content:center;padding:14px;}" +
    ".pk-sheet{width:100%;max-width:540px;background:linear-gradient(180deg,#10334a,#0a2133);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;position:relative;color:var(--text,#eee);--card-w:58px;--card-h:81px;}" +
    ".pk-quit{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:inherit;cursor:pointer;font-weight:700;}" +
    ".pk-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;}" +
    ".pk-ava{font-size:30px;}.pk-name{font-weight:800;}.pk-stake{margin-left:auto;color:var(--gold,#f5c451);font-weight:800;}" +
    ".pk-row{display:flex;gap:6px;justify-content:center;min-height:calc(var(--card-h) + 14px);margin:8px 0;}" +
    ".pk-row .card{cursor:pointer;transition:transform .15s;}" +
    ".pk-hold{transform:translateY(-10px);box-shadow:0 0 0 2px var(--accent,#38e0a6),0 8px 18px rgba(0,0,0,.4)!important;}" +
    ".pk-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim,#9ab);text-align:center;}" +
    ".pk-hand-name{text-align:center;font-weight:700;font-size:13px;min-height:17px;color:var(--gold,#f5c451);}" +
    ".pk-actions{display:flex;gap:10px;margin-top:14px;}" +
    ".pk-btn{flex:1;padding:12px;border-radius:12px;border:0;font-weight:800;font-size:14px;cursor:pointer;background:rgba(255,255,255,.1);color:inherit;}" +
    ".pk-btn.primary{background:linear-gradient(180deg,var(--accent,#38e0a6),var(--accent-deep,#16a079));color:#062018;}" +
    ".pk-msg{text-align:center;font-size:14px;margin-top:10px;min-height:20px;font-weight:600;}" +
    ".pk-result{text-align:center;font-size:20px;font-weight:850;margin-top:8px;}";

  function injectCss() {
    if (document.getElementById("mg-poker-style")) return;
    const s = document.createElement("style");
    s.id = "mg-poker-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function sfx(n) { try { Nertz.audio && Nertz.audio.play(n); } catch (e) {} }

  function open(opts) {
    opts = opts || {};
    const stake = Math.max(1, opts.stake || 20);
    const opp = opts.opponent || { name: "Stranger", avatar: "🎩" };
    injectCss();

    let done = false;
    let mult = 1; // doubled-or-nothing multiplier
    const finish = (won, delta, summary) => {
      if (done) return;
      done = true;
      overlay.remove();
      if (opts.onDone) opts.onDone({ won: won, delta: delta, summary: summary });
    };

    const deck = Nertz.deck.shuffle(Nertz.deck.buildDeck("mg"));
    deck.forEach((c) => (c.faceUp = true));
    let player = deck.slice(0, 5);
    let ai = deck.slice(5, 10);
    let next = 10;
    const holds = [false, false, false, false, false];

    const overlay = el("div", "pk-overlay");
    const sheet = el("div", "pk-sheet");
    overlay.appendChild(sheet);

    const quit = el("button", "pk-quit", "✕");
    quit.addEventListener("click", () => { sfx("lose"); finish(false, -stake * mult, "Folded — forfeit."); });
    sheet.appendChild(quit);

    const head = el("div", "pk-head");
    head.append(el("div", "pk-ava", opp.avatar), el("div", "pk-name", opp.name), el("div", "pk-stake", stake + " ◈"));
    sheet.appendChild(head);

    const aiLabel = el("div", "pk-label", opp.name + "'s hand");
    const aiRow = el("div", "pk-row");
    const aiName = el("div", "pk-hand-name", "");
    const myLabel = el("div", "pk-label", "Your hand — tap cards to HOLD");
    const myRow = el("div", "pk-row");
    const myName = el("div", "pk-hand-name", "");
    const msg = el("div", "pk-msg", "");
    const result = el("div", "pk-result", "");
    const actions = el("div", "pk-actions");
    sheet.append(aiLabel, aiRow, aiName, myLabel, myRow, myName, msg, result, actions);

    let phase = "hold"; // hold -> offer? -> showdown

    function renderRows(showAi) {
      aiRow.innerHTML = "";
      ai.forEach((c) => aiRow.appendChild(Nertz.h.cardEl(showAi ? c : { faceUp: false })));
      myRow.innerHTML = "";
      player.forEach((c, i) => {
        const node = Nertz.h.cardEl(c);
        if (phase === "hold") {
          if (holds[i]) node.classList.add("pk-hold");
          node.addEventListener("click", () => {
            holds[i] = !holds[i];
            sfx("play");
            renderRows(false);
          });
        }
        myRow.appendChild(node);
      });
      myName.textContent = evaluate(player).name;
    }

    function setActions(list) {
      actions.innerHTML = "";
      list.forEach((b) => {
        const btn = el("button", "pk-btn" + (b.primary ? " primary" : ""), b.text);
        btn.addEventListener("click", b.fn);
        actions.appendChild(btn);
      });
    }

    function draw() {
      phase = "drawn";
      sfx("deal");
      player = player.map((c, i) => (holds[i] ? c : deck[next++]));
      const keep = aiHolds(ai);
      ai = ai.map((c, i) => (keep[i] ? c : deck[next++]));
      const aiEval = evaluate(ai);
      renderRows(false);
      // double-or-nothing offer, scaled by AI strength
      const offerProb = aiEval.cat >= 2 ? Math.min(0.7, 0.25 + 0.15 * aiEval.cat) : 0;
      if (Math.random() < offerProb) {
        phase = "offer";
        msg.textContent = opp.name + ": \"Double or nothing?\"";
        sfx("select");
        setActions([
          { text: "Decline", fn: () => showdown() },
          { text: "Accept (x2)", primary: true, fn: () => { mult = 2; showdown(); } },
        ]);
      } else {
        showdown();
      }
    }

    function showdown() {
      phase = "showdown";
      msg.textContent = "";
      sfx("flip");
      renderRows(true);
      const pe = evaluate(player), ae = evaluate(ai);
      aiName.textContent = ae.name;
      const cmp = compare(pe, ae);
      const wager = stake * mult;
      let delta, txt, won;
      if (cmp > 0) { won = true; delta = wager; txt = "You win +" + wager + " ◈"; sfx("win"); }
      else if (cmp < 0) { won = false; delta = -wager; txt = "You lose −" + wager + " ◈"; sfx("lose"); }
      else { won = false; delta = 0; txt = "Push — dead heat."; sfx("select"); }
      result.textContent = txt;
      const summary = pe.name + " vs " + ae.name + (mult === 2 ? " (doubled)" : "");
      setActions([{ text: "Close", primary: true, fn: () => finish(won, delta, summary) }]);
    }

    sfx("deal");
    renderRows(false);
    setActions([{ text: "Draw", primary: true, fn: draw }]);
    document.body.appendChild(overlay);
  }

  Nertz.minigames.poker = { open: open, _evaluate: evaluate, _compare: compare };
})(typeof window !== "undefined" ? window : this);

/* manual test:
   Nertz.minigames.poker.open({stake:20, opponent:{name:'Tester',avatar:'🦝'}, onDone:r=>console.log(r)})
*/
