const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readPackageJson: (path) => ipcRenderer.invoke('read-package-json', path),
    openFolder: (path) => ipcRenderer.invoke('open-folder', path),
    openTerminal: (path) => ipcRenderer.invoke('open-terminal', path),
    runNpmScript: (data) => ipcRenderer.invoke('run-npm-script', data),
    openVSCode: (path) => ipcRenderer.invoke('open-vscode', path),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    createRelease: (data) => ipcRenderer.invoke('create-release', data),
});
