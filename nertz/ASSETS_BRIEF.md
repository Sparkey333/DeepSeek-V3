# Nertz Royale — Art Asset Brief (Gemini handoff)

This is the spec for the three toggleable visual themes. Hand the prompt in the
next section to Gemini (or any image model). When the files come back, drop them
into the folders named below and flip `hasAssets: true` for that theme in
`js/themes.js` — they light up automatically, no other code changes.

## What we need — 3 themes × 2 images = 6 files

| Theme | Card back (PNG, **500×700**, no rounded corners) | Table background (JPG, **2560×1440**) |
|-------|--------------------------------------------------|----------------------------------------|
| Classic Felt | `assets/themes/classic/back.png` | `assets/themes/classic/table.jpg` |
| Midnight Neon | `assets/themes/neon/back.png` | `assets/themes/neon/table.jpg` |
| Royal Velvet | `assets/themes/royal/back.png` | `assets/themes/royal/table.jpg` |

**Rules that make them drop-in:**
- Card backs: exact **500×700 px**, PNG, full-bleed art (we round the corners in
  CSS — deliver square corners). **No text, no logos, no rank/suit indices** —
  pure ornamental back, symmetric, reads well at ~76 px tall.
- Table backgrounds: **2560×1440 px**, JPG, used as a full-screen `cover`.
  Keep the **center calm/low-contrast** (cards + UI sit on top and must stay
  legible); push detail/vignette to the edges. Subtle is better than busy.
- Keep each theme's two images visually consistent with each other.

---

## ✂️ Copy-paste this to Gemini

> I'm creating art for a digital card game ("Nertz Royale", a fast solitaire
> race). I need **three matching visual themes**, each consisting of **a playing-
> card back** and **a game-table background**. Produce them as separate images
> with these exact specs:
>
> **Card backs** — 500×700 px, PNG, portrait, full-bleed ornamental design with
> SQUARE corners. No text, no logos, no card indices — just a beautiful
> symmetric back pattern that reads clearly when shrunk to thumbnail size. Leave
> a faint ~5% margin so the pattern isn't clipped.
>
> **Table backgrounds** — 2560×1440 px, JPG, landscape. These fill the whole
> screen behind the cards, so keep the CENTER relatively calm and low-contrast
> (UI and cards overlay it and must stay readable); concentrate richness, texture
> and a soft vignette toward the edges/corners.
>
> Render the three themes in this exact order and palette:
>
> 1. **Classic Felt** — a luxurious casino card table. Background: rich green
>    baize/felt texture with a subtle radial spotlight, dark vignette corners
>    (greens #0c4733 → #072018). Card back: an elegant navy-and-gold guilloché /
>    ornate damask pattern (deep blues #1f5489 → #122f54 with thin gold linework).
>    Timeless, premium, classic poker-room feel.
>
> 2. **Midnight Neon** — synthwave / cyberpunk. Background: near-black deep indigo
>    glass (#0a0a1c → #04040c) with a faint perspective neon grid and soft cyan
>    (#22d3ee) and magenta (#ff4d6d) glows in the corners. Card back: dark panel
>    with glowing neon-cyan/magenta geometric linework, subtle grid, a faint
>    diamond motif. High-tech, electric, moody.
>
> 3. **Royal Velvet** — opulent and regal. Background: deep purple velvet
>    (#43215f → #150a28) with soft fabric sheen and a gold-dusted vignette. Card
>    back: rich purple with ornate gold filigree / baroque scrollwork and a small
>    central crown or fleur-de-lis motif (golds #f5c451 / #b9881f). Luxurious,
>    royal, gilded.
>
> Deliver all six images separately and clearly labeled (theme name + "card back"
> or "table"). Consistent lighting/quality across the set. No watermarks.

---

## Wiring it back up (for the dev/AI on return)

1. Save files to the paths in the table above (overwriting the `.gitkeep`s).
2. In `js/themes.js`, set `hasAssets: true` on each theme that now has art.
3. Re-run the standalone bundler if you want `Nertz-Royale.html` to embed them.
4. Test: Settings → Table theme → switch between all three.

Backgrounds and card backs are referenced via CSS variables (`--theme-table`,
`--theme-back`), so no markup changes are needed — only the two steps above.
