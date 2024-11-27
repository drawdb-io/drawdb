const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al proceso renderer
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});
