let config = {
    spaces: [{ id: 'default', name: 'Général', projects: [] }],
    activeSpaceId: 'default',
    settings: {
        githubToken: '',
        gitlabToken: '',
        theme: null,
        globalTags: [
            { id: '1', name: 'En cours', color: '#38bdf8' },
            { id: '2', name: 'Terminé', color: '#10b981' }
        ],
        personalization: {
            appName: 'CODEPILOT',
            accentColor: '#8b5cf6',
            fontFamily: "'Outfit', sans-serif",
            glassBlur: 10,
            borderRadius: 12,
            cardSize: 280,
            animationLevel: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            sidebarOpacity: 80,
            bgGlow: true,
            compactMode: false
        }
    }
};
let editingProjectId = null;
let currentDetailProject = null;
let selectedProjectTags = []; // Temporary storage for modal
const APP_VERSION = '0.0.9';

function truncatePath(path) {
    if (!path) return '';
    const parts = path.split(/[\\/]/);
    if (parts.length <= 3) return path;
    return parts[0] + '/.../' + parts.slice(-2).join('/');
}

// DOM Elements
const spacesList = document.getElementById('spaces-list');
const projectsGrid = document.getElementById('projects-grid');
const currentSpaceName = document.getElementById('current-space-name');
const projectsCount = document.getElementById('projects-count');
const emptyState = document.getElementById('empty-state');
const projectSearch = document.getElementById('project-search');

// Modals
const spaceModal = document.getElementById('space-modal');
const projectModal = document.getElementById('project-modal');
const detailModal = document.getElementById('project-detail-modal');
const updateModal = document.getElementById('update-modal');
const releaseModal = document.getElementById('release-modal');
const settingsModal = document.getElementById('settings-modal');
const gitModal = document.getElementById('git-modal');

// Buttons
const addSpaceBtn = document.getElementById('add-space-btn');
const addProjectBtn = document.getElementById('add-project-btn');
const addProjectUpdateBtn = document.getElementById('add-project-update-btn');
const showSettingsBtn = document.getElementById('show-settings-btn');
const createReleaseBtn = document.getElementById('detail-create-release');

// Detail Elements
const detailName = document.getElementById('detail-name');
const detailPath = document.getElementById('detail-path');
const detailBadges = document.getElementById('detail-badges');
const detailNotes = document.getElementById('detail-notes');
const detailScriptsList = document.getElementById('detail-scripts-list');
const detailUpdatesList = document.getElementById('detail-updates-list');
const detailOpenEditorText = document.getElementById('detail-open-editor-text');


// Initialize
async function init() {
    const savedConfig = await window.electronAPI.getConfig();
    if (savedConfig) {
        config = savedConfig;
        if (!config.activeSpaceId) config.activeSpaceId = config.spaces[0].id;
        if (!config.settings) config.settings = {};
        if (!config.settings.globalTags) {
            config.settings.globalTags = [
                { id: '1', name: 'En cours', color: '#38bdf8' },
                { id: '2', name: 'Terminé', color: '#10b981' }
            ];
        }
    }
    renderSpaces();
    renderProjects();
    if (config.settings.theme) applyTheme(config.settings.theme);
    applyPersonalization();
    setupEventListeners();
}

function applyPersonalization() {
    const p = config.settings.personalization || {};
    const root = document.documentElement;

    // Apply values to CSS variables
    if (p.accentColor) root.style.setProperty('--primary', p.accentColor);
    if (p.fontFamily) root.style.setProperty('--font-main', p.fontFamily);
    if (p.glassBlur !== undefined) root.style.setProperty('--glass-blur', `${p.glassBlur}px`);
    if (p.borderRadius !== undefined) root.style.setProperty('--radius', `${p.borderRadius}px`);
    if (p.cardSize !== undefined) root.style.setProperty('--card-width', `${p.cardSize}px`);
    if (p.animationLevel) root.style.setProperty('--anim-speed', p.animationLevel);
    if (p.sidebarOpacity !== undefined) root.style.setProperty('--sidebar-opacity', p.sidebarOpacity / 100);

    // Apply classes to body
    document.body.classList.toggle('compact', !!p.compactMode);
    document.body.classList.toggle('no-glow', !p.bgGlow);

    // Apply App Name
    const logo = document.querySelector('.logo');
    if (logo) logo.textContent = p.appName || 'CODEPILOT';
    document.title = p.appName || 'CodePilot';
}

function applyTheme(theme) {
    if (!theme || !theme.colors) return;
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
    });
    document.getElementById('current-theme-name').textContent = theme.name || 'Thème personnalisé';
}

// Rendering
function renderSpaces() {
    spacesList.innerHTML = '';

    const allItem = document.createElement('div');
    allItem.className = `nav-item ${config.activeSpaceId === 'all' ? 'active' : ''}`;
    allItem.innerHTML = `<span>🚀 Tous les projets</span>`;
    allItem.onclick = () => {
        config.activeSpaceId = 'all';
        renderSpaces();
        renderProjects();
        save();
    };
    spacesList.appendChild(allItem);

    config.spaces.forEach(space => {
        const item = document.createElement('div');
        item.className = `nav-item ${space.id === config.activeSpaceId ? 'active' : ''}`;
        item.innerHTML = `
            <span>${space.name}</span>
            ${space.id !== 'default' ? `<span class="delete-space" data-id="${space.id}">✕</span>` : ''}
        `;
        item.onclick = (e) => {
            if (e.target.classList.contains('delete-space')) {
                deleteSpace(space.id);
            } else {
                config.activeSpaceId = space.id;
                renderSpaces();
                renderProjects();
                save();
            }
        };
        spacesList.appendChild(item);
    });
}

async function renderProjects() {
    let projects = [];
    if (config.activeSpaceId === 'all') {
        currentSpaceName.textContent = "Tous les projets";
        projects = config.spaces.flatMap(s => s.projects);
    } else {
        const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);
        if (!activeSpace) {
            currentSpaceName.textContent = "Tous les projets";
            projects = config.spaces.flatMap(s => s.projects);
        } else {
            currentSpaceName.textContent = activeSpace.name;
            projects = activeSpace.projects;
        }
    }

    const searchTerm = projectSearch.value.toLowerCase();
    if (searchTerm) {
        projects = projects.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.path.toLowerCase().includes(searchTerm) ||
            (p.notes && p.notes.toLowerCase().includes(searchTerm))
        );
    }

    projects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    projectsCount.textContent = `${projects.length} projet${projects.length > 1 ? 's' : ''}`;
    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        for (const project of projects) {
            const card = await createProjectCard(project);
            projectsGrid.appendChild(card);
        }
    }
}

async function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = `project-card ${project.pinned ? 'pinned' : ''}`;

    const pkg = await window.electronAPI.readPackageJson(project.path);
    const framework = detectFramework(pkg);

    card.innerHTML = `
        <div class="project-card-header">
            <button class="card-action-btn pin-project ${project.pinned ? 'active' : ''}" title="${project.pinned ? 'Désépingler' : 'Épingler'}">
                ${project.pinned ? '★' : '☆'}
            </button>
            <button class="card-action-btn edit-project" title="Modifier le projet">✎</button>
            <button class="card-action-btn delete-project" title="Supprimer le projet">✕</button>
        </div>
        <div class="project-info">
            <div class="project-title-row">
                <h3>${project.name}</h3>
                ${framework ? `<span class="fw-badge ${framework.id}">${framework.name}</span>` : ''}
            </div>
            <p>${truncatePath(project.path)}</p>
            <div class="project-tags">
                ${(project.tags || []).map(tagId => {
        const tag = config.settings.globalTags.find(t => t.id === tagId);
        if (!tag) return '';
        return `<span class="tag" style="--tag-color: ${tag.color}; border-color: ${tag.color}44; background: ${tag.color}11;">${tag.name}</span>`;
    }).join('')}
            </div>
        </div>
    `;

    card.onclick = (e) => {
        if (!e.target.closest('.project-card-header')) openDetailModal(project);
    };

    card.querySelector('.delete-project').onclick = (e) => {
        e.stopPropagation();
        deleteProject(project.id);
    };

    card.querySelector('.edit-project').onclick = (e) => {
        e.stopPropagation();
        openEditModal(project);
    };

    card.querySelector('.pin-project').onclick = (e) => {
        e.stopPropagation();
        togglePin(project.id);
    };

    return card;
}

// Detail View Logic
async function openDetailModal(project) {
    currentDetailProject = project;
    detailName.textContent = project.name;
    detailPath.textContent = project.path;
    detailNotes.textContent = project.notes || 'Aucune note pour ce projet.';

    // Update editor button text
    const editorCmd = project.editor || 'code';
    let editorName = 'VSCode';
    if (editorCmd !== 'code') {
        editorName = editorCmd.charAt(0).toUpperCase() + editorCmd.slice(1);
    }
    detailOpenEditorText.textContent = `Ouvrir ${editorName}`;

    // Render tags in detail
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'project-tags';
    tagsContainer.style.marginBottom = '20px';
    tagsContainer.innerHTML = (project.tags || []).map(tagId => {
        const tag = config.settings.globalTags.find(t => t.id === tagId);
        if (!tag) return '';
        return `<span class="tag" style="--tag-color: ${tag.color}; border-color: ${tag.color}44; background: ${tag.color}11;">${tag.name}</span>`;
    }).join('');

    // Clear old tags if re-opening (though modal is hidden)
    const existingTags = detailPath.parentElement.querySelector('.project-tags');
    if (existingTags) existingTags.remove();
    detailPath.after(tagsContainer);


    const pkg = await window.electronAPI.readPackageJson(project.path);
    const framework = detectFramework(pkg);
    detailBadges.innerHTML = framework ? `<span class="fw-badge ${framework.id}">${framework.name}</span>` : '';

    const scripts = pkg && pkg.scripts ? Object.keys(pkg.scripts) : [];
    detailScriptsList.innerHTML = '';
    if (scripts.length > 0) {
        document.getElementById('detail-scripts-container').classList.remove('hidden');
        scripts.forEach(script => {
            const tag = document.createElement('div');
            tag.className = 'detail-script-tag';
            tag.textContent = `npm run ${script}`;
            tag.onclick = () => window.electronAPI.runNpmScript({ projectPath: project.path, script });
            detailScriptsList.appendChild(tag);
        });
    } else {
        document.getElementById('detail-scripts-container').classList.add('hidden');
    }

    renderProjectUpdates();

    const gitBtn = document.getElementById('detail-open-git');
    const gitGuiBtn = document.getElementById('detail-open-git-gui');

    if (project.repoUrl) {
        gitBtn.classList.remove('hidden');
        gitBtn.onclick = () => window.electronAPI.openExternal(project.repoUrl);
        createReleaseBtn.classList.remove('hidden');
    } else {
        gitBtn.classList.add('hidden');
        createReleaseBtn.classList.add('hidden');
    }

    // Check for local .git
    const hasGit = await window.electronAPI.checkGitRepo(project.path);
    if (hasGit) {
        gitGuiBtn.classList.remove('hidden');
    } else {
        gitGuiBtn.classList.add('hidden');
    }

    detailModal.classList.remove('hidden');
}

async function openGitModal(project) {
    document.getElementById('git-project-path').textContent = project.path;
    gitModal.classList.remove('hidden');
    await refreshGitStatus();
}

async function refreshGitStatus() {
    const projectPath = currentDetailProject.path;
    const { success, files, error } = await window.electronAPI.gitStatus(projectPath);
    const list = document.getElementById('git-changes-list');
    list.innerHTML = '';

    if (!success) {
        list.innerHTML = `<p class="error-text">Erreur: ${error}</p>`;
        return;
    }

    if (files.length === 0) {
        list.innerHTML = '<p class="text-muted" style="font-size: 0.8rem; padding: 10px;">Aucun changement détecté.</p>';
    } else {
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'git-change-item';
            const statusClass = file.status === '??' ? 'U' : file.status;
            item.innerHTML = `
                <span class="git-status-icon ${statusClass}">${statusClass}</span>
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${file.file}</span>
            `;
            list.appendChild(item);
        });
    }

    await refreshGitLog();
}

async function refreshGitLog() {
    const projectPath = currentDetailProject.path;
    const { success, logs, error } = await window.electronAPI.gitLog(projectPath);
    const list = document.getElementById('git-log-list');
    list.innerHTML = '';

    if (!success) {
        list.innerHTML = `<p class="error-text">Erreur: ${error}</p>`;
        return;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'git-log-item';
        item.innerHTML = `
            <div class="git-log-item-header">
                <span class="git-log-hash">${log.hash}</span>
                <span>${log.date}</span>
            </div>
            <div class="git-log-subject">${log.subject}</div>
            <div class="git-log-item-header" style="margin-top: 5px; opacity: 0.5;">
                <span>${log.author}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderProjectUpdates() {
    detailUpdatesList.innerHTML = '';
    const updates = currentDetailProject.updates || [];

    if (updates.length === 0) {
        detailUpdatesList.innerHTML = '<p class="text-muted" style="font-size: 0.8rem;">Aucune mise à jour programmée.</p>';
        return;
    }

    updates.sort((a, b) => b.id - a.id).forEach(update => {
        const item = document.createElement('div');
        const isFinished = update.status === 'finished';
        item.className = `update-item-mini ${isFinished ? 'finished' : ''}`;

        const dateStr = update.scheduledDate ? new Date(update.scheduledDate).toLocaleString() : new Date(update.id).toLocaleDateString();

        item.innerHTML = `
            <div class="update-header">
                <h5>${update.title}</h5>
                <span class="update-status-tag ${isFinished ? 'finished' : ''}">${isFinished ? 'Terminé' : 'À venir'}</span>
            </div>
            <p>${update.description}</p>
            <span class="update-date">${isFinished ? 'Terminé le' : 'Prévu le'} ${dateStr}</span>
        `;

        item.querySelector('.update-status-tag').onclick = (e) => {
            e.stopPropagation();
            update.status = update.status === 'finished' ? 'pending' : 'finished';
            save();
            renderProjectUpdates();
        };

        detailUpdatesList.appendChild(item);
    });
}

function showToast(title, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">🚀</div>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Actions
function save() {
    window.electronAPI.saveConfig(config);
}

function deleteSpace(id) {
    if (confirm('Supprimer cet espace et tous ses projets ?')) {
        config.spaces = config.spaces.filter(s => s.id !== id);
        if (config.activeSpaceId === id) config.activeSpaceId = 'default';
        renderSpaces();
        renderProjects();
        save();
    }
}

function deleteProject(id) {
    if (confirm('Supprimer ce projet ?')) {
        config.spaces.forEach(space => {
            space.projects = space.projects.filter(p => p.id !== id);
        });
        renderProjects();
        save();
    }
}

function togglePin(id) {
    config.spaces.forEach(space => {
        const project = space.projects.find(p => p.id === id);
        if (project) project.pinned = !project.pinned;
    });
    renderProjects();
    save();
}

function detectFramework(pkg) {
    if (!pkg) return null;
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['next']) return { id: 'next', name: 'Next.js' };
    if (allDeps['react']) return { id: 'react', name: 'React' };
    if (allDeps['vue']) return { id: 'vue', name: 'Vue' };
    if (allDeps['svelte']) return { id: 'svelte', name: 'Svelte' };
    if (allDeps['electron']) return { id: 'electron', name: 'Electron' };
    if (allDeps['vite']) return { id: 'vite', name: 'Vite' };
    if (allDeps['typescript']) return { id: 'ts', name: 'TS' };
    return null;
}


// Tag Management Functions
function renderTagSelector() {
    const container = document.getElementById('project-tag-selector');
    container.innerHTML = '';
    config.settings.globalTags.forEach(tag => {
        const chip = document.createElement('div');
        const isSelected = selectedProjectTags.includes(tag.id);
        chip.className = `tag-chip ${isSelected ? 'selected' : ''}`;
        chip.style.setProperty('--tag-color', tag.color);
        chip.textContent = tag.name;
        chip.onclick = () => {
            if (selectedProjectTags.includes(tag.id)) {
                selectedProjectTags = selectedProjectTags.filter(id => id !== tag.id);
            } else {
                selectedProjectTags.push(tag.id);
            }
            renderTagSelector();
        };
        container.appendChild(chip);
    });
}

function renderGlobalTagsManager() {
    const container = document.getElementById('manage-tags-list');
    container.innerHTML = '';
    config.settings.globalTags.forEach(tag => {
        const item = document.createElement('div');
        item.className = 'tag-manager-item';
        item.innerHTML = `
            <input type="text" value="${tag.name}" data-id="${tag.id}" class="tag-name-edit">
            <input type="color" value="${tag.color}" data-id="${tag.id}" class="tag-color-edit">
            <button class="icon-btn-small delete-global-tag" data-id="${tag.id}">✕</button>
        `;
        container.appendChild(item);
    });

    // Listeners for edits
    container.querySelectorAll('.tag-name-edit').forEach(input => {
        input.onblur = (e) => {
            const tag = config.settings.globalTags.find(t => t.id === e.target.dataset.id);
            if (tag) {
                tag.name = e.target.value;
                save();
            }
        };
    });
    container.querySelectorAll('.tag-color-edit').forEach(input => {
        input.onchange = (e) => {
            const tag = config.settings.globalTags.find(t => t.id === e.target.dataset.id);
            if (tag) {
                tag.color = e.target.value;
                save();
            }
        };
    });
    container.querySelectorAll('.delete-global-tag').forEach(btn => {
        btn.onclick = (e) => {
            config.settings.globalTags = config.settings.globalTags.filter(t => t.id !== e.target.dataset.id);
            renderGlobalTagsManager();
            save();
        };
    });
}

function openEditModal(project) {
    editingProjectId = project.id;
    selectedProjectTags = [...(project.tags || [])];
    document.getElementById('project-modal-title').textContent = 'Modifier le Projet';
    document.getElementById('project-name-input').value = project.name;
    document.getElementById('project-path-input').value = project.path;
    document.getElementById('project-repo-input').value = project.repoUrl || '';
    document.getElementById('project-editor-input').value = project.editor || 'code';
    document.getElementById('project-notes-input').value = project.notes || '';
    document.getElementById('confirm-project').textContent = 'Enregistrer';
    renderTagSelector();
    projectModal.classList.remove('hidden');
}

// Event Listeners
function setupEventListeners() {
    projectSearch.oninput = () => renderProjects();

    // Personalization Real-time Preview in Settings
    const updatePreview = () => {
        const p = {
            appName: document.getElementById('setting-app-name').value || 'CODEPILOT',
            accentColor: document.getElementById('setting-accent-color').value,
            fontFamily: document.getElementById('setting-font-family').value,
            glassBlur: parseInt(document.getElementById('setting-glass-blur').value),
            borderRadius: parseInt(document.getElementById('setting-border-radius').value),
            cardSize: parseInt(document.getElementById('setting-card-size').value),
            animationLevel: document.getElementById('setting-animations').value,
            sidebarOpacity: parseInt(document.getElementById('setting-sidebar-opacity').value),
            bgGlow: document.getElementById('setting-bg-glow').checked,
            compactMode: document.getElementById('setting-compact-mode').checked
        };

        // Update labels
        document.getElementById('val-glass-blur').textContent = p.glassBlur;
        document.getElementById('val-border-radius').textContent = p.borderRadius;
        document.getElementById('val-card-size').textContent = p.cardSize;
        document.getElementById('val-sidebar-opacity').textContent = p.sidebarOpacity;

        // Apply temporarily (preview)
        config.settings.personalization = p;
        applyPersonalization();
    };

    const personalizationInputs = [
        'setting-app-name', 'setting-accent-color', 'setting-font-family',
        'setting-glass-blur', 'setting-border-radius', 'setting-card-size',
        'setting-animations', 'setting-sidebar-opacity', 'setting-bg-glow',
        'setting-compact-mode'
    ];

    personalizationInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updatePreview;
    });

    showSettingsBtn.onclick = () => {
        const p = config.settings.personalization || {
            appName: 'CODEPILOT',
            accentColor: '#8b5cf6',
            fontFamily: "'Outfit', sans-serif",
            glassBlur: 10,
            borderRadius: 12,
            cardSize: 280,
            animationLevel: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            sidebarOpacity: 80,
            bgGlow: true,
            compactMode: false
        };

        document.getElementById('setting-app-name').value = p.appName || '';
        document.getElementById('setting-accent-color').value = p.accentColor || '#8b5cf6';
        document.getElementById('setting-font-family').value = p.fontFamily || "'Outfit', sans-serif";
        document.getElementById('setting-glass-blur').value = p.glassBlur || 10;
        document.getElementById('setting-border-radius').value = p.borderRadius || 12;
        document.getElementById('setting-card-size').value = p.cardSize || 280;
        document.getElementById('setting-animations').value = p.animationLevel || 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        document.getElementById('setting-sidebar-opacity').value = p.sidebarOpacity || 80;
        document.getElementById('setting-bg-glow').checked = p.bgGlow !== false;
        document.getElementById('setting-compact-mode').checked = !!p.compactMode;

        // Sync labels
        document.getElementById('val-glass-blur').textContent = p.glassBlur || 10;
        document.getElementById('val-border-radius').textContent = p.borderRadius || 12;
        document.getElementById('val-card-size').textContent = p.cardSize || 280;
        document.getElementById('val-sidebar-opacity').textContent = p.sidebarOpacity || 80;

        document.getElementById('github-token-input').value = config.settings.githubToken || '';
        document.getElementById('gitlab-token-input').value = config.settings.gitlabToken || '';
        document.getElementById('current-theme-name').textContent = config.settings.theme ? (config.settings.theme.name || 'Thème personnalisé') : 'Thème par défaut';
        renderGlobalTagsManager();
        settingsModal.classList.remove('hidden');
    };

    document.getElementById('add-global-tag-btn').onclick = () => {
        config.settings.globalTags.push({ id: Date.now().toString(), name: 'Nouvelle étiquette', color: '#8b5cf6' });
        renderGlobalTagsManager();
        save();
    };

    document.getElementById('load-theme-btn').onclick = async () => {
        const filePath = await window.electronAPI.selectFile([{ name: 'App Theme', extensions: ['thmx'] }]);
        if (filePath) {
            try {
                const content = await window.electronAPI.readFile(filePath);
                const theme = JSON.parse(content);
                if (theme && theme.colors) {
                    config.settings.theme = theme;
                    applyTheme(theme);
                    save();
                    showToast("Thème chargé", `Le thème "${theme.name || 'Custom'}" a été appliqué.`);
                }
            } catch (e) {
                alert("Erreur lors de la lecture du thème : " + e.message);
            }
        }
    };

    document.getElementById('reset-theme-btn').onclick = () => {
        config.settings.theme = null;
        document.documentElement.removeAttribute('style');
        document.getElementById('current-theme-name').textContent = 'Thème par défaut';
        save();
        showToast("Thème réinitialisé", "Retour au design original.");
    };

    addSpaceBtn.onclick = () => spaceModal.classList.remove('hidden');
    addProjectBtn.onclick = () => {
        editingProjectId = null;
        selectedProjectTags = [];
        document.getElementById('project-name-input').value = '';
        document.getElementById('project-path-input').value = '';
        document.getElementById('project-repo-input').value = '';
        document.getElementById('project-editor-input').value = 'code';
        document.getElementById('project-notes-input').value = '';
        document.getElementById('confirm-project').textContent = 'Ajouter le projet';
        renderTagSelector();
        projectModal.classList.remove('hidden');
    };

    addProjectUpdateBtn.onclick = () => {
        // Pre-fill date with current locale time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('update-date-input').value = now.toISOString().slice(0, 16);
        document.getElementById('update-status-input').checked = false;
        updateModal.classList.remove('hidden');
    };

    createReleaseBtn.onclick = () => {
        document.getElementById('release-project-name').textContent = `Projet : ${currentDetailProject.name}`;
        document.getElementById('release-tag-input').value = '';
        document.getElementById('release-title-input').value = '';
        document.getElementById('release-body-input').value = '';
        releaseModal.classList.remove('hidden');
    };

    document.getElementById('cancel-space').onclick = () => spaceModal.classList.add('hidden');
    document.getElementById('cancel-project').onclick = () => projectModal.classList.add('hidden');
    document.getElementById('cancel-update').onclick = () => updateModal.classList.add('hidden');
    document.getElementById('cancel-release').onclick = () => releaseModal.classList.add('hidden');
    document.getElementById('cancel-settings').onclick = () => settingsModal.classList.add('hidden');
    document.getElementById('close-detail').onclick = () => detailModal.classList.add('hidden');

    document.getElementById('confirm-settings').onclick = () => {
        config.settings.githubToken = document.getElementById('github-token-input').value.trim();
        config.settings.gitlabToken = document.getElementById('gitlab-token-input').value.trim();
        save();
        showToast("Configuration", "Jetons d'accès sauvegardés.");
        settingsModal.classList.add('hidden');
    };

    document.getElementById('confirm-release').onclick = async () => {
        const tag = document.getElementById('release-tag-input').value.trim();
        const title = document.getElementById('release-title-input').value.trim();
        const body = document.getElementById('release-body-input').value.trim();

        if (!tag || !title) {
            alert("Le tag et le titre sont obligatoires.");
            return;
        }

        const confirmBtn = document.getElementById('confirm-release');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Publication...";

        try {
            const result = await window.electronAPI.createRelease({
                repoUrl: currentDetailProject.repoUrl,
                tag,
                title,
                body,
                tokens: config.settings
            });

            if (result.success) {
                showToast("Release publiée !", `Version ${tag} déployée.`);
                releaseModal.classList.add('hidden');
            } else {
                alert(`Erreur : ${result.error}`);
            }
        } catch (e) {
            alert(`Erreur critique : ${e.message}`);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    };

    document.getElementById('confirm-update').onclick = () => {
        const title = document.getElementById('update-title-input').value.trim();
        const description = document.getElementById('update-desc-input').value.trim();
        const scheduledDate = document.getElementById('update-date-input').value;
        const isFinished = document.getElementById('update-status-input').checked;

        if (title && description && currentDetailProject) {
            if (!currentDetailProject.updates) currentDetailProject.updates = [];
            currentDetailProject.updates.push({
                id: Date.now(),
                title,
                description,
                scheduledDate,
                status: isFinished ? 'finished' : 'pending'
            });
            save();
            renderProjectUpdates();
            updateModal.classList.add('hidden');
            document.getElementById('update-title-input').value = '';
            document.getElementById('update-desc-input').value = '';
            showToast(isFinished ? "MAJ Terminée !" : "MAJ programmée !", `Pour ${currentDetailProject.name}`);
        }
    };

    document.getElementById('detail-open-git-gui').onclick = () => openGitModal(currentDetailProject);
    document.getElementById('close-git-gui').onclick = () => gitModal.classList.add('hidden');
    document.getElementById('git-refresh-btn').onclick = () => refreshGitStatus();

    document.getElementById('git-commit-btn').onclick = async () => {
        const message = document.getElementById('git-commit-message').value.trim();
        if (!message) {
            alert("Veuillez entrer un message de commit.");
            return;
        }

        const btn = document.getElementById('git-commit-btn');
        btn.disabled = true;
        btn.textContent = "Commit en cours...";

        const addRes = await window.electronAPI.gitAdd({ projectPath: currentDetailProject.path, files: [] }); // Stage all
        if (addRes.success) {
            const commitRes = await window.electronAPI.gitCommit({ projectPath: currentDetailProject.path, message });
            if (commitRes.success) {
                showToast("Git Commit", "Changements validés avec succès.");
                document.getElementById('git-commit-message').value = '';
                await refreshGitStatus();
            } else {
                alert(`Erreur Commit: ${commitRes.error}`);
            }
        } else {
            alert(`Erreur Add: ${addRes.error}`);
        }
        btn.disabled = false;
        btn.textContent = "Valider le Commit";
    };

    document.getElementById('git-push-btn').onclick = async () => {
        const btn = document.getElementById('git-push-btn');
        btn.disabled = true;
        btn.textContent = "Pushing...";
        const res = await window.electronAPI.gitPush(currentDetailProject.path);
        if (res.success) {
            showToast("Git Push", "Push effectué avec succès.");
        } else {
            alert(`Erreur Push: ${res.error}`);
        }
        btn.disabled = false;
        btn.textContent = "⬆️ Push";
    };

    document.getElementById('git-pull-btn').onclick = async () => {
        const btn = document.getElementById('git-pull-btn');
        btn.disabled = true;
        btn.textContent = "Pulling...";
        const res = await window.electronAPI.gitPull(currentDetailProject.path);
        if (res.success) {
            showToast("Git Pull", "Mise à jour effectuée avec succès.");
            await refreshGitStatus();
        } else {
            alert(`Erreur Pull: ${res.error}`);
        }
        btn.disabled = false;
        btn.textContent = "⬇️ Pull";
    };

    document.getElementById('detail-open-folder').onclick = () => window.electronAPI.openFolder(currentDetailProject.path);
    document.getElementById('detail-open-terminal').onclick = () => window.electronAPI.openTerminal(currentDetailProject.path);
    document.getElementById('detail-open-vscode').onclick = () => window.electronAPI.openVSCode({
        path: currentDetailProject.path, command: currentDetailProject.editor || 'code'
    });

    document.getElementById('confirm-space').onclick = () => {
        const name = document.getElementById('space-name-input').value.trim();
        if (name) {
            config.spaces.push({ id: Date.now().toString(), name, projects: [] });
            renderSpaces();
            save();
            spaceModal.classList.add('hidden');
            document.getElementById('space-name-input').value = '';
        }
    };

    document.getElementById('select-path-btn').onclick = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('project-path-input').value = path;
            const nameInput = document.getElementById('project-name-input');
            if (!nameInput.value) nameInput.value = path.split(/[\\/]/).pop();
        }
    };

    document.getElementById('confirm-project').onclick = () => {
        const name = document.getElementById('project-name-input').value.trim();
        const path = document.getElementById('project-path-input').value.trim();
        const repoUrl = document.getElementById('project-repo-input').value.trim();
        const editor = document.getElementById('project-editor-input').value.trim() || 'code';
        const notes = document.getElementById('project-notes-input').value.trim();

        if (name && path) {
            const projectData = {
                name, path, repoUrl, editor, notes,
                tags: selectedProjectTags
            };

            if (editingProjectId) {
                config.spaces.forEach(s => {
                    const p = s.projects.find(proj => proj.id === editingProjectId);
                    if (p) {
                        Object.assign(p, projectData);
                    }
                });
            } else {
                const spaceId = config.activeSpaceId === 'all' ? 'default' : config.activeSpaceId;
                const space = config.spaces.find(s => s.id === spaceId);
                if (space) {
                    space.projects.push({
                        id: Date.now().toString(),
                        ...projectData,
                        pinned: false,
                        updates: []
                    });
                }
            }
            renderProjects();
            save();
            projectModal.classList.add('hidden');
        }
    };

    document.getElementById('minimize-btn').onclick = () => window.electronAPI.minimize();
    document.getElementById('maximize-btn').onclick = () => window.electronAPI.maximize();
    document.getElementById('close-btn').onclick = () => window.electronAPI.close();
}

init();
