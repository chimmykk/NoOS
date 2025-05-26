const electron = require('electron');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const { shell } = require('electron');
const { startServer } = require('./src/api/server');
const si = require('systeminformation');
const vol = require('vol');
const wifiList = require('wifi-list-windows');
const axios = require('axios');

// Start the auth server
startServer();

const {app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let mainWindow;
let terminalWindow;
let shellProcess;
let synthWindow;
let minesweeperWindow;
let ipodWindow;
let videosWindow;
let photosWindow;
let shapeappsWindow;
let browserWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        frame: false,
        icon: path.join(__dirname, './assets/img/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.maximize();
    mainWindow.loadFile('./dist/index.html');

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

    // Create a shell process
    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';
    shellProcess = spawn(shell, [], {
        env: process.env,
        stdio: 'pipe'
    });

    // Handle shell output
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

    shellProcess.on('exit', () => {
        console.log('Shell process exited.');
        if (terminalWindow && !terminalWindow.isDestroyed()) {
            terminalWindow.webContents.send('terminal-output', '\nShell process exited.\n');
        }
        shellProcess = null; // Clear reference on exit
    });

    // Handle terminal window close
    terminalWindow.on('closed', () => {
        console.log('Terminal window closed.');
        if (shellProcess) {
            shellProcess.kill(); // Kill the shell process when window is closed
            shellProcess = null;
        }
        terminalWindow = null; // Clear reference on close
    });

    // Load terminal HTML
    terminalWindow.loadFile('./dist/terminal.html');

    // Optional: Open DevTools for terminal window
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

    synthWindow.loadFile('./dist/synth.html');

    // Handle synth window close
    synthWindow.on('closed', () => {
        console.log('Synth window closed.');
        synthWindow = null; // Clear reference on close
    });

    // Optional: Open DevTools for synth window
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

    minesweeperWindow.loadFile('./dist/minesweeper.html');

    // Handle Minesweeper window close
    minesweeperWindow.on('closed', () => {
        console.log('Minesweeper window closed.');
        minesweeperWindow = null; // Clear reference on close
    });

    // Optional: Open DevTools for Minesweeper window
    // minesweeperWindow.webContents.openDevTools();
}

function createShapeAppsWindow() {
    if (shapeappsWindow) {
        shapeappsWindow.show();
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
    shapeappsWindow.loadFile('dist/shapeapps.html');
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
    ipodWindow.loadFile('dist/ipods.html');
    ipodWindow.once('ready-to-show', () => {
        ipodWindow.show();
    });
    ipodWindow.on('closed', () => {
        ipodWindow = null;
    });
}

function createChatWindow() {
    const chatWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
            devTools: process.env.NODE_ENV === 'development'
        }
    });

    // Load the chat window HTML file
    chatWindow.loadFile('src/components/ChatWindow.html');

    // Show window when ready
    chatWindow.once('ready-to-show', () => {
        chatWindow.show();
    });

    // Handle window close
    chatWindow.on('closed', () => {
        chatWindow = null;
    });

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        chatWindow.webContents.openDevTools();
    }

    return chatWindow;
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

// IPC handler for opening embedded terminal
ipcMain.on('open:terminal', createTerminalWindow);

// IPC handler for terminal input (from renderer to main)
ipcMain.on('terminal-input', (event, input) => {
    console.log('Main process received terminal input:', input);
    if (shellProcess && shellProcess.stdin.writable) {
        shellProcess.stdin.write(input);
    }
});

// IPC handlers for terminal window controls
ipcMain.on('terminal:minimize', () => {
    if (terminalWindow) {
        terminalWindow.minimize();
    }
});

ipcMain.on('terminal:maximize', () => {
    if (terminalWindow) {
        if (terminalWindow.isMaximized()) {
            terminalWindow.unmaximize();
        } else {
            terminalWindow.maximize();
        }
    }
});

ipcMain.on('terminal:close', () => {
    if (terminalWindow) {
        terminalWindow.close();
    }
});

// IPC handler for opening Chrome (modified to accept URL)
ipcMain.on('open:browser', (event, url) => {
    console.log('Main process received open:browser', url ? `with URL: ${url}` : '');
    const browserWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const targetUrl = url && url !== '#' ? url : 'https://www.google.com';
    browserWindow.loadURL(targetUrl);
});

// IPC handler for opening Synth
ipcMain.on('open:synth', () => {
    console.log('Main process received open:synth IPC message.');
    createSynthWindow();
});

// IPC handler for opening Minesweeper
ipcMain.on('open:minesweeper', () => {
    console.log('Main process received open:minesweeper IPC message.');
    createMinesweeperWindow();
});

// Handle open:shapeapps IPC message
ipcMain.on('open:shapeapps', () => {
    console.log('Received open:shapeapps');
    createShapeAppsWindow();
});

// Handle open:ipod IPC message
ipcMain.on('open:ipod', () => {
    console.log('Received open:ipod');
    createIpodWindow();
});

// Handle open:chat IPC message
ipcMain.on('open:chat', () => {
    console.log('Received open:chat');
    createChatWindow();
});

// Handle open-external-url IPC message
ipcMain.on('open-external-url', (event, url) => {
    console.log('Received request to open external url:', url);
    shell.openExternal(url);
});

// IPC handlers for ShapeApps window controls
ipcMain.on('shapeapps:minimize', () => {
    if (shapeappsWindow) {
        shapeappsWindow.minimize();
    }
});

ipcMain.on('shapeapps:maximize', () => {
    if (shapeappsWindow) {
        if (shapeappsWindow.isMaximized()) {
            shapeappsWindow.unmaximize();
        } else {
            shapeappsWindow.maximize();
        }
    }
});

ipcMain.on('shapeapps:close', () => {
    if (shapeappsWindow) {
        shapeappsWindow.close();
    }
});

// IPC handlers for iPod window controls
ipcMain.on('ipod:minimize', () => {
    if (ipodWindow) {
        ipodWindow.minimize();
    }
});

ipcMain.on('ipod:maximize', () => {
    if (ipodWindow) {
        if (ipodWindow.isMaximized()) {
            ipodWindow.unmaximize();
        } else {
            ipodWindow.maximize();
        }
    }
});

ipcMain.on('ipod:close', () => {
    if (ipodWindow) {
        ipodWindow.close();
    }
});

// IPC handler for closing the iPod window
ipcMain.on('close-ipod-window', () => {
    if (ipodWindow) {
        ipodWindow.close();
    }
});

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    }
];

// Add developer tools menu item if not in production
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}

// Add macOS specific menu
if (process.platform === 'darwin') {
    mainMenuTemplate.unshift({
        label: 'NoOS',
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    });
}

// IPC handlers for synth window controls
ipcMain.on('synth:minimize', () => {
    if (synthWindow) {
        synthWindow.minimize();
    }
});

ipcMain.on('synth:maximize', () => {
    if (synthWindow) {
        if (synthWindow.isMaximized()) {
            synthWindow.unmaximize();
        } else {
            synthWindow.maximize();
        }
    }
});

ipcMain.on('synth:close', () => {
    if (synthWindow) {
        synthWindow.close();
    }
});

// IPC handlers for Minesweeper window controls
ipcMain.on('minesweeper:minimize', () => {
    if (minesweeperWindow) {
        minesweeperWindow.minimize();
    }
});

ipcMain.on('minesweeper:maximize', () => {
    if (minesweeperWindow) {
        if (minesweeperWindow.isMaximized()) {
            minesweeperWindow.unmaximize();
        } else {
            minesweeperWindow.maximize();
        }
    }
});

ipcMain.on('minesweeper:close', () => {
    if (minesweeperWindow) {
        minesweeperWindow.close();
    }
});



// Handle volume control
ipcMain.handle('volume:get', async () => {
    try {
        if (process.platform === 'darwin') {
            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                exec('osascript -e "output volume of (get volume settings)"', (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error getting volume:', error);
                        reject(error);
                        return;
                    }
                    const volume = parseInt(stdout.trim(), 10);
                    resolve(volume / 100); // Convert to 0-1 range
                });
            });
        } else {
            return await vol.get();
        }
    } catch (error) {
        console.error('Error getting volume:', error);
        return 0;
    }
});

ipcMain.on('volume:set', async (event, level) => {
    try {
        if (process.platform === 'darwin') {
            const { exec } = require('child_process');
            const volumeLevel = Math.round(level * 100);
            exec(`osascript -e "set volume output volume ${volumeLevel}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error setting volume:', error);
                    return;
                }
                event.reply('volume:level', volumeLevel);
            });
        } else {
            await vol.set(level);
            event.reply('volume:level', Math.round(level * 100));
        }
    } catch (error) {
        console.error('Error setting volume:', error);
    }
});

// Handle WiFi list
ipcMain.handle('wifi:list', async () => {
    if (process.platform === 'win32') {
        return new Promise((resolve, reject) => {
            wifiList((err, wifi) => {
                if (err) {
                    console.error('Error getting WiFi list:', err);
                    reject(err);
                } else {
                    resolve(wifi);
                }
            });
        });
    }
    return [];
});

// Handle time
ipcMain.handle('time:get', () => {
    const now = new Date();
    return {
        day: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    };
});

// Handle browser:load-url
ipcMain.on('browser:load-url', (event, url) => {
    if (!browserWindow) {
        browserWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        browserWindow.on('closed', () => {
            browserWindow = null;
        });
    }

    browserWindow.loadURL(url);
    browserWindow.show();
});

// Handle chat-related IPC messages
ipcMain.handle('chat:get-messages', async (event, { contactId }) => {
    // In a real app, this would fetch messages from a database
    return [];
});

ipcMain.handle('chat:get-contacts', async (event) => {
    // In a real app, this would fetch contacts from a database
    return [
        { id: "tenshi", name: "Tenshi", avatar: "/avatars/tenshi.png", status: "online" },
        { id: "bidya", name: "Bidya", avatar: "/avatars/bidya.png", status: "away", lastSeen: "online" },
    ];
});

ipcMain.handle('chat:get-user-info', async (event) => {
    // In a real app, this would fetch user info from a database
    return {
        id: "user_123",
        name: "Current User",
        avatar: "/avatars/user.png",
        status: "online"
    };
});

ipcMain.on('chat:send-message', async (event, { contactId, message }) => {
    try {
        // In a real app, this would send the message to a server
        // For now, we'll simulate a response
        const response = {
            id: `msg_${Date.now()}`,
            senderId: contactId,
            text: `Echo: ${message}`,
            timestamp: new Date(),
            isRead: false
        };
        
        // Send the response back to the renderer
        event.reply('chat:message-received', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
});

ipcMain.on('chat:add-contact', async (event, contact) => {
    try {
        // In a real app, this would add the contact to a database
        event.reply('chat:contact-updated', contact);
    } catch (error) {
        console.error('Error adding contact:', error);
    }
});

ipcMain.on('chat:remove-contact', async (event, contactId) => {
    try {
        // In a real app, this would remove the contact from a database
        event.reply('chat:contact-updated', { id: contactId, removed: true });
    } catch (error) {
        console.error('Error removing contact:', error);
    }
});

ipcMain.on('chat:update-status', async (event, { status }) => {
    try {
        // In a real app, this would update the user's status in a database
        event.reply('chat:status-changed', { status });
    } catch (error) {
        console.error('Error updating status:', error);
    }
});

// Auth exchange code handler
ipcMain.handle('auth:exchange-code', async (event, oneTimeCode) => {
    try {
        // app_id is hardcoded on the server, so just send code
        const response = await axios.post('http://localhost:3001/auth/nonce', { code: oneTimeCode });
        if (response.data && response.data.auth_token) {
            return { auth_token: response.data.auth_token };
        } else {
            return { error: response.data.message || 'Failed to exchange code for token.' };
        }
    } catch (error) {
        console.error('Error in auth:exchange-code:', error);
        return { error: error.message || 'Unexpected error' };
    }
});