/* main.js — app orchestration: menu, modes, game loop, progression, panels. */
(function (g) {
  "use strict";
  const Nertz = g.Nertz;
  const D = Nertz.deck;
  const { el, $ } = Nertz.h;
  const prog = Nertz.progression;

  const App = {
    save: null,
    ui: null,
    engine: null,
    bots: [],
    foundations: [],
    mode: "fast",
    cfg: { opponents: 2, difficulty: "normal" },
    timer: null,
    startTime: 0,
    running: false,
  };

  // ============ boot ============
  function boot() {
    App.save = Nertz.store.load();
    App.ui = new Nertz.UI();
    App.ui.setApi({
      tap: onTap, drop: onDrop, flipStock: onFlipStock,
    });
    applySettings();
    refreshLevelChip();
    wireMenu();
    wireNav();
    wireGameHud();
    wireResult();
    Nertz.story.init({
      getSave: () => App.save,
      onStartNertz: (beat) => { App.storyBeat = beat; startGame("story"); },
      grantReward: (reward) => grantStoryReward(reward),
      saveProgress: () => { Nertz.store.save(App.save); refreshLevelChip(); },
      toast: (msg, gold) => App.ui.toast(msg, gold),
    });
    // browsers require a user gesture before audio can start
    document.addEventListener("pointerdown", () => Nertz.audio.unlock(), { once: true });
  }

  function grantStoryReward(reward) {
    const up = prog.grantRewards(App.save, { xp: reward.xp || 0, coins: reward.coins || 0 });
    prog.checkAchievements(App.save);
    Nertz.store.save(App.save);
    refreshLevelChip();
    if (reward.unlockTheme) App.ui.toast("🎨 Unlocked the " + Nertz.themes.byId(reward.unlockTheme).name + " table!", true);
    if (reward.title) App.ui.toast("🏷️ Title earned: " + reward.title, true);
    if (up.leveledUp) { App.ui.toast("Level up! You reached level " + up.to + " 🎉", true); sfx("levelup"); }
  }

  function applySettings() {
    const s = App.save.settings;
    document.body.classList.toggle("left-handed", !!s.leftHanded);
    document.body.classList.toggle("reduce-motion", !!s.reduceMotion);
    Nertz.themes.apply(s.theme || "classic");
    Nertz.audio.setEnabled(s.sound !== false);
    // duality toggles: day/night chrome + card-face form
    document.body.classList.toggle("day-mode", !!s.dayMode);
    Nertz.cardForm = s.cardForm || "trad";
    const dn = $("#btnDayNight");
    if (dn) dn.textContent = s.dayMode ? "☀️" : "🌙";
  }

  function refreshLevelChip() {
    const p = App.save.profile;
    $("#lvlBadge").textContent = p.level;
    $("#coins").textContent = p.coins + " ◈";
    const cur = prog.xpForLevel(p.level), next = prog.xpForLevel(p.level + 1);
    const pct = Math.max(0, Math.min(100, ((p.xp - cur) / (next - cur)) * 100));
    $("#lvlBarFill").style.width = pct + "%";
  }

  // ============ menu ============
  function wireMenu() {
    document.querySelectorAll(".mode-card").forEach((btn) =>
      btn.addEventListener("click", () => startMode(btn.dataset.mode)));
    wireSeg("#cfgOpponents", (v) => (App.cfg.opponents = parseInt(v, 10)));
    wireSeg("#cfgDifficulty", (v) => (App.cfg.difficulty = v));
  }

  // Adventure opens its own map; everything else starts a round immediately.
  function startMode(mode) {
    Nertz.audio.unlock();
    if (mode === "story") { Nertz.story.open(); return; }
    if (mode === "tournament") App.tournament = { round: 0, totals: {}, founded: 0, wins: 0 };
    startGame(mode);
  }

  const TOURNAMENT_ROUNDS = 3;
  const WILD_MUTATORS = [
    { id: "short",  name: "Short Stack",   desc: "7-card Nertz pile",  rules: { nertzSize: 7 } },
    { id: "tall",   name: "Tall Order",    desc: "18-card Nertz pile", rules: { nertzSize: 18 } },
    { id: "drip",   name: "Slow Drip",     desc: "stock flips 1",      rules: { stockFlip: 1 } },
    { id: "flood",  name: "Flood",         desc: "stock flips 5",      rules: { stockFlip: 5 } },
    { id: "wide",   name: "Wide Table",    desc: "6 work piles",       rules: { workPiles: 6 } },
    { id: "tight",  name: "Tight Squeeze", desc: "3 work piles",       rules: { workPiles: 3 } },
    { id: "turbo",  name: "Turbo Bots",    desc: "bots 40% faster",    botSpeed: 1.4 },
    { id: "sleepy", name: "Sleepy Bots",   desc: "bots 30% slower",    botSpeed: 0.7 },
  ];
  // Pick 2 compatible mutators (never two touching the same rule / both speeds).
  function pickWildMutators() {
    const pool = WILD_MUTATORS.slice();
    const picks = [];
    while (picks.length < 2 && pool.length) {
      const m = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (picks.some((x) => x.rules && m.rules && Object.keys(x.rules).some((k) => m.rules[k] != null))) continue;
      if (picks.some((x) => x.botSpeed && m.botSpeed)) continue;
      picks.push(m);
    }
    return picks;
  }

  const MODE_BANNERS = {
    fast: "⚡ Fast Play · 1v1 — first to empty Nertz wins",
    blitz: "🌀 Blitz · 7-card Nertz, single flips, turbo bot",
    zen: "🌙 Zen Solo · no bots, no pressure",
    ranked: "🏁 Ranked Race · earns XP + leaderboard",
    daily: "📅 Daily Challenge · same deal for everyone",
  };
  function updateModeBanner() {
    const b = $("#modeBanner");
    if (App.mode === "story" && App.storyBeat) {
      b.textContent = "🗺️ " + App.storyBeat.title + " · " + Nertz.story.objectiveText(App.storyBeat);
    } else if (App.mode === "wild") {
      b.textContent = "🎲 Wild Shuffle · " + (App.wildMutators || []).map((m) => m.name).join(" + ");
    } else if (App.mode === "tournament" && App.tournament) {
      b.textContent = "🏆 Tournament · round " + App.tournament.round + " of " + TOURNAMENT_ROUNDS;
    } else {
      b.textContent = MODE_BANNERS[App.mode] || "";
    }
    b.className = "mode-banner mode-" + App.mode + (b.textContent ? " show" : "");
  }

  function wireSeg(sel, onChange) {
    const seg = $(sel);
    seg.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        seg.dataset.val = b.dataset.v;
        onChange(b.dataset.v);
      }));
  }

  function showScreen(which) {
    $("#screenMenu").classList.toggle("active", which === "menu");
    $("#screenGame").classList.toggle("active", which === "game");
  }

  // ============ game lifecycle ============
  function startGame(mode) {
    // Tear down any round still in progress (e.g. Restart / R mid-game) so its
    // bots' timers and staggered-start timeouts can't fire into the new round.
    stopRound();

    App.mode = mode;
    App.foundations = [];
    const isZen = mode === "zen";
    const isDaily = mode === "daily";
    const isStory = mode === "story";
    App.isReplay = false;

    let rng = Math.random;
    if (isDaily) {
      const seed = dailySeed();
      if (App.save.daily.lastSeed === seed && App.save.daily.lastResult) {
        App.isReplay = true; // already completed today — replay earns nothing
        App.ui.toast("Daily already played — replaying for fun (no rewards) ✦");
      }
      rng = D.seededRng(seed);
    }

    // ---- per-mode table rules & opponent line-up (real mode variance) ----
    let rules = {};
    let botSpeed = 1;
    let botSpecs = [];
    App.xpMult = 1;
    if (isStory && App.storyBeat) {
      const lv = App.storyBeat.nertz;
      rules = lv.rules || {};
      botSpecs = lv.bots.map((b) => ({ name: b.name, avatar: b.avatar, difficulty: b.difficulty }));
    } else if (mode === "blitz") {
      rules = { nertzSize: 7, stockFlip: 1 };
      botSpeed = 1.3;
      App.xpMult = 1.15;
      botSpecs = [{ name: "Bolt " + Nertz.PROFILES[App.cfg.difficulty].name, avatar: "⚡", difficulty: App.cfg.difficulty }];
    } else if (mode === "wild") {
      App.wildMutators = pickWildMutators();
      App.wildMutators.forEach((m) => { Object.assign(rules, m.rules || {}); if (m.botSpeed) botSpeed = m.botSpeed; });
      App.xpMult = 1.25;
      for (let i = 0; i < 2; i++) {
        botSpecs.push({ name: Nertz.PROFILES[App.cfg.difficulty].name + " " + (i + 1), avatar: Nertz.AVATARS[(i + 2) % Nertz.AVATARS.length], difficulty: App.cfg.difficulty });
      }
    } else if (mode === "tournament") {
      App.tournament = App.tournament || { round: 0, totals: {}, founded: 0, wins: 0 };
      App.tournament.round++;
      for (let i = 0; i < 2; i++) {
        botSpecs.push({ name: Nertz.PROFILES[App.cfg.difficulty].name + " " + (i + 1), avatar: Nertz.AVATARS[i % Nertz.AVATARS.length], difficulty: App.cfg.difficulty });
      }
    } else if (!isZen) {
      const n = mode === "fast" ? 1 : isDaily ? 2 : App.cfg.opponents; // Fast = single bot, Ranked = your pick
      const diff = isDaily ? "normal" : App.cfg.difficulty;
      for (let i = 0; i < n; i++) {
        botSpecs.push({ name: Nertz.PROFILES[diff].name + " " + (i + 1), avatar: Nertz.AVATARS[i % Nertz.AVATARS.length], difficulty: diff });
      }
    }
    // difficulty used this round, for reward scaling/achievements
    App.roundDifficulty = botSpecs.length ? botSpecs[botSpecs.length - 1].difficulty : "normal";

    // engine for the human
    App.engine = new Nertz.Engine({
      rng, playerId: "you", foundations: App.foundations, rules: rules,
      onFoundation: () => {},
    });
    App.engine.on("change", () => syncHud());
    App.engine.on("foundation", () => { App.ui.render(App.engine); pulseLeader(); });
    App.engine.on("nertz", () => endRound("you"));

    App.bots = botSpecs.map((s, i) => new Nertz.Bot({
      id: "bot" + i, name: s.name, avatar: s.avatar, difficulty: s.difficulty,
      foundations: App.foundations,
      nertzSize: App.engine.rules.nertzSize, speedMult: botSpeed,
      rng: isDaily ? D.seededRng(dailySeed() + 7919 * (i + 1)) : Math.random,
      onPlay: onBotPlay,
    }));

    if (mode === "wild") {
      App.ui.toast("🎲 " + App.wildMutators.map((m) => m.name + " (" + m.desc + ")").join(" · "), true);
    }

    updateModeBanner();
    showScreen("game");
    App.ui.render(App.engine);
    App.ui.renderOpponents(App.bots, leaderId());
    syncHud();

    App.startTime = Date.now();
    App.running = true;
    clearInterval(App.timer);
    App.timer = setInterval(tickClock, 250);
    // stagger bot starts so the player gets a head start (tracked so a Restart
    // mid-round can cancel any that haven't fired yet)
    App._botStartTimers = App.bots.map((b, i) => setTimeout(() => b.start(), 900 + i * 350));
  }

  // Halt the current round's timers & bots without leaving the game screen.
  function stopRound() {
    App.running = false;
    clearInterval(App.timer);
    (App._botStartTimers || []).forEach(clearTimeout);
    App._botStartTimers = [];
    App.bots.forEach((b) => b.stop());
  }

  function onBotPlay(ev) {
    if (!App.running) return;
    // Fly the bot's card from its avatar chip to the foundation it landed on.
    const fromEl = document.querySelector('.opp[data-bot-id="' + ev.bot.id + '"] .opp-ava');
    const fromRect = fromEl ? fromEl.getBoundingClientRect() : null;
    App.ui.render(App.engine);
    App.ui.renderOpponents(App.bots, leaderId());
    sfx("deal");
    flyToFoundation(ev.card, fromRect, true);
    if (ev.bot.nertzRemaining() === 0) endRound(ev.bot.id);
  }

  // Queue a just-played card's flight to its foundation (serialized in the UI
  // so only one card animates to the centre at a time).
  function flyToFoundation(card, fromRect, isBot) {
    if (!card || !fromRect) return;
    App.ui.queueFlight(card, fromRect, { duration: isBot ? 520 : 380, spin: isBot ? -9 : 9 });
  }

  function leaderId() {
    let best = { id: "you", n: App.engine ? App.engine.nertzRemaining() : 13 };
    App.bots.forEach((b) => { if (b.nertzRemaining() < best.n) best = { id: b.id, n: b.nertzRemaining() }; });
    return best.id;
  }
  function pulseLeader() { App.ui.renderOpponents(App.bots, leaderId()); }

  function tickClock() {
    if (!App.running) return;
    const ms = Date.now() - App.startTime;
    $("#hudTime").textContent = fmtTime(ms);
  }

  function syncHud() {
    if (!App.engine) return;
    // During play we show cards banked to foundations (counts up, motivating).
    // The net Nertz score (banked − 2×remaining) is computed at round end.
    $("#hudScore").textContent = App.engine.score;
    $("#hudNertz").textContent = App.engine.nertzRemaining();
  }

  // ============ interaction handlers ============
  function onTap(source, fromRect) {
    if (!App.running) return;
    const card = App.engine.peek(source); // capture identity before the move
    if (App.engine.playToFoundation(source)) {
      App.ui.render(App.engine); syncHud(); sfx("foundation");
      flyToFoundation(card, fromRect, false);
    }
  }
  function onDrop(source, target, fromRect) {
    if (!App.running) return;
    const card = App.engine.peek(source);
    let ok = false, toFoundation = target.zone === "foundation";
    if (toFoundation) ok = App.engine.playToFoundation(source);
    else if (target.zone === "work") ok = App.engine.moveToWork(source, target.pileIndex);
    if (ok) {
      App.ui.render(App.engine); syncHud(); sfx(toFoundation ? "foundation" : "play");
      if (toFoundation) flyToFoundation(card, fromRect, false);
    }
  }
  function onFlipStock() {
    if (!App.running) return;
    App.engine.flipStock();
    App.ui.render(App.engine);
    sfx("flip");
  }

  // ============ end of round ============
  function endRound(winnerId) {
    if (!App.running) return;
    stopRound();
    const timeMs = Date.now() - App.startTime;

    // gather standings
    const players = [{
      id: "you", name: App.save.profile.name || "You", avatar: "🧑",
      score: App.engine.finalScore(),
      founded: App.foundations.reduce((n, f) => n + f.cards.filter((c) => c.owner === "you").length, 0),
      nertz: App.engine.nertzRemaining(), isYou: true,
    }];
    App.bots.forEach((b) => players.push({
      id: b.id, name: b.name, avatar: b.avatar,
      score: b.finalScore(), founded: b.foundationCount, nertz: b.nertzRemaining(), isYou: false,
    }));
    players.sort((a, b) => b.score - a.score);

    const me = players.find((p) => p.isYou);
    const youWon = winnerId === "you" || (App.bots.length === 0 && me.nertz === 0);

    // Adventure: count light stats, then hand off to the campaign's own
    // objective check + outro dialogue (rewards come from the level).
    // Story mode: hand off to the campaign's objective check + outro dialogue.
    if (App.mode === "story" && App.storyBeat) {
      const st = App.save.stats;
      st.gamesPlayed++; st.totalFoundationCards += me.founded;
      if (st.bestScore == null || me.score > st.bestScore) st.bestScore = me.score;
      Nertz.store.save(App.save);
      if (youWon) { App.ui.confetti(); sfx("win"); } else { sfx("lose"); }
      showScreen("menu");
      Nertz.story.finishNertzBeat({ won: youWon, score: me.score, founded: me.founded, timeMs: timeMs });
      return;
    }

    // Tournament: accumulate per-round; interim standings until the final.
    if (App.mode === "tournament" && App.tournament) {
      const t = App.tournament;
      players.forEach((p) => { t.totals[p.name] = (t.totals[p.name] || 0) + p.score; });
      t.founded += me.founded;
      if (youWon) t.wins++;
      if (t.round < TOURNAMENT_ROUNDS) { showTournamentInterim(); return; }
      const myName = App.save.profile.name || "You";
      const standings = Object.keys(t.totals).map((name) => ({
        name: name, score: t.totals[name], isYou: name === myName,
        avatar: (players.find((p) => p.name === name) || {}).avatar || "🃏",
      })).sort((a, b) => b.score - a.score);
      const meT = standings.find((p) => p.isYou);
      const champion = standings[0].isYou;
      updateProgress({ score: meT.score, founded: t.founded }, champion, timeMs,
        champion && App.roundDifficulty === "hard");
      showResult(standings, meT, champion, timeMs);
      $("#resultTitle").textContent = champion ? "🏆 Tournament champion!" : "Tournament over — you placed #" + (standings.indexOf(meT) + 1);
      App.tournament = null;
      return;
    }

    const beatHard = youWon && App.roundDifficulty === "hard" && App.mode !== "zen";
    updateProgress(me, youWon, timeMs, beatHard);
    showResult(players, me, youWon, timeMs);
  }

  function updateProgress(me, won, timeMs, beatHard) {
    const s = App.save.stats;
    // Zen practice and Daily replays don't pay out rewards or feed the boards.
    const noReward = App.mode === "zen" || App.isReplay;

    s.gamesPlayed++;
    s.totalFoundationCards += me.founded;
    // bestScore uses a JSON-safe null sentinel (−Infinity becomes null on save).
    if (s.bestScore == null || me.score > s.bestScore) s.bestScore = me.score;
    if (won) {
      s.wins++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak);
      if (s.fastestNertzMs == null || timeMs < s.fastestNertzMs) s.fastestNertzMs = timeMs;
      if (s.bestTimeMs == null || timeMs < s.bestTimeMs) s.bestTimeMs = timeMs;
    } else { s.streak = 0; }
    App.save._flags = Object.assign(App.save._flags || {}, { beatHard: (App.save._flags && App.save._flags.beatHard) || beatHard });

    if (noReward) {
      App._rewards = { xp: 0, coins: 0 };
      App._levelUp = { leveledUp: false };
    } else {
      App._rewards = prog.scoreToRewards({
        score: me.score, won, foundationCards: me.founded, timeMs, difficulty: App.roundDifficulty,
      });
      App._rewards.xp = Math.round(App._rewards.xp * (App.xpMult || 1)); // mode bonus (Blitz/Wild)
      App._levelUp = prog.grantRewards(App.save, App._rewards);
    }
    App._unlocked = prog.checkAchievements(App.save);

    // leaderboard only for genuine ranked/fast/first-daily runs
    if (!noReward) {
      Nertz.store.addLeaderboard(App.save, {
        name: App.save.profile.name || "You", score: me.score, mode: App.mode,
        date: new Date().toISOString().slice(0, 10), timeMs,
      });
    }
    // record the daily result only on the first play of the day, never on replays
    if (App.mode === "daily" && !App.isReplay) {
      App.save.daily.lastSeed = dailySeed();
      App.save.daily.lastResult = { score: me.score, won };
    }
    Nertz.store.save(App.save);
    refreshLevelChip();
  }

  // Between tournament rounds: standings + a "deal next round" action.
  function showTournamentInterim() {
    const t = App.tournament;
    const myName = App.save.profile.name || "You";
    $("#resultEmoji").textContent = "🏆";
    $("#resultTitle").textContent = "Round " + t.round + " of " + TOURNAMENT_ROUNDS + " — standings";
    const table = $("#resultTable");
    table.innerHTML = "";
    Object.keys(t.totals).map((name) => ({ name: name, total: t.totals[name] }))
      .sort((a, b) => b.total - a.total)
      .forEach((p, i) => {
        const row = el("div", "res-row" + (p.name === myName ? " me" : ""));
        const nm = el("div", "res-name");
        nm.append(el("span", "res-rank", "#" + (i + 1)), document.createTextNode(p.name));
        row.append(nm, el("div", "res-score", (p.total >= 0 ? "+" : "") + p.total));
        table.appendChild(row);
      });
    $("#rewardRow").innerHTML = "";
    $("#resultAgain").textContent = "Deal round " + (t.round + 1) + " ▸";
    App._againAction = () => { $("#overlayRound").classList.remove("show"); startGame("tournament"); };
    $("#overlayRound").classList.add("show");
  }

  function showResult(players, me, won, timeMs) {
    $("#resultEmoji").textContent = won ? "🏆" : (me.score > 0 ? "🃏" : "😅");
    $("#resultTitle").textContent = won ? "Nertz! You win!" : standingLabel(players, me);

    const table = $("#resultTable");
    table.innerHTML = "";
    players.forEach((p, i) => {
      const row = el("div", "res-row" + (p.isYou ? " me" : ""));
      const name = el("div", "res-name");
      name.append(el("span", "res-rank", "#" + (i + 1)), document.createTextNode(p.avatar + " " + p.name));
      const score = el("div", "res-score", (p.score >= 0 ? "+" : "") + p.score);
      row.append(name, score);
      table.appendChild(row);
    });

    const rr = $("#rewardRow");
    rr.innerHTML = "";
    const noReward = App.mode === "zen" || App.isReplay;
    if (!noReward) {
      rr.append(
        pill("xp", "+" + App._rewards.xp + " XP"),
        pill("coin", "+" + App._rewards.coins + " ◈"),
        pill("", "⏱ " + fmtTime(timeMs))
      );
    } else {
      rr.append(pill("", "⏱ " + fmtTime(timeMs)), pill("", me.founded + " to foundations"));
    }

    $("#overlayRound").classList.add("show");

    if (won) { App.ui.confetti(); sfx("win"); } else { sfx("lose"); }
    if (App._levelUp.leveledUp) setTimeout(() => { App.ui.toast("Level up! You reached level " + App._levelUp.to + " 🎉", true); sfx("levelup"); }, 500);
    (App._unlocked || []).forEach((a, i) =>
      setTimeout(() => App.ui.toast(a.icon + "  Unlocked: " + a.name, true), 900 + i * 700));
  }

  function pill(kind, txt) { return el("span", "reward-pill " + kind, txt); }
  function standingLabel(players, me) {
    const rank = players.indexOf(me) + 1;
    return rank === 1 ? "You topped the table!" : "You placed #" + rank;
  }

  function wireResult() {
    $("#resultAgain").addEventListener("click", () => {
      if (App._againAction) { const fn = App._againAction; App._againAction = null; $("#resultAgain").textContent = "Play again"; fn(); return; }
      $("#overlayRound").classList.remove("show");
      restartMode();
    });
    $("#resultMenu").addEventListener("click", () => { $("#overlayRound").classList.remove("show"); backToMenu(); });
  }

  function backToMenu() {
    stopRound();
    showScreen("menu");
  }

  // Restart the current mode cleanly (tournaments restart from round 1).
  function restartMode() {
    if (App.mode === "tournament") App.tournament = { round: 0, totals: {}, founded: 0, wins: 0 };
    startGame(App.mode);
  }

  // ============ game hud buttons ============
  function wireGameHud() {
    $("#btnQuit").addEventListener("click", backToMenu);
    $("#btnHint").addEventListener("click", showHint);
    $("#btnAuto").addEventListener("click", autoPlay);
    $("#btnRestart").addEventListener("click", restartMode);
    wireKeyboard();
  }

  // Sweep every currently-playable top card to the foundations, repeatedly,
  // until nothing else fits. A common solitaire quality-of-life feature.
  function autoPlay() {
    if (!App.running) return;
    let moved = true, total = 0;
    while (moved && App.running) {
      moved = false;
      const tries = [{ zone: "nertz" }, { zone: "waste" }];
      for (let i = 0; i < 4; i++) tries.push({ zone: "work", pileIndex: i, cardIndex: App.engine.work[i].length - 1 });
      for (const s of tries) if (App.engine.playToFoundation(s)) { moved = true; total++; }
    }
    if (total) { App.ui.render(App.engine); syncHud(); sfx("foundation"); App.ui.toast("Auto-played " + total + " card" + (total > 1 ? "s" : "") + " ⤴"); }
    else App.ui.toast("Nothing to auto-play right now");
  }

  function anyOverlayOpen() {
    return $("#overlayRound").classList.contains("show") || $("#overlayPanel").classList.contains("show");
  }

  function wireKeyboard() {
    if (App._kbBound) return; // bind once
    App._kbBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && anyOverlayOpen()) {
        $("#overlayRound").classList.remove("show");
        $("#overlayPanel").classList.remove("show");
        return;
      }
      if (!App.running || anyOverlayOpen()) return;
      switch (e.key) {
        case " ": case "f": case "F": e.preventDefault(); onFlipStock(); break;
        case "a": case "A": autoPlay(); break;
        case "h": case "H": showHint(); break;
        case "r": case "R": restartMode(); break;
        case "Escape": backToMenu(); break;
      }
    });
  }

  function showHint() {
    if (!App.running) return;
    const e = App.engine;
    const ids = [];
    const consider = [];
    if (e.nertzTop()) consider.push({ c: e.nertzTop() });
    if (e.wasteTop()) consider.push({ c: e.wasteTop() });
    e.work.forEach((p) => { if (p.length) consider.push({ c: p[p.length - 1] }); });
    consider.forEach(({ c }) => {
      let playable = c.rank === 1;
      for (const f of e.foundations) if (D.canStackFoundation(c, f)) playable = true;
      if (playable) ids.push(c.id);
    });
    if (ids.length) { App.ui.flashHints(ids); App.ui.toast(ids.length + " card(s) can go to a foundation 💡"); }
    else App.ui.toast("No foundation plays — flip the stock 🔄");
  }

  // ============ nav / panels ============
  function wireNav() {
    $("#btnDayNight").addEventListener("click", () => {
      App.save.settings.dayMode = !App.save.settings.dayMode;
      Nertz.store.save(App.save);
      applySettings();
      App.ui.toast(App.save.settings.dayMode ? "☀️ Day form" : "🌙 Night form");
      if (App.engine) App.ui.render(App.engine);
    });
    $("#navStats").addEventListener("click", () => openPanel("stats"));
    $("#navBoard").addEventListener("click", () => openPanel("board"));
    $("#navSettings").addEventListener("click", () => openPanel("settings"));
    $("#panelClose").addEventListener("click", () => $("#overlayPanel").classList.remove("show"));
    document.querySelectorAll(".ptab").forEach((t) =>
      t.addEventListener("click", () => {
        document.querySelectorAll(".ptab").forEach((x) => x.classList.remove("on"));
        t.classList.add("on");
        renderPanel(t.dataset.tab);
      }));
  }

  function openPanel(tab) {
    document.querySelectorAll(".ptab").forEach((x) => x.classList.toggle("on", x.dataset.tab === tab));
    renderPanel(tab);
    $("#overlayPanel").classList.add("show");
  }

  function renderPanel(tab) {
    const body = $("#panelBody");
    body.innerHTML = "";
    if (tab === "stats") body.appendChild(renderStats());
    else if (tab === "ach") body.appendChild(renderAchievements());
    else if (tab === "board") body.appendChild(renderBoard());
    else if (tab === "settings") body.appendChild(renderSettings());
  }

  function renderStats() {
    const s = App.save.stats, wrap = el("div");
    const grid = el("div", "stat-grid");
    const winRate = s.gamesPlayed ? Math.round((s.wins / s.gamesPlayed) * 100) : 0;
    const box = (k, v) => { const b = el("div", "stat-box"); b.append(el("div", "sb-v", v), el("div", "sb-k", k)); return b; };
    grid.append(
      box("Games", s.gamesPlayed),
      box("Wins", s.wins),
      box("Win rate", winRate + "%"),
      box("Best score", s.bestScore == null ? "—" : s.bestScore),
      box("Best streak", s.bestStreak),
      box("Fastest win", s.fastestNertzMs ? fmtTime(s.fastestNertzMs) : "—"),
    );
    wrap.appendChild(grid);
    return wrap;
  }

  function renderAchievements() {
    const list = el("div", "ach-list");
    prog.ACHIEVEMENTS.forEach((a) => {
      const unlocked = !!App.save.achievements[a.id];
      const row = el("div", "ach" + (unlocked ? "" : " locked"));
      const ic = el("div", "ach-ic", unlocked ? a.icon : "🔒");
      const meta = el("div");
      meta.append(el("div", "ach-name", a.name), el("div", "ach-desc", a.desc));
      row.append(ic, meta);
      list.appendChild(row);
    });
    return list;
  }

  function renderBoard() {
    const board = App.save.leaderboard || [];
    if (!board.length) { const e = el("div", "board-empty", "No scores yet — play a ranked race!"); return e; }
    const list = el("div", "board-list");
    board.slice(0, 15).forEach((entry, i) => {
      const row = el("div", "res-row");
      const name = el("div", "res-name");
      name.append(el("span", "res-rank", "#" + (i + 1)),
        document.createTextNode(entry.name + "  ·  " + entry.mode));
      row.append(name, el("div", "res-score", (entry.score >= 0 ? "+" : "") + entry.score));
      list.appendChild(row);
    });
    return list;
  }

  function renderSettings() {
    const wrap = el("div");

    // Card-face form: traditional pips vs minimal duality faces
    const formRow = el("div", "set-row");
    formRow.append(el("span", null, "Card faces"));
    const formSeg = el("div", "seg");
    [["trad", "Classic"], ["alt", "Minimal"]].forEach(([v, label]) => {
      const b = el("button", null, label);
      if ((App.save.settings.cardForm || "trad") === v) b.classList.add("on");
      b.addEventListener("click", () => {
        App.save.settings.cardForm = v;
        Nertz.store.save(App.save);
        applySettings();
        formSeg.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        if (App.engine) App.ui.render(App.engine);
      });
      formSeg.appendChild(b);
    });
    formRow.appendChild(formSeg);
    wrap.appendChild(formRow);

    // Theme picker
    wrap.appendChild(el("div", "set-row", "")).append(el("span", null, "Table theme"));
    const grid = el("div", "theme-grid");
    Nertz.themes.THEMES.forEach((t) => {
      const opt = el("div", "theme-opt" + (App.save.settings.theme === t.id ? " on" : ""));
      opt.append(el("div", "theme-swatch " + t.id), el("div", "t-name", t.name), el("div", "t-blurb", t.blurb));
      opt.addEventListener("click", () => {
        App.save.settings.theme = t.id;
        Nertz.themes.apply(t.id);
        Nertz.store.save(App.save);
        grid.querySelectorAll(".theme-opt").forEach((o) => o.classList.remove("on"));
        opt.classList.add("on");
      });
      grid.appendChild(opt);
    });
    wrap.appendChild(grid);

    const toggle = (label, key) => {
      const row = el("div", "set-row");
      row.append(el("span", null, label));
      const sw = el("button", "switch" + (App.save.settings[key] ? " on" : ""));
      sw.addEventListener("click", () => {
        App.save.settings[key] = !App.save.settings[key];
        sw.classList.toggle("on", App.save.settings[key]);
        Nertz.store.save(App.save);
        applySettings();
      });
      row.appendChild(sw);
      return row;
    };
    wrap.append(
      toggle("Sound effects", "sound"),
      toggle("Left-handed layout", "leftHanded"),
      toggle("Reduce motion", "reduceMotion"),
    );
    const reset = el("button", "danger-link", "Reset all progress");
    reset.addEventListener("click", () => {
      if (confirm("Erase all stats, levels and leaderboard?")) {
        App.save = Nertz.store.reset();
        applySettings(); refreshLevelChip(); renderPanel("settings");
        App.ui.toast("Progress reset.");
      }
    });
    wrap.appendChild(reset);
    return wrap;
  }

  // ============ helpers ============
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  function dailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // route game events to the synth sound module
  function sfx(type) { Nertz.audio.play(type); }

  g.NertzApp = App; // debug handle (inspect game state from the console)

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : this);
