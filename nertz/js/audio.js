/* audio.js — tiny WebAudio sound design (no asset files).
 * Synthesizes subtle card sounds so the standalone HTML stays self-contained.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});

  let ctx = null;
  let enabled = true;
  let noiseBuf = null;
  let master = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      ctx = new (g.AudioContext || g.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      // 1s of white noise reused for card "snaps"
      const len = Math.floor(ctx.sampleRate * 1);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }

  function now() { return ctx.currentTime; }

  // filtered noise burst (the "flick/snap" of a card)
  function snap(t, { dur = 0.09, freq = 2200, q = 0.8, gain = 0.12 } = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(gn); gn.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  // short pitched tone (chimes / fanfare)
  function tone(t, { freq = 660, dur = 0.16, type = "sine", gain = 0.09 } = {}) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    play() { const t = now(); snap(t, { freq: 2400, gain: 0.11, dur: 0.08 }); tone(t + 0.005, { freq: 520, dur: 0.05, gain: 0.03, type: "triangle" }); },
    deal() { const t = now(); snap(t, { freq: 1700, gain: 0.08, dur: 0.07 }); },
    flip() { const t = now(); snap(t, { freq: 1200, q: 0.6, gain: 0.09, dur: 0.11 }); },
    foundation() { const t = now(); tone(t, { freq: 740, dur: 0.12, gain: 0.07, type: "sine" }); tone(t + 0.07, { freq: 990, dur: 0.16, gain: 0.07, type: "sine" }); },
    invalid() { const t = now(); tone(t, { freq: 150, dur: 0.16, gain: 0.08, type: "sawtooth" }); },
    select() { const t = now(); tone(t, { freq: 420, dur: 0.06, gain: 0.05, type: "triangle" }); },
    levelup() { const t = now(); [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.09, { freq: f, dur: 0.22, gain: 0.07 })); },
    win() { const t = now(); [659, 784, 988, 1318, 1568].forEach((f, i) => tone(t + i * 0.1, { freq: f, dur: 0.28, gain: 0.08 })); },
    lose() { const t = now(); [392, 330, 262].forEach((f, i) => tone(t + i * 0.14, { freq: f, dur: 0.3, gain: 0.07, type: "triangle" })); },
    hex() { const t = now(); [880, 620, 440].forEach((f, i) => tone(t + i * 0.06, { freq: f, dur: 0.12, gain: 0.06, type: "triangle" })); snap(t + 0.02, { freq: 900, gain: 0.05, dur: 0.12 }); },
    haunt() { const t = now(); tone(t, { freq: 92, dur: 0.5, gain: 0.07, type: "sawtooth" }); tone(t + 0.1, { freq: 66, dur: 0.62, gain: 0.08, type: "sine" }); snap(t, { freq: 300, q: 0.4, gain: 0.05, dur: 0.4 }); },
    spark() { const t = now(); tone(t, { freq: 1180, dur: 0.09, gain: 0.05 }); tone(t + 0.05, { freq: 1560, dur: 0.12, gain: 0.05 }); },
  };

  Nertz.audio = {
    setEnabled(v) { enabled = !!v; },
    // unlock the AudioContext on first user gesture (browsers require this)
    unlock() { if (enabled && ensure() && ctx.state === "suspended") ctx.resume(); },
    play(type) {
      if (!enabled) return;
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      const fn = SOUNDS[type];
      if (fn) { try { fn(); } catch (e) { /* ignore */ } }
    },
  };
})(typeof window !== "undefined" ? window : this);
