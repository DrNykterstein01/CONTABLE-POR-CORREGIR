const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV === 'true';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  console.log('[electron] isDev=', isDev, 'VITE_DEV_SERVER_URL=', process.env.VITE_DEV_SERVER_URL);

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    const url = process.env.VITE_DEV_SERVER_URL;
    console.log(`[electron] loading URL ${url}`);
    win.loadURL(url).catch(err => console.error('[electron] failed to load URL', err));
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log(`[electron] loading file ${indexPath}`);
    try {
      const { pathToFileURL } = require('url');
      const fileUrl = pathToFileURL(indexPath).href;
      console.log('[electron] loading file URL', fileUrl);
      win.loadURL(fileUrl).catch(err => console.error('[electron] failed to load file URL', err));
    } catch (err) {
      console.error('[electron] error building file URL', err);
      win.loadFile(indexPath).catch(err2 => console.error('[electron] failed to load file', err2));
    }
    // don't open DevTools in production by default
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
