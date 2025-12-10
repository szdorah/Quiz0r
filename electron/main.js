const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  const appUrl =
    process.env.APP_URL || "http://localhost:3000";

  win.loadURL(appUrl);
}

app.whenReady().then(createWindow);
