const { app, BrowserWindow } = require('electron');
const path = require('node:path');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow() {
    const isDev = !app.isPackaged; // Detectar si es entorno de desarrollo
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        //icon: path.join(__dirname, 'public/favicon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Mejora la seguridad
            enableRemoteModule: false, // Deshabilitar módulos remotos por seguridad
            nodeIntegration: false, // Desactiva integración con Node.js
        },
    });

    if (isDev) {
        // En desarrollo, cargar la URL del servidor de Vite
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools(); // Abrir herramientas de desarrollo
    } else {
        // En producción, cargar el archivo index.html de la carpeta dist
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    if (!isDev) {
        import('@vercel/analytics').then(({ inject }) => inject());
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
