/* themes.js — visual theme registry + toggling.
 *
 * Each theme is applied by toggling a `theme-<id>` class on <body>; the CSS
 * (style.css) carries the per-theme felt colors, accents, and card-back look.
 * Themes render with procedural CSS right now, so they're fully testable
 * before any art exists. When image assets arrive (see ASSETS_BRIEF.md), drop
 * them into the paths below and set `hasAssets: true` — the CSS will switch
 * from the procedural look to the artwork automatically.
 */
(function (g) {
  "use strict";
  const Nertz = (g.Nertz = g.Nertz || {});

  const THEMES = [
    {
      id: "classic",
      name: "Classic Felt",
      blurb: "Casino green, navy card backs.",
      hasAssets: false,
      assets: { table: "assets/themes/classic/table.jpg", back: "assets/themes/classic/back.png" },
    },
    {
      id: "neon",
      name: "Midnight Neon",
      blurb: "Black glass, cyan & magenta glow.",
      hasAssets: false,
      assets: { table: "assets/themes/neon/table.jpg", back: "assets/themes/neon/back.png" },
    },
    {
      id: "royal",
      name: "Royal Velvet",
      blurb: "Deep purple velvet, gold filigree.",
      hasAssets: false,
      assets: { table: "assets/themes/royal/table.jpg", back: "assets/themes/royal/back.png" },
    },
    {
      id: "sakura",
      name: "Sakura",
      blurb: "Soft pink dusk, paper-white backs.",
      hasAssets: false,
      assets: { table: "assets/themes/sakura/table.jpg", back: "assets/themes/sakura/back.png" },
    },
    {
      id: "forest",
      name: "Forest",
      blurb: "Mossy emerald, woodgrain backs.",
      hasAssets: false,
      assets: { table: "assets/themes/forest/table.jpg", back: "assets/themes/forest/back.png" },
    },
    {
      id: "noir",
      name: "Noir",
      blurb: "Monochrome midnight, ivory ink.",
      hasAssets: false,
      assets: { table: "assets/themes/noir/table.jpg", back: "assets/themes/noir/back.png" },
    },
  ];

  const byId = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  // Asset Studio overrides (admin-generated art), stored per theme/kind.
  const OV_KEY = "nertz.assets.v1";
  function getOverrides() { try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch (e) { return {}; } }
  function saveOverrides(ov) { try { localStorage.setItem(OV_KEY, JSON.stringify(ov)); } catch (e) { /* quota */ } }

  function apply(id) {
    const theme = byId(id);
    THEMES.forEach((t) => document.body.classList.remove("theme-" + t.id));
    document.body.classList.add("theme-" + theme.id);

    // Artwork resolution order: Studio override > bundled asset > procedural CSS.
    const ov = getOverrides()[theme.id] || {};
    const table = ov.table || (theme.hasAssets ? theme.assets.table : null);
    const back = ov.back || (theme.hasAssets ? theme.assets.back : null);
    const root = document.documentElement.style;
    if (table) root.setProperty("--theme-table", 'url("' + table + '")');
    else root.removeProperty("--theme-table");
    if (back) root.setProperty("--theme-back", 'url("' + back + '")');
    else root.removeProperty("--theme-back");
    document.body.classList.toggle("theme-has-assets", !!table);
    document.body.classList.toggle("theme-has-back", !!back);
    return theme.id;
  }

  Nertz.themes = { THEMES, byId, apply, getOverrides, saveOverrides };
})(typeof window !== "undefined" ? window : this);
