/* story.js — "The Sandpiper Revival" story-mode engine.
 * Data lives in story-content.js (Nertz.storyContent). This module owns the
 * town map + dialogue overlays and the beat runner; it talks to main.js
 * through a small hooks API and runs minigames via Nertz.minigames.
 * Progress: save.story = { step: <index of current beat>, unlocked: {} }.
 * Losing a beat never advances — you retry, Golf-Story style.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const TYPE_ICONS = { dialogue: "💬", nertz: "⚡", poker: "🎩", blackjack: "♠", golf: "⛳" };
  const TYPE_NAMES = { dialogue: "Story", nertz: "Nertz race", poker: "5-card draw", blackjack: "Blackjack", golf: "Golf solitaire" };

  let hooks = {}; // { getSave, onStartNertz(beat), grantReward(reward), saveProgress(), toast(msg,gold) }
  let mapEl = null, storyEl = null;
  let activeBeat = null;

  let _content = null;
  function content() {
    if (_content) return _content;
    const c1 = Nertz.storyContent;
    const c2 = Nertz.storyContent2;
    if (!c2) { _content = c1; return _content; }
    _content = {
      meta: Object.assign({}, c1.meta, {
        chapters: Object.assign(
          { 1: { title: "Chapter 1 — The Sandpiper Revival", sub: c1.meta.tagline } },
          c2.chapters || {}),
      }),
      cast: Object.assign({}, c1.cast, c2.cast || {}),
      locations: c1.locations.concat(c2.locations || []),
      beats: c1.beats.concat((c2.beats || []).map((b) => Object.assign({ chapter: 2 }, b))),
    };
    return _content;
  }
  function save() { return hooks.getSave(); }
  function step() { return (save().story && save().story.step) || 0; }

  function objectiveText(beat) {
    if (beat.type === "dialogue") return "Just listen.";
    if (beat.type === "nertz") {
      const o = beat.nertz.objective;
      if (o.type === "win") return "Win the race.";
      if (o.type === "score") return "Reach net score " + o.target + "+.";
      if (o.type === "time") return "Win in under " + Math.floor(o.target / 60) + ":" + String(o.target % 60).padStart(2, "0") + ".";
    }
    if (beat.type === "golf") return "Clear " + ((beat.config && beat.config.target) || 25) + " cards · stake " + beat.stake + " ◈";
    return TYPE_NAMES[beat.type] + " · stake " + beat.stake + " ◈";
  }

  function objectivePass(beat, ctx) {
    const o = beat.nertz.objective;
    if (o.type === "win") return ctx.won;
    if (o.type === "score") return ctx.score >= o.target;
    if (o.type === "time") return ctx.won && ctx.timeMs <= o.target * 1000;
    return ctx.won;
  }

  // ---- map ---------------------------------------------------------------
  function ensureMap() {
    if (mapEl) return mapEl;
    mapEl = el("div", "overlay adv-map");
    const sheet = el("div", "adv-sheet");
    const close = el("button", "sheet-close", "✕");
    close.addEventListener("click", () => hide(mapEl));
    const head = el("div", "adv-head");
    head.append(el("div", "adv-title", content().meta.title),
                el("div", "adv-sub", content().meta.tagline),
                el("div", "st-wallet", ""));
    const body = el("div", "adv-body");
    body.id = "stBody";
    sheet.append(close, head, body);
    mapEl.appendChild(sheet);
    document.body.appendChild(mapEl);
    return mapEl;
  }

  function renderMap() {
    ensureMap();
    mapEl.querySelector(".st-wallet").textContent = "Wallet: " + (save().profile.coins || 0) + " ◈";
    const body = mapEl.querySelector("#stBody");
    body.innerHTML = "";
    const beats = content().beats;
    const cur = step();
    if (cur >= beats.length) {
      const fin = el("div", "adv-ch-sub", "🏆 All chapters complete! The tide is turned — for now. More of the saga coming…");
      fin.style.textAlign = "center"; fin.style.padding = "10px";
      body.appendChild(fin);
    }
    // group beats: chapter → location
    const chapters = {};
    beats.forEach((b, i) => { const c = b.chapter || 1; (chapters[c] = chapters[c] || []).push({ b, i }); });
    Object.keys(chapters).sort((a, b) => a - b).forEach((cnum) => {
      const chMeta = ((content().meta.chapters || {})[cnum]) || { title: "Chapter " + cnum, sub: "" };
      const chHead = el("div", "st-chapter");
      chHead.append(el("div", "st-chapter-title", chMeta.title), el("div", "adv-ch-sub", chMeta.sub));
      body.appendChild(chHead);
      const chBeats = chapters[cnum];
      renderChapterLocations(body, chBeats, cur);
    });
    show(mapEl);
  }

  function renderChapterLocations(body, chBeats, cur) {
    content().locations.forEach((loc) => {
      const locBeats = chBeats.filter((x) => x.b.locationId === loc.id);
      if (!locBeats.length) return;
      const ch = el("div", "adv-chapter");
      ch.append(el("div", "adv-ch-title", loc.emoji + " " + loc.name),
                el("div", "adv-ch-sub", loc.blurb));
      const grid = el("div", "adv-levels");
      locBeats.forEach(({ b, i }) => {
        const cleared = i < cur, current = i === cur;
        const node = el("button", "adv-node" + (cleared ? " cleared" : current ? " st-current" : " locked"));
        node.append(
          el("div", "adv-node-icon", cleared ? "✅" : current ? (TYPE_ICONS[b.type] || "❔") : "🔒"),
          el("div", "adv-node-name", (current ? "❗ " : "") + b.title),
          el("div", "adv-node-obj", cleared ? "Cleared" : current ? objectiveText(b) : "Locked")
        );
        if (current) node.addEventListener("click", () => { hide(mapEl); runBeat(b); });
        else node.disabled = true;
        grid.appendChild(node);
      });
      ch.appendChild(grid);
      body.appendChild(ch);
    });
  }

  // ---- dialogue ------------------------------------------------------------
  function ensureStory() {
    if (storyEl) return storyEl;
    storyEl = el("div", "overlay story-overlay");
    const box = el("div", "story-box");
    box.innerHTML = '<div class="story-avatar" id="stAva">🧑</div><div class="story-name" id="stName"></div><div class="story-text" id="stText"></div><div class="story-tap">tap to continue ▸</div>';
    storyEl.appendChild(box);
    document.body.appendChild(storyEl);
    return storyEl;
  }

  function playDialogue(lines, onDone) {
    if (!lines || !lines.length) { onDone && onDone(); return; }
    ensureStory();
    let i = 0;
    const render = () => {
      const line = lines[i];
      const ch = content().cast[line.who] || { name: line.who, emoji: "❔" };
      storyEl.querySelector("#stAva").textContent = ch.emoji;
      storyEl.querySelector("#stName").textContent = ch.name;
      storyEl.querySelector("#stText").textContent = line.text;
    };
    const advance = () => {
      i++;
      if (i >= lines.length) {
        storyEl.querySelector(".story-box").removeEventListener("click", advance);
        hide(storyEl);
        onDone && onDone();
      } else { render(); if (Nertz.audio) Nertz.audio.play("select"); }
    };
    render();
    storyEl.querySelector(".story-box").addEventListener("click", advance);
    show(storyEl);
  }

  // ---- beat runner ---------------------------------------------------------
  function runBeat(beat) {
    activeBeat = beat;
    playDialogue(beat.intro, () => {
      if (beat.type === "dialogue") {
        playDialogue(beat.win || [], () => passBeat(beat));
      } else if (beat.type === "nertz") {
        hooks.onStartNertz(beat); // main runs the match, then calls finishNertzBeat
      } else {
        runMinigame(beat);
      }
    });
  }

  function runMinigame(beat) {
    const mg = Nertz.minigames && Nertz.minigames[beat.type];
    if (!mg) { hooks.toast("This table isn't open yet."); renderMap(); return; }
    mg.open({
      stake: beat.stake || 20,
      opponent: beat.opponent,
      config: beat.config,
      onDone: (res) => {
        // apply the wager to the wallet (never below zero)
        const p = save().profile;
        p.coins = Math.max(0, (p.coins || 0) + (res.delta || 0));
        hooks.saveProgress();
        if (res.delta) hooks.toast((res.delta > 0 ? "+" : "") + res.delta + " ◈ — " + (res.summary || ""), res.delta > 0);
        if (res.won) playDialogue(beat.win || [], () => passBeat(beat));
        else playDialogue(beat.lose || [], () => renderMap()); // retry: step unchanged
      },
    });
  }

  // Called by main.js when a story-mode Nertz round finishes.
  function finishNertzBeat(ctx) {
    const beat = activeBeat;
    if (!beat || beat.type !== "nertz") return;
    if (objectivePass(beat, ctx)) playDialogue(beat.win || [], () => passBeat(beat));
    else playDialogue(beat.lose || [], () => renderMap());
  }

  function passBeat(beat) {
    const s = save();
    const idx = content().beats.indexOf(beat);
    if (idx === step()) { // only advance from the current beat (idempotent on replays)
      s.story.step = idx + 1;
      if (beat.reward) {
        if (beat.reward.unlockTheme) s.story.unlocked[beat.reward.unlockTheme] = true;
        hooks.grantReward(beat.reward);
      }
      hooks.saveProgress();
    }
    activeBeat = null;
    renderMap();
  }

  function show(o) { o.classList.add("show"); }
  function hide(o) { o.classList.remove("show"); }

  Nertz.story = {
    init(h) { hooks = h || {}; },
    open() { renderMap(); },
    finishNertzBeat,
    currentBeat() { return activeBeat; },
    objectiveText,
  };
})(typeof window !== "undefined" ? window : this);
