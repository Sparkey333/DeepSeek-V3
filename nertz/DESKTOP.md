# Running Nertz Royale on your desktop

There are three ways to play, fastest first.

## 1. Instant play (no install) — `Nertz-Royale.html`

Double-click **`Nertz-Royale.html`**. It's the entire game inlined into one
file (no server, no dependencies) and opens in your browser. Works on macOS,
Windows, and Linux. This is the quickest "just launch it".

## 2. Build a real macOS app (`.dmg`)

A `.dmg` must be built **on a Mac** (Apple's packaging tools only run on macOS).
With [Node.js](https://nodejs.org) installed:

```bash
cd nertz
npm install        # pulls electron + electron-builder (first time only)
npm run dist       # builds dist/Nertz Royale-1.0.0.dmg
```

Then open `dist/Nertz Royale-1.0.0.dmg`, drag **Nertz Royale** into Applications,
and launch it from Launchpad.

> macOS Gatekeeper note: because the app isn't code-signed/notarized, the first
> launch needs **right-click → Open** (or *System Settings → Privacy & Security →
> Open Anyway*). Signing requires an Apple Developer account.

## 3. Run the desktop app without packaging

```bash
cd nertz
npm install
npm start          # opens the native Electron window immediately
```

## Other platforms

```bash
npm run dist:win     # Windows installer (.exe) — build on Windows
npm run dist:linux   # Linux AppImage — build on Linux
```

All targets wrap the same `index.html`; the game logic is identical everywhere.

## 4. Tauri build (smaller, native WebView)

Tauri produces a much smaller `.app`/`.dmg` (a few MB vs Electron's ~100 MB) by
using the OS's built-in WebView instead of bundling Chromium. It needs the
[Rust toolchain](https://rustup.rs) plus Node. From `nertz/`:

```bash
node scripts/build-web.js                      # assemble dist-web/ (the web root)
npx @tauri-apps/cli@^2 icon build/icon.png     # generate src-tauri/icons/* (once)
npx @tauri-apps/cli@^2 build                    # -> src-tauri/target/release/bundle/dmg/*.dmg
```

The macOS bundle still has to be built on macOS, and it's unsigned (same
right-click → Open caveat as above).

## CI / downloadable builds

Two GitHub Actions workflows build these for you on hosted runners, so you don't
need a Mac or any toolchain locally:

- **Build Nertz Royale desktop app** — Electron `.dmg` (macOS), `.exe` (Windows),
  `.AppImage` (Linux).
- **Build Nertz Royale (Tauri)** — the lighter Tauri `.dmg` + `.app` (macOS).

Download them from the **Actions** tab → the run → *Artifacts*. Push a tag like
`nertz-v1.0.0` and the Electron installers are also attached to a GitHub Release.
