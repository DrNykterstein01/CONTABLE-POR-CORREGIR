const { contextBridge } = require('electron');

// Expose a tiny API to the renderer if needed in the future.
contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future native integrations
});
