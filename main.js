import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
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

ipcMain.handle('select-file', async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || []
    });
    return result.filePaths[0];
});

ipcMain.handle('read-file', (event, filePath) => {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
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
        if (err) console.error(`Failed to open ${command}:`, err);
    });
});

ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url);
});

// Git Release Management
ipcMain.handle('create-release', async (event, { repoUrl, tag, title, body, tokens }) => {
    try {
        if (repoUrl.includes('github.com')) {
            const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
            if (!match) throw new Error("URL GitHub invalide (github.com/owner/repo)");
            const [_, owner, repo] = match;
            if (!tokens.githubToken) throw new Error("GitHub Token manquant (voir Réglages)");

            return new Promise((resolve) => {
                const data = JSON.stringify({ tag_name: tag, name: title, body: body || '' });
                const options = {
                    hostname: 'api.github.com',
                    path: `/repos/${owner}/${repo}/releases`,
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${tokens.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'CodePilot-App',
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
                };

                const req = https.request(options, (res) => {
                    let resBody = '';
                    res.on('data', d => resBody += d);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ success: true });
                        else resolve({ success: false, error: `GitHub: ${res.statusCode}` });
                    });
                });
                req.on('error', e => resolve({ success: false, error: e.message }));
                req.write(data);
                req.end();
            });
        }

        else if (repoUrl.includes('gitlab.com')) {
            const match = repoUrl.match(/gitlab\.com\/([^.]+)/);
            if (!match) throw new Error("URL GitLab invalide");
            const projectPath = encodeURIComponent(match[1].replace(/\.git$/, ''));
            if (!tokens.gitlabToken) throw new Error("GitLab Token manquant (voir Réglages)");

            return new Promise((resolve) => {
                const data = JSON.stringify({ name: title, tag_name: tag, description: body || '' });
                const options = {
                    hostname: 'gitlab.com',
                    path: `/api/v4/projects/${projectPath}/releases`,
                    method: 'POST',
                    headers: {
                        'PRIVATE-TOKEN': tokens.gitlabToken,
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
                };

                const req = https.request(options, (res) => {
                    let resBody = '';
                    res.on('data', d => resBody += d);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ success: true });
                        else resolve({ success: false, error: `GitLab: ${res.statusCode}` });
                    });
                });
                req.on('error', e => resolve({ success: false, error: e.message }));
                req.write(data);
                req.end();
            });
        }
        throw new Error("Plateforme Git non supportée.");
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// Git GUI Handlers
ipcMain.handle('check-git-repo', (event, projectPath) => {
    return fs.existsSync(path.join(projectPath, '.git'));
});

ipcMain.handle('git-status', async (event, projectPath) => {
    return new Promise((resolve) => {
        exec('git status --porcelain', { cwd: projectPath }, (err, stdout) => {
            if (err) return resolve({ success: false, error: err.message });
            const files = stdout.split('\n').filter(line => line.trim()).map(line => {
                const status = line.slice(0, 2).trim();
                const file = line.slice(3);
                return { status, file };
            });
            resolve({ success: true, files });
        });
    });
});

ipcMain.handle('git-add', async (event, { projectPath, files }) => {
    const filesToStage = files.length === 0 ? '.' : files.join(' ');
    return new Promise((resolve) => {
        exec(`git add ${filesToStage}`, { cwd: projectPath }, (err) => {
            if (err) resolve({ success: false, error: err.message });
            else resolve({ success: true });
        });
    });
});

ipcMain.handle('git-commit', async (event, { projectPath, message }) => {
    return new Promise((resolve) => {
        exec(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: projectPath }, (err, stdout) => {
            if (err) resolve({ success: false, error: err.message });
            else resolve({ success: true, output: stdout });
        });
    });
});

ipcMain.handle('git-push', async (event, projectPath) => {
    return new Promise((resolve) => {
        exec('git push', { cwd: projectPath }, (err, stdout) => {
            if (err) resolve({ success: false, error: err.message });
            else resolve({ success: true, output: stdout });
        });
    });
});

ipcMain.handle('git-pull', async (event, projectPath) => {
    return new Promise((resolve) => {
        exec('git pull', { cwd: projectPath }, (err, stdout) => {
            if (err) resolve({ success: false, error: err.message });
            else resolve({ success: true, output: stdout });
        });
    });
});

ipcMain.handle('git-log', async (event, projectPath) => {
    return new Promise((resolve) => {
        exec('git log -n 10 --pretty=format:"%h|%an|%ar|%s"', { cwd: projectPath }, (err, stdout) => {
            if (err) resolve({ success: false, error: err.message });
            else {
                const logs = stdout.split('\n').filter(l => l.trim()).map(line => {
                    const [hash, author, date, subject] = line.split('|');
                    return { hash, author, date, subject };
                });
                resolve({ success: true, logs });
            }
        });
    });
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
    return { spaces: [{ id: 'default', name: 'Général', projects: [] }], settings: { githubToken: '', gitlabToken: '' } };
});

ipcMain.handle('save-config', (event, config) => {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
});
