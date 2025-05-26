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
    onOutput: (callback) => {
        ipcRenderer.on('terminal-output', (event, data) => callback(data));
    },
    sendInput: (input) => ipcRenderer.send('terminal-input', input),
    minimize: () => ipcRenderer.send('terminal:minimize'),
    maximize: () => ipcRenderer.send('terminal:maximize'),
    close: () => ipcRenderer.send('terminal:close'),
    runShapeCli: () => ipcRenderer.send('run-shape-cli')
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
  loadBrowserUrl: (url) => ipcRenderer.send('load-browser-url', url),
  openBrowserWithUrl: (url) => ipcRenderer.send('open:browser', url)
});

// Expose iPod window controls
contextBridge.exposeInMainWorld('ipod', {
  minimize: () => ipcRenderer.send('ipod:minimize'),
  maximize: () => ipcRenderer.send('ipod:maximize'),
  close: () => ipcRenderer.send('ipod:close'),
  open: () => ipcRenderer.send('open:ipod')
});

// Expose closeIpodWindow as a separate API if needed
contextBridge.exposeInMainWorld('ipodControls', {
  closeIpodWindow: () => ipcRenderer.send('close-ipod-window')
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = inputElement.value.trim();
    if (!value) return;

    if (value === '!shape') {
        window.terminal.runShapeCli();
        inputElement.value = '';
        return;
    }

    window.terminal.sendInput(value + '\n');
    inputElement.value = '';
});

const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

ipcMain.on('run-shape-cli', (event) => {
    const scriptPath = path.join(__dirname, 'run.sh');
    const child = spawn(scriptPath, [], { shell: true });

    child.stdout.on('data', (data) => {
        event.sender.send('terminal-output', data.toString());
    });
    child.stderr.on('data', (data) => {
        event.sender.send('terminal-output', data.toString());
    });
    child.on('close', (code) => {
        event.sender.send('terminal-output', `\n[Shapes CLI exited with code ${code}]\n`);
    });
});