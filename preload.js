const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = [
                'open:terminal',
                'terminal-input',
                'terminal:minimize',
                'terminal:maximize',
                'terminal:close',
                'open:browser',
                'open:synth',
                'open:minesweeper',
                'open:shapeapps',
                'open:ipod',
                'open:chat',
                'open-external-url',
                'shapeapps:minimize',
                'shapeapps:maximize',
                'shapeapps:close',
                'ipod:minimize',
                'ipod:maximize',
                'ipod:close',
                'close-ipod-window',
                'synth:minimize',
                'synth:maximize',
                'synth:close',
                'minesweeper:minimize',
                'minesweeper:maximize',
                'minesweeper:close',
                'volume:set',
                'browser:load-url',
                'browser:search',
                'browser:reload',
                'chat:send-message',
                'chat:add-contact',
                'chat:remove-contact',
                'chat:update-status'
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = [
                'terminal-output',
                'auth:exchange-code',
                'volume:level',
                'wifi:list',
                'chat:message-received',
                'chat:contact-updated',
                'chat:status-changed'
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        invoke: (channel, data) => {
            let validChannels = [
                'auth:exchange-code',
                'volume:get',
                'wifi:list',
                'time:get',
                'chat:get-messages',
                'chat:get-contacts',
                'chat:get-user-info'
            ];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        }
    }
);

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