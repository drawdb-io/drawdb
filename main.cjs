const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow() {

    const isDev = !app.isPackaged;
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'public', 'icon.ico') ,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    win.maximize();

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools(); 
    } else {
        win.loadURL(`file://${path.join(__dirname, 'dist/index.html')}`);
        Menu.setApplicationMenu(null);
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
