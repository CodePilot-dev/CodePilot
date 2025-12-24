import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0f172a',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });
    return result.filePaths[0];
});

ipcMain.handle('read-package-json', (event, projectPath) => {
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const data = fs.readFileSync(pkgPath, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return { error: 'Failed to parse package.json' };
        }
    }
    return null;
});

ipcMain.handle('open-folder', (event, projectPath) => {
    shell.openPath(projectPath);
});

ipcMain.handle('open-terminal', (event, projectPath) => {
    spawn('cmd', ['/c', 'start', 'cmd', '/k', 'cd', '/d', projectPath]);
});

ipcMain.handle('run-npm-script', (event, { projectPath, script }) => {
    spawn('cmd', ['/c', 'start', 'cmd', '/k', 'npm', 'run', script], { cwd: projectPath });
});

ipcMain.handle('open-vscode', (event, { path, command }) => {
    exec(`${command} .`, { cwd: path }, (err) => {
        if (err) {
            console.error(`Failed to open ${command}:`, err);
        }
    });
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// Window controls
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});
ipcMain.handle('window-close', () => mainWindow.close());

// Storage
const configPath = path.join(app.getPath('userData'), 'config.json');

ipcMain.handle('get-config', () => {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return { spaces: [{ id: 'default', name: 'Général', projects: [] }] };
});

ipcMain.handle('save-config', (event, config) => {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
});
