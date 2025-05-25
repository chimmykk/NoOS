const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('terminal', {
  sendInput: (input) => ipcRenderer.send('terminal-input', input),
  onOutput: (callback) => ipcRenderer.on('terminal-output', (_, data) => callback(data)),
  minimize: () => ipcRenderer.send('terminal:minimize'),
  maximize: () => ipcRenderer.send('terminal:maximize'),
  close: () => ipcRenderer.send('terminal:close')
});

contextBridge.exposeInMainWorld('synth', {
  minimize: () => ipcRenderer.send('synth:minimize'),
  maximize: () => ipcRenderer.send('synth:maximize'),
  close: () => ipcRenderer.send('synth:close')
});

contextBridge.exposeInMainWorld('minesweeper', {
  minimize: () => ipcRenderer.send('minesweeper:minimize'),
  maximize: () => ipcRenderer.send('minesweeper:maximize'),
  close: () => ipcRenderer.send('minesweeper:close')
});

// Expose ShapeApps window controls and functionality
contextBridge.exposeInMainWorld('shapeapps', {
  minimize: () => ipcRenderer.send('shapeapps:minimize'),
  maximize: () => ipcRenderer.send('shapeapps:maximize'),
  close: () => ipcRenderer.send('shapeapps:close'),
  loadBrowserUrl: (url) => ipcRenderer.send('load-browser-url', url), // Expose function to load URL in browser iframe
  openBrowserWithUrl: (url) => ipcRenderer.send('open:browser', url) // Expose function to open browser with URL
});

// Expose iPod window controls
contextBridge.exposeInMainWorld('ipod', {
  minimize: () => ipcRenderer.send('ipod:minimize'),
  maximize: () => ipcRenderer.send('ipod:maximize'),
  close: () => ipcRenderer.send('ipod:close'),
  open: () => ipcRenderer.send('open:ipod')
});

// Removed iPod, Videos, and Photos exposed functions 

contextBridge.exposeInMainWorld(
  'ipodControls',
  {
    closeIpodWindow: () => ipcRenderer.send('close-ipod-window')
  }
); 