/* electron-main.js — desktop shell for Nertz Royale.
 * Wraps the static web app (index.html) in a native window so it can be
 * packaged into a .dmg (macOS), .exe (Windows), or AppImage (Linux).
 */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 1120,
    minWidth: 420,
    minHeight: 680,
    backgroundColor: "#0a3526",
    title: "Nertz Royale",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  if (win.removeMenu) win.removeMenu();
  win.loadFile(path.join(__dirname, "index.html"));
  // open external links in the user's browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
