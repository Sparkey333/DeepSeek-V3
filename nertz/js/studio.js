/* studio.js — Asset Studio (admin): BYOK connection to an image-generation
 * provider (default: Higgsfield) to generate and TEST theme assets in-game.
 *
 * Security model: the API key is BYOK — stored ONLY in this browser's
 * localStorage, sent ONLY to the endpoint the admin configures. Nothing is
 * proxied through any game server (there isn't one).
 *
 * Asset overrides are stored per theme/kind in localStorage and applied by
 * themes.js on top of any built-in art, so generated art is testable live.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const CFG_KEY = "nertz.studio.v1";   // {endpoint, apiKey, model}
  const DEFAULT_ENDPOINT = "https://platform.higgsfield.ai/v1/images/generations";

  const KINDS = {
    back:  { name: "Card back", w: 500, h: 700 },
    table: { name: "Table background", w: 1600, h: 900 },
  };

  // Prompt presets distilled from ASSETS_BRIEF.md, per theme.
  const PROMPTS = {
    classic: { back: "elegant playing-card back, navy and gold guilloche damask pattern, deep blues #1f5489 to #122f54, thin gold linework, symmetric, full-bleed, no text", table: "luxurious casino card table, rich green baize felt texture, subtle radial spotlight, dark vignette corners, calm center, no objects, no text" },
    neon:    { back: "playing-card back, dark panel with glowing neon cyan and magenta geometric linework, subtle grid, diamond motif, synthwave, symmetric, no text", table: "near-black deep indigo glass surface, faint perspective neon grid, soft cyan and magenta corner glows, calm dark center, synthwave, no text" },
    royal:   { back: "playing-card back, rich purple with ornate gold filigree baroque scrollwork, small central crown motif, opulent, symmetric, no text", table: "deep purple velvet fabric surface, soft sheen, gold-dusted vignette edges, calm center, regal, no text" },
    sakura:  { back: "playing-card back, soft pink cherry-blossom pattern on paper-white, delicate petals, japanese minimal, symmetric, no text", table: "soft pink dusk sky gradient over pale wooden table, drifting cherry blossom petals at edges, calm center, no text" },
    forest:  { back: "playing-card back, dark woodgrain with carved gold pine motif, mossy emerald accents, rustic, symmetric, no text", table: "mossy emerald forest floor table surface, soft dappled light, dark green vignette, calm center, no text" },
    noir:    { back: "playing-card back, monochrome ink pattern, ivory linework on charcoal black, art-deco minimal, symmetric, no text", table: "matte charcoal black surface, subtle ivory rim light, film-noir mood, calm dark center, no text" },
  };

  function cfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { return {}; } }
  function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }

  let hooks = {}; // { toast(msg,gold), reapplyTheme() }
  function init(h) { hooks = h || {}; }

  // ---- generation ---------------------------------------------------------
  // Generic JSON contract: POST {prompt, width, height, model?} with the key
  // as both Bearer and hf-api-key headers; accepts the common response shapes.
  async function generate(prompt, kind) {
    const c = cfg();
    if (!c.apiKey) throw new Error("No API key saved — paste your Higgsfield key first.");
    const endpoint = c.endpoint || DEFAULT_ENDPOINT;
    const body = { prompt: prompt, width: KINDS[kind].w, height: KINDS[kind].h };
    if (c.model) body.model = c.model;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + c.apiKey,
        "hf-api-key": c.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Provider returned HTTP " + res.status + " — check key, endpoint & model.");
    const j = await res.json();
    const url = j.url || j.image_url
      || (j.images && j.images[0] && (j.images[0].url || j.images[0].image_url))
      || (j.data && j.data[0] && (j.data[0].url
          || (j.data[0].b64_json && "data:image/png;base64," + j.data[0].b64_json)))
      || (j.output && j.output[0]);
    if (!url) throw new Error("Couldn't find an image URL in the response — adjust the endpoint/model.");
    return url;
  }

  // ---- overrides ----------------------------------------------------------
  function setOverride(themeId, kind, url) {
    const ov = Nertz.themes.getOverrides();
    ov[themeId] = ov[themeId] || {};
    ov[themeId][kind] = url;
    Nertz.themes.saveOverrides(ov);
    hooks.reapplyTheme && hooks.reapplyTheme();
  }
  function clearOverride(themeId) {
    const ov = Nertz.themes.getOverrides();
    delete ov[themeId];
    Nertz.themes.saveOverrides(ov);
    hooks.reapplyTheme && hooks.reapplyTheme();
  }

  // ---- panel UI -----------------------------------------------------------
  function render() {
    const c = cfg();
    const wrap = el("div", "studio");

    wrap.appendChild(el("div", "studio-note",
      "🔑 BYOK admin — your key is stored only in this browser and sent only to the endpoint below. Generated art applies live to the selected theme so you can test it in-game."));

    // connection
    const keyIn = input("password", c.apiKey || "", "Higgsfield API key");
    const epIn = input("text", c.endpoint || DEFAULT_ENDPOINT, "Endpoint URL");
    const modelIn = input("text", c.model || "", "Model (optional)");
    const saveBtn = button("Save connection", "primary", () => {
      saveCfg({ apiKey: keyIn.value.trim(), endpoint: epIn.value.trim(), model: modelIn.value.trim() });
      hooks.toast("🔑 Connection saved (this browser only)", true);
    });
    const testBtn = button("Test", "", async () => {
      status.textContent = "Testing connection…";
      try { await generate("test swatch, solid deep green felt texture", "back"); status.textContent = "✅ Connection works."; }
      catch (e) { status.textContent = "⚠️ " + e.message + " (browser CORS can also block — if so, generate on the provider site and use Upload/URL below)"; }
    });
    wrap.appendChild(group("Connection — Higgsfield (BYOK)", [keyIn, epIn, modelIn, row([saveBtn, testBtn])]));

    // target picker
    const themeSel = select(Nertz.themes.THEMES.map((t) => [t.id, t.name]), "classic");
    const kindSel = select(Object.keys(KINDS).map((k) => [k, KINDS[k].name]), "back");
    const promptTa = document.createElement("textarea");
    promptTa.className = "studio-in studio-ta";
    promptTa.rows = 3;
    const syncPrompt = () => { promptTa.value = (PROMPTS[themeSel.value] || {})[kindSel.value] || ""; };
    themeSel.addEventListener("change", syncPrompt);
    kindSel.addEventListener("change", syncPrompt);
    syncPrompt();

    const preview = el("div", "studio-preview");
    const status = el("div", "studio-status", "");
    let lastUrl = null;
    const showPreview = (url) => {
      lastUrl = url;
      preview.innerHTML = "";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "asset preview";
      preview.appendChild(img);
      applyBtn.disabled = false;
    };

    const genBtn = button("✨ Generate", "primary", async () => {
      status.textContent = "Generating via " + ((cfg().endpoint || DEFAULT_ENDPOINT).split("/")[2] || "provider") + "…";
      genBtn.disabled = true;
      try { showPreview(await generate(promptTa.value, kindSel.value)); status.textContent = "Generated — apply it to test in-game."; }
      catch (e) { status.textContent = "⚠️ " + e.message; }
      genBtn.disabled = false;
    });

    // fallbacks: upload a file / paste an image URL (works with any generator)
    const fileIn = input("file", "", "");
    fileIn.accept = "image/*";
    fileIn.addEventListener("change", () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { showPreview(r.result); status.textContent = "Loaded from file."; };
      r.readAsDataURL(f);
    });
    const urlIn = input("text", "", "…or paste an image URL");
    const urlBtn = button("Load URL", "", () => { if (urlIn.value.trim()) { showPreview(urlIn.value.trim()); status.textContent = "Loaded from URL."; } });

    const applyBtn = button("Apply to theme →", "primary", () => {
      if (!lastUrl) return;
      setOverride(themeSel.value, kindSel.value, lastUrl);
      hooks.toast("🎨 Applied to " + themeSel.value + " (" + kindSel.value + ") — switch to that theme to see it", true);
    });
    applyBtn.disabled = true;
    const clearBtn = button("Clear theme overrides", "", () => {
      clearOverride(themeSel.value);
      hooks.toast("Cleared overrides for " + themeSel.value);
    });

    wrap.appendChild(group("Generate & test assets", [
      row([themeSel, kindSel]), promptTa, row([genBtn]),
      row([fileIn]), row([urlIn, urlBtn]),
      status, preview, row([applyBtn, clearBtn]),
    ]));
    return wrap;
  }

  // little element helpers
  function input(type, val, ph) { const i = document.createElement("input"); i.type = type; i.value = val; i.placeholder = ph; i.className = "studio-in"; return i; }
  function select(pairs, val) { const s = document.createElement("select"); s.className = "studio-in"; pairs.forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; s.appendChild(o); }); s.value = val; return s; }
  function button(txt, kind, fn) { const b = el("button", "studio-btn" + (kind ? " " + kind : ""), txt); b.addEventListener("click", fn); return b; }
  function row(items) { const r = el("div", "studio-row"); items.forEach((i) => r.appendChild(i)); return r; }
  function group(title, items) { const gp = el("div", "studio-group"); gp.appendChild(el("div", "studio-title", title)); items.forEach((i) => gp.appendChild(i)); return gp; }

  Nertz.studio = { init, render, generate };
})(typeof window !== "undefined" ? window : this);
