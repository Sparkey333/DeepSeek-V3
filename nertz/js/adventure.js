/* adventure.js — "Nertz: Shuffleton Story" career/adventure mode.
 *
 * A cozy, Golf-Story-flavored campaign: you return to your seaside hometown to
 * revive its faded Nertz scene and win the Shuffleton Cup. Each level is a Nertz
 * match with a specific opponent set and objective, wrapped in character
 * dialogue. This module owns its own DOM (map + dialogue overlays) and talks to
 * main.js through a small hook API, so the rest of the game stays decoupled.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  // ---- cast -------------------------------------------------------------
  const CHARS = {
    you:   { name: "You",          avatar: "🧑" },
    gran:  { name: "Gran Marge",   avatar: "🧶" },
    rusty: { name: "Rusty",        avatar: "🦝" },
    mitt:  { name: "Mitt",         avatar: "🐈" },
    mauser:{ name: "Mauser",       avatar: "🐈‍⬛" },
    mayor: { name: "Mayor Aces",   avatar: "🦅" },
  };

  // ---- objectives -------------------------------------------------------
  function objectiveText(o) {
    if (o.type === "win") return "Empty your Nertz pile before your rivals.";
    if (o.type === "score") return "Reach a net score of " + o.target + "+.";
    if (o.type === "time") return "Win the race in under " + Math.floor(o.target / 60) + ":" + String(o.target % 60).padStart(2, "0") + ".";
    return "";
  }
  function objectivePass(o, ctx) {
    if (o.type === "win") return ctx.won;
    if (o.type === "score") return ctx.score >= o.target;
    if (o.type === "time") return ctx.won && ctx.timeMs <= o.target * 1000;
    return ctx.won;
  }

  // ---- campaign data ----------------------------------------------------
  const CHAPTERS = [
    {
      id: "ch1",
      title: "Chapter 1 — Back to Shuffleton",
      subtitle: "The Riffle Room has gone quiet. Time to deal it back to life.",
      levels: [
        {
          id: "1-1", name: "The Kitchen Table", icon: "🍵",
          bots: [{ name: "Gran Marge", avatar: "🧶", difficulty: "easy" }],
          objective: { type: "win" },
          reward: { xp: 60, coins: 20 },
          intro: [
            { who: "gran", text: "Welcome home, dear! Sit — let's knock the rust off your shuffle." },
            { who: "gran", text: "Remember: race to empty your Nertz pile onto the middle. Aces start a pile, build up by suit. Fastest hands win." },
            { who: "you", text: "Just like when I was a kid. Deal 'em, Gran." },
          ],
          win: [{ who: "gran", text: "Ha! Still got it. The Riffle Room could use hands like yours again." }],
          lose: [{ who: "gran", text: "Rusty as a dropped anchor. Shuffle up and try once more, sweetheart." }],
        },
        {
          id: "1-2", name: "The Bait Shop Bet", icon: "🪝",
          bots: [{ name: "Rusty", avatar: "🦝", difficulty: "normal" }],
          objective: { type: "win" },
          reward: { xp: 90, coins: 30 },
          intro: [
            { who: "rusty", text: "Heard Marge's grandkid is back. Tell ya what — beat me and I'll fix the Riffle Room's busted neon sign." },
            { who: "you", text: "Deal." },
            { who: "rusty", text: "Heh. I play slow but I don't miss. Let's see those hands." },
          ],
          win: [{ who: "rusty", text: "...Well I'll be. Sign's as good as lit. Don't let it go to your head." }],
          lose: [{ who: "rusty", text: "Slow and steady, kid. Come back when you've found your rhythm." }],
        },
        {
          id: "1-3", name: "Twin Trouble", icon: "🐾",
          bots: [
            { name: "Mitt", avatar: "🐈", difficulty: "normal" },
            { name: "Mauser", avatar: "🐈‍⬛", difficulty: "normal" },
          ],
          objective: { type: "score", target: 25 },
          reward: { xp: 130, coins: 45, unlockTheme: "forest" },
          intro: [
            { who: "mitt", text: "Two on one! Hope you brought extra paws." },
            { who: "mauser", text: "Mitt. Focus. ...Score big or go home, newcomer." },
            { who: "you", text: "Bank 25 to the foundations and you'll be napping by the end." },
          ],
          win: [{ who: "mitt", text: "Whoa! Did you SEE that pile go up?" }, { who: "mauser", text: "Respect. The Forest table felt is yours — you earned the unlock." }],
          lose: [{ who: "mauser", text: "Twenty-five was the bar. Sharpen up and pounce again." }],
        },
        {
          id: "1-4", name: "Pier Showdown", icon: "🎡",
          bots: [{ name: "Mayor Aces", avatar: "🦅", difficulty: "hard" }],
          objective: { type: "win" },
          reward: { xp: 220, coins: 90, unlockTheme: "royal", title: "Shuffleton Hopeful" },
          intro: [
            { who: "mayor", text: "So YOU'RE the one stirring up my sleepy little town. The Riffle Room is an eyesore." },
            { who: "you", text: "It's a landmark. And after this hand, it's reopening." },
            { who: "mayor", text: "Bold. I am the fastest hands on this coast. Prove me wrong — if you can." },
          ],
          win: [
            { who: "mayor", text: "Impossible... my own pier, and I'm out-dealt." },
            { who: "gran", text: "That's my grandkid! Chapter one's in the books — the Coastal Circuit awaits." },
          ],
          lose: [{ who: "mayor", text: "As expected. Run along now." }],
        },
      ],
    },
    {
      id: "ch2",
      title: "Chapter 2 — The Coastal Circuit",
      subtitle: "Locked — win the Pier Showdown to set sail.",
      locked: true,
      levels: [],
    },
  ];

  const allLevels = () => CHAPTERS.flatMap((c) => c.levels);
  function levelById(id) { return allLevels().find((l) => l.id === id); }
  function firstLevelId() { return allLevels()[0].id; }
  function isCleared(save, id) { return !!(save.adventure && save.adventure.cleared && save.adventure.cleared[id]); }
  function isUnlocked(save, id) {
    const ids = allLevels().map((l) => l.id);
    const i = ids.indexOf(id);
    if (i <= 0) return true;             // first level always open
    return isCleared(save, ids[i - 1]);  // unlocked once the previous is cleared
  }
  function nextLevelId(id) {
    const ids = allLevels().map((l) => l.id);
    const i = ids.indexOf(id);
    return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
  }

  // ---- hooks from main --------------------------------------------------
  let hooks = {};
  function init(h) { hooks = h || {}; } // { getSave, onStartLevel, grantReward, saveProgress, onExit }

  // ---- DOM (lazily built) ----------------------------------------------
  let mapEl = null, storyEl = null;

  function ensureMap() {
    if (mapEl) return mapEl;
    mapEl = el("div", "overlay adv-map");
    mapEl.innerHTML = '<div class="adv-sheet"><button class="sheet-close" id="advClose">✕</button><div class="adv-head"><div class="adv-title">Nertz: Shuffleton Story</div><div class="adv-sub">Revive the Riffle Room. Win the Shuffleton Cup.</div></div><div class="adv-body" id="advBody"></div></div>';
    document.body.appendChild(mapEl);
    mapEl.querySelector("#advClose").addEventListener("click", () => { hide(mapEl); if (hooks.onExit) hooks.onExit(); });
    return mapEl;
  }

  function renderMap() {
    ensureMap();
    const save = hooks.getSave();
    const body = mapEl.querySelector("#advBody");
    body.innerHTML = "";
    CHAPTERS.forEach((ch) => {
      const chEl = el("div", "adv-chapter");
      chEl.append(el("div", "adv-ch-title", ch.title), el("div", "adv-ch-sub", ch.subtitle));
      const grid = el("div", "adv-levels");
      ch.levels.forEach((lvl) => {
        const cleared = isCleared(save, lvl.id);
        const unlocked = isUnlocked(save, lvl.id);
        const node = el("button", "adv-node" + (cleared ? " cleared" : unlocked ? "" : " locked"));
        node.append(
          el("div", "adv-node-icon", cleared ? "✅" : unlocked ? lvl.icon : "🔒"),
          el("div", "adv-node-name", lvl.name),
          el("div", "adv-node-obj", objectiveText(lvl.objective))
        );
        if (unlocked) node.addEventListener("click", () => { hide(mapEl); beginLevel(lvl); });
        else node.disabled = true;
        grid.appendChild(node);
      });
      if (ch.locked) grid.appendChild(el("div", "adv-coming", "More levels coming soon…"));
      chEl.appendChild(grid);
      body.appendChild(chEl);
    });
    show(mapEl);
  }

  // ---- dialogue ---------------------------------------------------------
  function ensureStory() {
    if (storyEl) return storyEl;
    storyEl = el("div", "overlay story-overlay");
    storyEl.innerHTML = '<div class="story-box"><div class="story-avatar" id="stAva">🧑</div><div class="story-name" id="stName"></div><div class="story-text" id="stText"></div><div class="story-tap">tap to continue ▸</div></div>';
    document.body.appendChild(storyEl);
    return storyEl;
  }
  function playDialogue(lines, onDone) {
    if (!lines || !lines.length) { onDone(); return; }
    ensureStory();
    let i = 0;
    const render = () => {
      const line = lines[i];
      const ch = CHARS[line.who] || CHARS.you;
      storyEl.querySelector("#stAva").textContent = ch.avatar;
      storyEl.querySelector("#stName").textContent = ch.name;
      storyEl.querySelector("#stText").textContent = line.text;
    };
    const advance = () => {
      i++;
      if (i >= lines.length) { storyEl.removeEventListener("click", advance); hide(storyEl); onDone(); }
      else { render(); if (Nertz.audio) Nertz.audio.play("select"); }
    };
    render();
    storyEl.addEventListener("click", advance);
    show(storyEl);
  }

  // ---- flow -------------------------------------------------------------
  function beginLevel(level) {
    playDialogue(level.intro, () => { if (hooks.onStartLevel) hooks.onStartLevel(level); });
  }

  // Called by main when an adventure round ends.
  function finishLevel(level, ctx) {
    const passed = objectivePass(level.objective, ctx);
    const save = hooks.getSave();
    if (passed && !isCleared(save, level.id)) {
      save.adventure = save.adventure || { cleared: {} };
      save.adventure.cleared = save.adventure.cleared || {};
      save.adventure.cleared[level.id] = { score: ctx.score, at: ctx.stamp || 0 };
      if (level.reward && hooks.grantReward) hooks.grantReward(level.reward);
      if (hooks.saveProgress) hooks.saveProgress();
    }
    const lines = (passed ? level.win : level.lose).slice();
    const banner = { who: "you", text: passed
      ? "★ Objective complete — " + objectiveText(level.objective) + (level.reward ? "  (+" + level.reward.xp + " XP, +" + level.reward.coins + " ◈)" : "")
      : "✗ Objective missed — " + objectiveText(level.objective) + " Try again!" };
    lines.push(banner);
    playDialogue(lines, () => { renderMap(); });
  }

  function open() { renderMap(); }
  function show(o) { o.classList.add("show"); }
  function hide(o) { o.classList.remove("show"); }

  Nertz.adventure = { init, open, finishLevel, levelById, isUnlocked, objectiveText, CHAPTERS, CHARS };
})(typeof window !== "undefined" ? window : this);
