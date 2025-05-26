const electron = require('electron');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const { shell } = require('electron');
const { startServer } = require('./src/api/server'); // Ensure this path is correct
const si = require('systeminformation');
const vol = require('vol');
const wifiList = require('wifi-list-windows');
const axios = require('axios');
const fetch = require('node-fetch');

// Start the auth server
startServer();

const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let mainWindow;
let terminalWindow;
let shellProcess;
let synthWindow;
let minesweeperWindow;
let ipodWindow;
let videosWindow; // Declared but not used in provided snippet
let photosWindow; // Declared but not used in provided snippet
let shapeappsWindow;
let browserWindow; // This one is for the generic browser, distinct from the one opened by 'open:browser'

function createMainWindow() {
    mainWindow = new BrowserWindow({
        frame: false,
        icon: path.join(__dirname, './assets/img/icon.png'), // Ensure this path is correct
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.maximize();
    mainWindow.loadFile('./dist/index.html'); // Ensure this path is correct

    // Remove default menu bar
    mainWindow.setMenu(null);

    mainWindow.on('closed', function(){
        app.quit();
    });

    // Optional: Open DevTools for main window
    // mainWindow.webContents.openDevTools();
}

function createTerminalWindow() {
    if (terminalWindow) {
        terminalWindow.focus();
        return;
    }

    terminalWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const shellCmd = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');
    shellProcess = spawn(shellCmd, [], { // Corrected variable name
        env: process.env,
        stdio: 'pipe'
    });

    shellProcess.stdout.on('data', (data) => {
        console.log('Main process sending stdout data:', data.toString());
        if (terminalWindow && !terminalWindow.isDestroyed()) {
            terminalWindow.webContents.send('terminal-output', data.toString());
        }
    });

    shellProcess.stderr.on('data', (data) => {
        console.log('Main process sending stderr data:', data.toString());
        if (terminalWindow && !terminalWindow.isDestroyed()) {
            terminalWindow.webContents.send('terminal-output', data.toString());
        }
    });

    shellProcess.on('exit', (code, signal) => {
        console.log(`Shell process exited with code ${code} and signal ${signal}`);
        if (terminalWindow && !terminalWindow.isDestroyed()) {
            terminalWindow.webContents.send('terminal-output', `\nShell process exited.\n`);
        }
        shellProcess = null;
    });

    terminalWindow.on('closed', () => {
        console.log('Terminal window closed.');
        if (shellProcess) {
            shellProcess.kill();
            shellProcess = null;
        }
        terminalWindow = null;
    });

    terminalWindow.loadFile('./dist/terminal.html'); // Ensure this path is correct
    // terminalWindow.webContents.openDevTools();
}

function createSynthWindow() {
    if (synthWindow) {
        synthWindow.focus();
        return;
    }
    synthWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    synthWindow.loadFile('./dist/synth.html'); // Ensure this path is correct
    synthWindow.on('closed', () => {
        console.log('Synth window closed.');
        synthWindow = null;
    });
    // synthWindow.webContents.openDevTools();
}

function createMinesweeperWindow() {
    if (minesweeperWindow) {
        minesweeperWindow.focus();
        return;
    }
    minesweeperWindow = new BrowserWindow({
        width: 400,
        height: 500,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    minesweeperWindow.loadFile('./dist/minesweeper.html'); // Ensure this path is correct
    minesweeperWindow.on('closed', () => {
        console.log('Minesweeper window closed.');
        minesweeperWindow = null;
    });
    // minesweeperWindow.webContents.openDevTools();
}

function createShapeAppsWindow() {
    if (shapeappsWindow) {
        shapeappsWindow.show();
        shapeappsWindow.focus();
        return;
    }
    shapeappsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    shapeappsWindow.loadFile('dist/shapeapps.html'); // Ensure this path is correct
    shapeappsWindow.once('ready-to-show', () => {
        shapeappsWindow.show();
    });
    shapeappsWindow.on('closed', () => {
        shapeappsWindow = null;
    });
}

function createIpodWindow() {
    if (ipodWindow) {
        ipodWindow.show();
        ipodWindow.focus();
        return;
    }
    ipodWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    ipodWindow.loadFile('dist/ipods.html'); // Ensure this path is correct
    ipodWindow.once('ready-to-show', () => {
        ipodWindow.show();
    });
    ipodWindow.on('closed', () => {
        ipodWindow = null;
    });
}

function createChatWindow() {
    // Re-declare chatWindow here as it's function-scoped, or manage it globally if needed
    let chatWindowInstance = new BrowserWindow({ // Renamed to avoid conflict if you have a global `chatWindow`
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Consider if sandbox: true is possible with your preload
            webSecurity: true,
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: process.env.NODE_ENV === 'development'
        }
    });

    chatWindowInstance.loadFile('src/components/ChatWindow.html'); // Ensure this path is correct

    chatWindowInstance.once('ready-to-show', () => {
        chatWindowInstance.show();
    });

    chatWindowInstance.on('closed', () => {
        chatWindowInstance = null; // Nullify the instance
    });

    if (process.env.NODE_ENV === 'development') {
        chatWindowInstance.webContents.openDevTools();
    }
    return chatWindowInstance; // Return the instance if you need to manage it
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// IPC Handlers
ipcMain.on('open:terminal', createTerminalWindow);
ipcMain.on('terminal-input', (event, input) => {
    console.log('Main process received terminal input:', input);
    if (shellProcess && shellProcess.stdin.writable) {
        shellProcess.stdin.write(input);
    }
});
ipcMain.on('terminal:minimize', () => terminalWindow?.minimize());
ipcMain.on('terminal:maximize', () => {
    if (terminalWindow) {
        terminalWindow.isMaximized() ? terminalWindow.unmaximize() : terminalWindow.maximize();
    }
});
ipcMain.on('terminal:close', () => terminalWindow?.close());

ipcMain.on('open:browser', (event, url) => {
    console.log('Main process received open:browser', url ? `with URL: ${url}` : '');
    const newBrowserWindow = new BrowserWindow({ // Create a new instance each time
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
            // No preload needed if it's just displaying external content and not interacting via IPC
        }
    });
    const targetUrl = url && url !== '#' ? url : 'https://www.google.com';
    newBrowserWindow.loadURL(targetUrl);
    // newBrowserWindow becomes eligible for garbage collection when closed if not stored globally
});

ipcMain.on('open:synth', createSynthWindow);
ipcMain.on('open:minesweeper', createMinesweeperWindow);
ipcMain.on('open:shapeapps', createShapeAppsWindow);
ipcMain.on('open:ipod', createIpodWindow);
ipcMain.on('open:chat', createChatWindow);

ipcMain.on('open-external-url', (event, url) => {
    console.log('Received request to open external url:', url);
    shell.openExternal(url);
});

// Window control IPC handlers (ShapeApps, iPod, Synth, Minesweeper)
['shapeapps', 'ipod', 'synth', 'minesweeper'].forEach(windowName => {
    let windowInstance; // Will hold shapeappsWindow, ipodWindow, etc.
    // A bit of a trick to get the actual window variable by its name string
    // This is generally not recommended; better to pass the window object or use a map
    // For this specific structure, we'll retrieve it when needed.

    const getWindowInstance = () => {
        if (windowName === 'shapeapps') return shapeappsWindow;
        if (windowName === 'ipod') return ipodWindow;
        if (windowName === 'synth') return synthWindow;
        if (windowName === 'minesweeper') return minesweeperWindow;
        return null;
    };

    ipcMain.on(`${windowName}:minimize`, () => getWindowInstance()?.minimize());
    ipcMain.on(`${windowName}:maximize`, () => {
        const win = getWindowInstance();
        if (win) {
            win.isMaximized() ? win.unmaximize() : win.maximize();
        }
    });
    ipcMain.on(`${windowName}:close`, () => getWindowInstance()?.close());
});

ipcMain.on('close-ipod-window', () => ipodWindow?.close());


// Menu Template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() { app.quit(); }
            }
        ]
    }
];
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) { focusedWindow?.toggleDevTools(); }
            },
            { role: 'reload' }
        ]
    });
}
if (process.platform === 'darwin') {
    mainMenuTemplate.unshift({
        label: app.getName(), // Use app name
        submenu: [
            { role: 'about' }, { type: 'separator' }, { role: 'services' },
            { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' },
            { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }
        ]
    });
}
// Build menu from template (but not setting it on mainWindow as it's frameless)
// const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
// Menu.setApplicationMenu(mainMenu); // Set application menu if you want it globally

// Volume Control
ipcMain.handle('volume:get', async () => {
    try {
        if (process.platform === 'darwin') {
            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                exec('osascript -e "output volume of (get volume settings)"', (error, stdout) => {
                    if (error) { console.error('Error getting volume (macOS):', error); reject(error); return; }
                    resolve(parseInt(stdout.trim(), 10) / 100);
                });
            });
        } else {
            return await vol.get();
        }
    } catch (error) { console.error('Error getting volume:', error); return 0; }
});
ipcMain.on('volume:set', async (event, level) => {
    try {
        const volumeLevel = Math.round(level * 100);
        if (process.platform === 'darwin') {
            const { exec } = require('child_process');
            exec(`osascript -e "set volume output volume ${volumeLevel}"`, (error) => {
                if (error) { console.error('Error setting volume (macOS):', error); return; }
                if (!event.sender.isDestroyed()) event.reply('volume:level', level); // Send back the original 0-1 level
            });
        } else {
            await vol.set(level);
            if (!event.sender.isDestroyed()) event.reply('volume:level', level); // Send back the original 0-1 level
        }
    } catch (error) { console.error('Error setting volume:', error); }
});

// WiFi List
ipcMain.handle('wifi:list', async () => {
    if (process.platform === 'win32') {
        return new Promise((resolve, reject) => {
            wifiList((err, wifiNetworks) => { // Renamed variable
                if (err) { console.error('Error getting WiFi list:', err); reject(err); }
                else { resolve(wifiNetworks); }
            });
        });
    }
    // For other platforms, you might want to implement or return empty/error
    console.warn('wifi:list is only implemented for win32');
    return [];
});

// Time
ipcMain.handle('time:get', () => {
    const now = new Date();
    return {
        day: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    };
});

// Browser: Load URL in the dedicated 'browserWindow'
ipcMain.on('browser:load-url', (event, urlToLoad) => {
    if (!browserWindow || browserWindow.isDestroyed()) { // Check if destroyed
        browserWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js') // If this browser needs IPC
            }
        });
        browserWindow.on('closed', () => { browserWindow = null; });
    }
    browserWindow.loadURL(urlToLoad);
    browserWindow.show();
    browserWindow.focus();
});

// Chat related IPC Handlers
ipcMain.handle('chat:get-messages', async (event, { contactId }) => {
    console.log(`Workspaceing messages for contactId: ${contactId}`);
    // Replace with actual database/storage logic
    return []; // Placeholder
});

ipcMain.handle('chat:get-contacts', async () => {
    console.log("Fetching contacts");
    // Replace with actual database/storage logic
    return [
        { id: "tenshi", name: "Tenshi", avatar: "/avatars/tenshi.png", status: "online" },
        { id: "bidya", name: "Bidya", avatar: "/avatars/bidya.png", status: "away", lastSeen: "online" },
    ]; // Placeholder
});

ipcMain.handle('chat:get-user-info', async () => {
    console.log("Fetching user info");
    // Replace with actual database/storage logic
    return {
        id: "user_123", // This will be the appId for the API
        name: "Current User",
        avatar: "/avatars/user.png", // Ensure these avatar paths are accessible by renderer
        status: "online"
    }; // Placeholder
});

ipcMain.on('chat:send-message', async (event, { contactId, message, authToken }) => {
    const MODEL_PREFIX = "shapesinc/";
    const API_BASE_URL = "https://api.shapes.inc/v1";
    const APP_ID = "f6263f80-2242-428d-acd4-10e1feec44ee"; // <-- Hardcoded App ID
    const fullModelName = `${MODEL_PREFIX}${contactId}`;

    const messages = [{ role: "user", content: message }];

    try {
        console.log("Sending to API:", {
            url: `${API_BASE_URL}/chat/completions`,
            headers: {
                "Content-Type": "application/json",
                "X-App-ID": APP_ID,
                "X-User-Auth": authToken,
            },
            body: {
                model: fullModelName,
                messages,
            }
        });
        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            {
                model: fullModelName,
                messages,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-App-ID": APP_ID, // <-- Use hardcoded App ID here
                    "X-User-Auth": authToken,
                },
            }
        );

        const data = response.data;

        if (data.choices && data.choices.length > 0) {
            const botReplyContent = data.choices[0].message.content;
            const botReplyMessage = {
                id: `msg-${Date.now()}-bot`,
                senderId: contactId,
                text: botReplyContent,
                timestamp: new Date(),
                isRead: false,
            };
            if (!event.sender.isDestroyed()) {
                event.sender.send('chat:message-received', botReplyMessage);
            }
        } else {
            const errorMsg = data.message || data.error?.message || "Failed to get response from chat API.";
            if (!event.sender.isDestroyed()) {
                event.sender.send('chat:message-received', {
                    id: `err-${Date.now()}-bot`,
                    senderId: contactId,
                    text: errorMsg,
                    timestamp: new Date(),
                    isRead: false,
                    error: true
                });
            }
        }
    } catch (err) {
        if (!event.sender.isDestroyed()) {
            event.sender.send('chat:message-received', {
                id: `err-${Date.now()}-bot`,
                senderId: contactId,
                text: `Network error: ${err.message || "Could not connect to the chat service."}`,
                timestamp: new Date(),
                isRead: false,
                error: true
            });
        }
    }
});

ipcMain.on('chat:add-contact', async (event, contact) => {
    console.log("Adding contact:", contact);
    // Replace with actual database/storage logic
    // For demo, just echo back, assuming success
    if (!event.sender.isDestroyed()) event.reply('chat:contact-updated', contact); // Send full contact back
});

ipcMain.on('chat:remove-contact', async (event, contactId) => {
    console.log("Removing contact:", contactId);
    // Replace with actual database/storage logic
    if (!event.sender.isDestroyed()) event.reply('chat:contact-updated', { id: contactId, removed: true });
});

ipcMain.on('chat:update-status', async (event, { status }) => {
    console.log("Updating user status:", status);
    // Replace with actual database/storage logic
    if (!event.sender.isDestroyed()) event.reply('chat:status-changed', { status });
});

// Auth exchange code handler
ipcMain.handle('auth:exchange-code', async (event, oneTimeCode) => {
    console.log("Exchanging code for auth token:", oneTimeCode);
    if (!oneTimeCode) {
        return { error: 'No one-time code provided.' };
    }
    try {
        const response = await axios.post('http://localhost:3001/auth/nonce', { code: oneTimeCode });
        if (response.data && response.data.auth_token) {
            console.log("Auth token received successfully.");
            return { auth_token: response.data.auth_token };
        } else {
            console.error("Failed to exchange code:", response.data);
            return { error: response.data?.message || 'Failed to exchange code for token.' };
        }
    } catch (error) {
        console.error('Error in auth:exchange-code:', error.response?.data || error.message);
        return { error: error.response?.data?.message || error.message || 'Unexpected error during token exchange.' };
    }
});

// Run Shapes CLI
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

// Ensure all paths to HTML files (dist/index.html, dist/terminal.html, etc.)
// and assets (assets/img/icon.png) are correct relative to your project structure.
// Ensure './src/api/server' path is correct.