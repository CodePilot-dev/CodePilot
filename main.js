import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Determine where to load the app from (allow hot-updates in userData)
function getAppDir() {
    const updatePath = path.join(app.getPath('userData'), 'update');
    // If update folder exists and has at least index.html, use it
    if (fs.existsSync(path.join(updatePath, 'index.html'))) {
        return updatePath;
    }
    return null;
}

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
            preload: path.join(__dirname, 'preload.js'), // Preload always stays from root for security
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        const updateDir = getAppDir();
        if (updateDir) {
            // Load the updated version from userData
            mainWindow.loadFile(path.join(updateDir, 'index.html'));
        } else {
            // Fallback to the original built version in dist/
            mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
        }
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

ipcMain.handle('get-app-version', () => {
    try {
        const appDir = getAppDir() || __dirname;
        const pkgPath = path.join(appDir, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version;
    } catch (e) {
        return '0.0.0';
    }
});

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

ipcMain.handle('save-file', async (event, { defaultPath, filters, content }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultPath || 'theme.thmx',
        filters: filters || [{ name: 'Theme File', extensions: ['thmx'] }]
    });

    if (result.filePath) {
        try {
            fs.writeFileSync(result.filePath, content, 'utf-8');
            return { success: true, path: result.filePath };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
    return { success: false, cancelled: true };
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
// Git Release Management
ipcMain.handle('create-release', async (event, { repoUrl, tag, title, body, tokens }) => {
    try {
        let owner, repo, projectPath;

        // Helper to clean URL
        const cleanUrl = repoUrl.replace(/^(https?:\/\/)?(www\.)?/, ''); // remove protocol/www

        if (cleanUrl.includes('github.com')) {
            // Updated extraction for GitHub to handle dots in repo names
            const parts = cleanUrl.split('github.com/')[1].split('/');
            owner = parts[0];
            repo = parts[1] ? parts[1].replace(/\.git$/, '') : null;

            if (!owner || !repo) throw new Error("URL GitHub invalide (github.com/owner/repo)");
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
                        else {
                            // Try to parse error message if JSON
                            let errMsg = `GitHub: ${res.statusCode}`;
                            try {
                                const json = JSON.parse(resBody);
                                if (json.message) errMsg += ` - ${json.message}`;
                            } catch (e) {
                                errMsg += ` - ${resBody.substring(0, 100)}`; // limit length
                            }
                            resolve({ success: false, error: errMsg });
                        }
                    });
                });
                req.on('error', e => resolve({ success: false, error: e.message }));
                req.write(data);
                req.end();
            });
        }

        else if (cleanUrl.includes('gitlab.com')) {
            // Updated extraction for GitLab to handle dots and subgroups
            // takes everything after gitlab.com/ until end
            const pathParts = cleanUrl.split('gitlab.com/');
            if (pathParts.length < 2) throw new Error("URL GitLab invalide");

            let fullPath = pathParts[1];

            // Clean up common deep-link patterns if user pasted a link to a file/tree
            fullPath = fullPath.split('/-/')[0];
            fullPath = fullPath.split('/tree/')[0];
            fullPath = fullPath.split('/blob/')[0];
            fullPath = fullPath.split('/src/')[0];

            fullPath = fullPath.replace(/\.git$/, '').replace(/\/$/, ''); // Remove .git and trailing slash
            projectPath = encodeURIComponent(fullPath);

            if (!tokens.gitlabToken) throw new Error("GitLab Token manquant (voir Réglages)");

            // Debug logging
            console.log('[GitLab Release] Original URL:', repoUrl);
            console.log('[GitLab Release] Extracted path:', fullPath);
            console.log('[GitLab Release] Encoded path:', projectPath);
            console.log('[GitLab Release] API endpoint:', `/api/v4/projects/${projectPath}/releases`);

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
                        else {
                            let errMsg = `GitLab: ${res.statusCode}`;
                            try {
                                const json = JSON.parse(resBody);
                                if (json.message) errMsg += ` - ${json.message}`;
                                if (json.error) errMsg += ` - ${json.error}`;
                            } catch (e) {
                                errMsg += ` - ${resBody.substring(0, 100)}`;
                            }
                            // Add hint for 404
                            if (res.statusCode === 404) {
                                errMsg += ` (Projet introuvable : ${fullPath})`;
                            }
                            resolve({ success: false, error: errMsg });
                        }
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

ipcMain.handle('check-updates', async () => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'raw.githubusercontent.com',
            path: `/CodePilot-dev/CodePilot/main/package.json?t=${Date.now()}`,
            method: 'GET',
            headers: {
                'User-Agent': 'CodePilot-App',
                'Cache-Control': 'no-cache'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const pkg = JSON.parse(body);
                        resolve({
                            success: true,
                            version: pkg.version,
                            url: 'https://github.com/CodePilot-dev/CodePilot'
                        });
                    } else {
                        resolve({ success: false, error: `GitHub error: ${res.statusCode}` });
                    }
                } catch (e) {
                    resolve({ success: false, error: 'Failed to parse remote package.json' });
                }
            });
        });

        req.on('error', e => resolve({ success: false, error: e.message }));
        req.end();
    });
});

ipcMain.handle('download-update', async () => {
    const files = ['main.js', 'renderer.js', 'style.css', 'index.html', 'preload.js', 'package.json'];
    const baseUrl = 'https://raw.githubusercontent.com/CodePilot-dev/CodePilot/main/';
    const updateDir = path.join(app.getPath('userData'), 'update');

    try {
        if (!fs.existsSync(updateDir)) {
            fs.mkdirSync(updateDir, { recursive: true });
        }

        for (const file of files) {
            const dest = path.join(updateDir, file);
            await new Promise((resolve, reject) => {
                const fileReq = https.get(baseUrl + file, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Failed to download ${file}: ${res.statusCode}`));
                        return;
                    }
                    const writer = fs.createWriteStream(dest);
                    res.pipe(writer);
                    writer.on('finish', () => {
                        writer.close();
                        resolve();
                    });
                    writer.on('error', reject);
                });
                fileReq.on('error', reject);
            });
        }

        // Success! Relaunch
        app.relaunch();
        app.exit(0);
        return { success: true };
    } catch (e) {
        console.error("Update failed:", e);
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
