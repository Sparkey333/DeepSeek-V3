/* progression.js — XP, levels, achievements & rewards.
 * Pure functions over a save object; the caller persists the result.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});

  // XP required to reach level n (cumulative). Gentle early, steeper later.
  function xpForLevel(level) { return Math.round(50 * Math.pow(level, 1.6)); }

  function levelFromXp(xp) {
    let lvl = 1;
    while (xp >= xpForLevel(lvl + 1)) lvl++;
    return lvl;
  }

  const ACHIEVEMENTS = [
    { id: "first_blood",  name: "First Shuffle",   desc: "Finish your first game.",            icon: "🃏",
      test: (s) => s.stats.gamesPlayed >= 1 },
    { id: "nertz_caller", name: "Nertz!",          desc: "Empty your Nertz pile to win a round.", icon: "📣",
      test: (s) => s.stats.wins >= 1 },
    { id: "speed_demon",  name: "Speed Demon",     desc: "Win a round in under 90 seconds.",   icon: "⚡",
      test: (s) => s.stats.fastestNertzMs != null && s.stats.fastestNertzMs < 90000 },
    { id: "century",      name: "Century Club",    desc: "Play 100 foundation cards total.",   icon: "💯",
      test: (s) => s.stats.totalFoundationCards >= 100 },
    { id: "hot_streak",   name: "Hot Streak",      desc: "Win 3 rounds in a row.",             icon: "🔥",
      test: (s) => s.stats.bestStreak >= 3 },
    { id: "high_roller",  name: "High Roller",     desc: "Score 40+ in a single round.",       icon: "🎯",
      test: (s) => s.stats.bestScore >= 40 },
    { id: "marathon",     name: "Marathoner",      desc: "Play 25 games.",                     icon: "🏃",
      test: (s) => s.stats.gamesPlayed >= 25 },
    { id: "ace_slayer",   name: "Ace Slayer",      desc: "Beat the 'Ace' difficulty bots.",    icon: "👑",
      test: (s) => !!s._flags && s._flags.beatHard },
  ];

  // Award XP & coins, recompute level, and surface any level-ups.
  function grantRewards(save, { xp, coins }) {
    const before = save.profile.level;
    save.profile.xp += xp || 0;
    save.profile.coins += coins || 0;
    save.profile.level = levelFromXp(save.profile.xp);
    return { leveledUp: save.profile.level > before, from: before, to: save.profile.level };
  }

  // Check all achievements; return the list newly unlocked this call.
  function checkAchievements(save) {
    const now = Date.now();
    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (!save.achievements[a.id] && a.test(save)) {
        save.achievements[a.id] = now;
        unlocked.push(a);
      }
    }
    return unlocked;
  }

  // Translate an end-of-round result into XP/coins.
  function scoreToRewards(result) {
    // result: { score, won, foundationCards, timeMs, difficulty }
    let xp = Math.max(0, result.foundationCards) * 4;
    if (result.won) xp += 50;
    if (result.difficulty === "hard") xp = Math.round(xp * 1.5);
    else if (result.difficulty === "normal") xp = Math.round(xp * 1.2);
    const coins = Math.max(0, result.score) + (result.won ? 10 : 0);
    return { xp, coins };
  }

  Nertz.progression = {
    xpForLevel, levelFromXp, ACHIEVEMENTS,
    grantRewards, checkAchievements, scoreToRewards,
  };
})(typeof window !== "undefined" ? window : this);
