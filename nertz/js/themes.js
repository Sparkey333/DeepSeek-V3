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
  ];

  const byId = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  function apply(id) {
    const theme = byId(id);
    THEMES.forEach((t) => document.body.classList.remove("theme-" + t.id));
    document.body.classList.add("theme-" + theme.id);

    // If artwork is present, wire it via CSS variables; otherwise clear them so
    // the procedural CSS fallback shows through.
    const root = document.documentElement.style;
    if (theme.hasAssets) {
      root.setProperty("--theme-table", `url("${theme.assets.table}")`);
      root.setProperty("--theme-back", `url("${theme.assets.back}")`);
      document.body.classList.add("theme-has-assets");
    } else {
      root.removeProperty("--theme-table");
      root.removeProperty("--theme-back");
      document.body.classList.remove("theme-has-assets");
    }
    return theme.id;
  }

  Nertz.themes = { THEMES, byId, apply };
})(typeof window !== "undefined" ? window : this);
