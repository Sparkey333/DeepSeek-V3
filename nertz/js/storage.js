/* storage.js — persistence for leaderboards, stats & progression.
 * Uses localStorage; gracefully degrades to in-memory if unavailable.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const KEY = "nertz.save.v1";

  const _mem = {};
  const hasLS = (function () {
    try { const k = "__nz"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
    catch (e) { return false; }
  })();

  function _read() {
    if (!hasLS) return _mem.data ? JSON.parse(_mem.data) : null;
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function _write(obj) {
    const s = JSON.stringify(obj);
    if (hasLS) localStorage.setItem(KEY, s);
    else _mem.data = s;
  }

  function defaults() {
    return {
      profile: { name: "You", xp: 0, level: 1, coins: 0 },
      stats: {
        gamesPlayed: 0, wins: 0, bestScore: -Infinity, bestTimeMs: null,
        totalFoundationCards: 0, fastestNertzMs: null, streak: 0, bestStreak: 0,
      },
      achievements: {},        // id -> unlockedAt
      leaderboard: [],         // [{name, score, mode, date, timeMs}]
      daily: { lastSeed: null, lastResult: null },
      settings: { sound: true, leftHanded: false, reduceMotion: false, theme: "classic" },
    };
  }

  function load() {
    const data = _read();
    if (!data) { const d = defaults(); _write(d); return d; }
    // shallow-merge defaults so new fields appear on upgrade
    const base = defaults();
    return Object.assign(base, data, {
      profile: Object.assign(base.profile, data.profile),
      stats: Object.assign(base.stats, data.stats),
      settings: Object.assign(base.settings, data.settings),
      achievements: data.achievements || {},
      leaderboard: data.leaderboard || [],
      daily: Object.assign(base.daily, data.daily),
    });
  }

  function save(data) { _write(data); return data; }

  function addLeaderboard(data, entry) {
    data.leaderboard.push(entry);
    data.leaderboard.sort((a, b) => b.score - a.score);
    data.leaderboard = data.leaderboard.slice(0, 50);
    return save(data);
  }

  function reset() {
    if (hasLS) localStorage.removeItem(KEY);
    _mem.data = null;
    return load();
  }

  Nertz.store = { load, save, addLeaderboard, reset, hasLS };
})(typeof window !== "undefined" ? window : this);
