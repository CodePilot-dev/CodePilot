let config = {
    spaces: [{ id: 'default', name: 'Général', projects: [] }],
    activeSpaceId: 'default',
    settings: {
        githubToken: '',
        gitlabToken: '',
        theme: null,
        language: 'fr',
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
            compactMode: false,
            autoStart: false,
            foregroundStart: true,
            trayMode: false
        }
    }
};
let editingProjectId = null;
let currentDetailProject = null;
let selectedProjectTags = []; // Temporary storage for modal
let activeFilters = {
    tags: [],
    frameworks: []
};
let currentRenderId = 0;
let contextMenuTarget = null;
const translations = {
    fr: {
        workspaces: "Espaces",
        all_projects: "Tous les projets",
        my_projects: "Mes Projets",
        quick_search: "Recherche rapide (Ctrl+K)...",
        new_project: "+ Nouveau Projet",
        new_space: "Nouvel Espace",
        settings: "Configuration",
        language: "Langue",
        appearance: "Thème & Apparence",
        tokens: "Jetons & Accès",
        interface: "Interface & Nom",
        labels: "Étiquettes",
        save: "Sauvegarder",
        cancel: "Annuler",
        close: "Fermer",
        reset: "Réinitialiser",
        load: "Charger",
        export: "Exporter",
        app_name: "Nom de l'application",
        font: "Police principale",
        card_size: "Taille des cartes",
        animations: "Animations",
        sidebar_opacity: "Opacité Sidebar",
        blur: "Flou",
        radius: "Arrondi",
        glow: "Lueur",
        compact: "Mode Compact",
        auto_start: "Lancement auto",
        foreground: "Affichage actif",
        background: "Réduire en arrière-plan",
        glow: "Lueur néon",
        general: "Général",
        appearance_title: "Apparence",
        system: "Système",
        delete_proj_confirm: "Supprimer ce projet ?",
        delete_space_confirm: "Supprimer cet espace et tous ses projets ?",
        no_projects: "Prêt à coder ?",
        add_first: "Ajoute ton premier projet pour commencer.",
        frameworks: "Frameworks",
        tags: "Étiquettes",
        clear: "Effacer",
        toast_save: "Configuration sauvegardée",
        v_vscode: "Ouvrir VSCode",
        v_terminal: "Terminal",
        v_folder: "Dossier",
        v_settings: "Réglages",
        v_release: "Release",
        v_repo: "Repo",
        v_git_gui: "Git GUI",
        v_roadmap: "Roadmap",
        v_scripts: "Scripts npm",
        v_notes: "Notes & Mémo",
        v_scheduled: "Prévu le",
        v_finished: "Terminé le",
        v_upcoming: "À venir",
        v_done: "Terminé",
        v_add_step: "Ajouter une étape",
        forced_update_title: "Mise à jour obligatoire",
        forced_update_desc: "Une mise à jour critique est disponible. Pour des raisons de sécurité, vous devez mettre à jour CodePilot avant de continuer.",
        update_btn: "Mettre à jour maintenant"
    },
    en: {
        workspaces: "Workspaces",
        all_projects: "All Projects",
        my_projects: "My Projects",
        quick_search: "Quick search (Ctrl+K)...",
        new_project: "+ New Project",
        new_space: "New Space",
        settings: "Settings",
        language: "Language",
        appearance: "Theme & Appearance",
        tokens: "Tokens & Access",
        interface: "Interface & Name",
        labels: "Labels",
        save: "Save",
        cancel: "Cancel",
        close: "Close",
        reset: "Reset",
        load: "Load",
        export: "Export",
        app_name: "Application Name",
        font: "Primary Font",
        card_size: "Card Size",
        animations: "Animations",
        sidebar_opacity: "Sidebar Opacity",
        blur: "Blur",
        radius: "Radius",
        glow: "Glow",
        compact: "Compact Mode",
        auto_start: "Auto Launch",
        foreground: "Active Display",
        background: "Minimize to Tray",
        glow: "Neon Glow",
        general: "General",
        appearance_title: "Appearance",
        system: "System",
        delete_proj_confirm: "Delete this project?",
        delete_space_confirm: "Delete this workspace and all its projects?",
        no_projects: "Ready to code?",
        add_first: "Add your first project to get started.",
        frameworks: "Frameworks",
        tags: "Tags",
        clear: "Clear",
        toast_save: "Settings saved",
        v_vscode: "Open VSCode",
        v_terminal: "Terminal",
        v_folder: "Folder",
        v_settings: "Settings",
        v_release: "Release",
        v_repo: "Repo",
        v_git_gui: "Git GUI",
        v_roadmap: "Roadmap",
        v_scripts: "NPM Scripts",
        v_notes: "Notes & Memo",
        v_scheduled: "Scheduled on",
        v_finished: "Finished on",
        v_upcoming: "Upcoming",
        v_done: "Done",
        v_add_step: "Add a step",
        forced_update_title: "Mandatory Update",
        forced_update_desc: "A critical update is available. For security reasons, you must update CodePilot before continuing.",
        update_btn: "Update Now"
    }
};
let APP_VERSION = '0.0.0';

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
    // Fetch version from package.json automatically
    APP_VERSION = await window.electronAPI.getAppVersion();
    const versionDisplay = document.getElementById('app-version-display');
    if (versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;

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
    if (config.settings.theme) applyTheme(config.settings.theme);
    applyPersonalization();
    checkForUpdates();
    applyLanguage();
    setupEventListeners();

    // Global Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('project-search');
            if (searchInput) searchInput.focus();
        }
    });
}

function applyPersonalization() {
    const p = config.settings.personalization || {};
    const root = document.documentElement;

    // Apply values to CSS variables
    if (p.accentColor) {
        root.style.setProperty('--primary', p.accentColor);
        // Sync glow with accent color (mix with black to keep it subtle and dark)
        root.style.setProperty('--bg-lighting', `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${p.accentColor}, black 60%), transparent 75%)`);
    }
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

    // Apply Win Settings
    if (p.autoStart !== undefined) window.electronAPI.setLaunchAtStartup(p.autoStart);
    if (p.foregroundStart) {
        window.electronAPI.setWindowState({ focus: true });
    }
    if (p.trayMode !== undefined) window.electronAPI.setTrayMode(p.trayMode);
}

async function checkForUpdates(manual = false) {
    const result = await window.electronAPI.checkUpdates();
    if (result.success) {
        const latest = result.version;
        const current = APP_VERSION;

        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);

        // Forced update if major or minor is higher
        const isForced = latestParts[0] > currentParts[0] || latestParts[1] > currentParts[1];

        if (isForced) {
            const forcedModal = document.getElementById('forced-update-modal');
            if (forcedModal) {
                forcedModal.classList.remove('hidden');
                document.getElementById('forced-update-btn').onclick = () => startUpdate();
            }
            return; // Block execution
        }

        let isNewer = false;
        for (let i = 0; i < 3; i++) {
            if (latestParts[i] > currentParts[i]) {
                isNewer = true;
                break;
            } else if (latestParts[i] < currentParts[i]) {
                break;
            }
        }

        if (isNewer && !manual) {
            showToast("Mise à jour disponible", `La version ${latest} est disponible ! Cliquez pour l'installer.`, () => {
                startUpdate();
            });
        } else if (manual) {
            if (isNewer) {
                if (confirm(`Une nouvelle version (${latest}) est disponible. Voulez-vous l'installer maintenant ? L'application redémarrera.`)) {
                    startUpdate();
                }
            } else {
                showToast("À jour", "Vous utilisez déjà la dernière version.");
            }
        }
    } else if (manual) {
        alert("Erreur lors de la vérification des mises à jour.");
    }
}

async function startUpdate() {
    showToast("Mise à jour", "Téléchargement des fichiers en cours...");
    const res = await window.electronAPI.downloadUpdate();
    if (!res.success) {
        alert("La mise à jour a échoué : " + res.error);
    }
}

function applyTheme(theme) {
    if (!theme) return;

    const root = document.documentElement;

    // Apply colors (existing functionality)
    if (theme.colors) {
        Object.entries(theme.colors).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });
    }

    // Apply typography
    if (theme.typography) {
        Object.entries(theme.typography).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });
    }

    // Apply dimensions
    if (theme.dimensions) {
        Object.entries(theme.dimensions).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });
    }

    // Apply effects
    if (theme.effects) {
        Object.entries(theme.effects).forEach(([prop, value]) => {
            root.style.setProperty(prop, value);
        });
    }

    // Apply interface settings
    if (theme.interface) {
        const iface = theme.interface;

        // App name
        if (iface.appName) {
            const logo = document.querySelector('.logo');
            if (logo) logo.textContent = iface.appName;
            document.title = iface.appName;
        }

        // Background glow
        if (iface.bgGlow !== undefined) {
            document.body.classList.toggle('no-glow', !iface.bgGlow);
        }

        // Compact mode
        if (iface.compactMode !== undefined) {
            document.body.classList.toggle('compact', iface.compactMode);
        }
    }

    // Display theme metadata
    const themeName = theme.name || 'Thème personnalisé';
    const themeInfo = theme.author ? `${themeName} par ${theme.author}` : themeName;
    document.getElementById('current-theme-name').textContent = themeInfo;

    // Optional: Log theme info to console for debugging
    if (theme.version || theme.description) {
        console.log(`🎨 Thème chargé: ${themeName}`);
        if (theme.version) console.log(`   Version: ${theme.version}`);
        if (theme.description) console.log(`   Description: ${theme.description}`);
        if (theme.author) console.log(`   Auteur: ${theme.author}`);
    }
}

// Rendering
function renderSpaces() {
    spacesList.innerHTML = '';

    const allItem = document.createElement('div');
    allItem.className = `nav-item ${config.activeSpaceId === 'all' ? 'active' : ''}`;
    allItem.innerHTML = `<span>🚀 ${t('all_projects')}</span>`;
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

        // Drag & Drop for spaces
        item.ondragover = (e) => {
            e.preventDefault();
            item.classList.add('drag-over');
        };

        item.ondragleave = () => {
            item.classList.remove('drag-over');
        };

        item.ondrop = (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            const projectId = e.dataTransfer.getData('projectId');
            if (projectId) {
                moveProjectToSpace(projectId, space.id);
            }
        };

        spacesList.appendChild(item);
    });
}

function moveProjectToSpace(projectId, targetSpaceId) {
    let sourceSpace = null;
    let projectIdx = -1;

    // Localize the project first
    config.spaces.forEach(s => {
        const idx = s.projects.findIndex(p => p.id == projectId);
        if (idx !== -1) {
            sourceSpace = s;
            projectIdx = idx;
        }
    });

    if (sourceSpace && sourceSpace.id !== targetSpaceId) {
        // Remove from source
        const projectToMove = sourceSpace.projects.splice(projectIdx, 1)[0];

        // Add to target
        const targetSpace = config.spaces.find(s => s.id === targetSpaceId);
        if (targetSpace) {
            targetSpace.projects.push(projectToMove);
            save();
            renderProjects();
            showToast(t('all_projects'), `Projet déplacé vers ${targetSpace.name}`);
        } else {
            // Rollback if target not found (safety)
            sourceSpace.projects.splice(projectIdx, 0, projectToMove);
        }
    } else {
        // Same space or not found: cancel operation (nothing to do)
    }
}

async function renderProjects() {
    const renderId = ++currentRenderId;
    let projects = [];
    if (config.activeSpaceId === 'all') {
        currentSpaceName.textContent = t('all_projects');
        projects = config.spaces.flatMap(s => s.projects);
    } else {
        const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);
        if (!activeSpace) {
            currentSpaceName.textContent = t('all_projects');
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

    // Filter by Tags
    if (activeFilters.tags.length > 0) {
        projects = projects.filter(p =>
            (p.tags || []).some(tId => activeFilters.tags.includes(tId))
        );
    }

    // Filter by Frameworks
    if (activeFilters.frameworks.length > 0) {
        const results = await Promise.all(projects.map(async p => {
            const pkg = await window.electronAPI.readPackageJson(p.path);
            const fw = detectFramework(pkg);
            return { project: p, fw };
        }));
        projects = results
            .filter(r => r.fw && activeFilters.frameworks.includes(r.fw.id))
            .map(r => r.project);
    }

    projects.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    projectsCount.textContent = `${projects.length} projet${projects.length > 1 ? 's' : ''}`;
    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        for (const project of projects) {
            if (renderId !== currentRenderId) return;
            const card = await createProjectCard(project);
            if (renderId !== currentRenderId) return;
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
            </div>
            <p>${truncatePath(project.path)}</p>
            
            <div class="project-tags" style="margin-top: 12px;">
                ${framework ? `<span class="fw-badge ${framework.id}">${framework.name}</span>` : ''}
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

    // Drag support
    card.draggable = true;
    card.ondragstart = (e) => {
        e.dataTransfer.setData('projectId', project.id);
        card.classList.add('dragging');
    };
    card.ondragend = () => {
        card.classList.remove('dragging');
    };

    card._project = project; // Store for context menu

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

    // Ensure textarea is accessible
    const msgBox = document.getElementById('git-commit-message');
    if (msgBox) {
        msgBox.disabled = false;
        setTimeout(() => msgBox.focus(), 100);
    }

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

function showToast(title, message, callback = null) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (callback) toast.style.cursor = 'pointer';
    toast.innerHTML = `
        <div class="toast-icon">🚀</div>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
    `;
    if (callback) toast.onclick = callback;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5000);
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
    if (!pkg) return { id: 'html', name: 'HTML' };
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

    // Populate Space Selector
    const spaceSelect = document.getElementById('project-space-input');
    spaceSelect.innerHTML = '';
    config.spaces.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        // Check if project belongs to this space
        if (s.projects.find(p => p.id === project.id)) {
            option.selected = true;
        }
        spaceSelect.appendChild(option);
    });

    renderTagSelector();
    projectModal.classList.remove('hidden');
}

// Language Management
function t(key) {
    const lang = config.settings.language || 'fr';
    return translations[lang][key] || translations['fr'][key] || key;
}

function applyLanguage() {
    const lang = config.settings.language || 'fr';

    // Sidebar
    const sidebarHeader = document.querySelector('.sidebar-header h2');
    if (sidebarHeader) sidebarHeader.textContent = t('workspaces');

    // Header
    const searchInput = document.getElementById('project-search');
    if (searchInput) searchInput.placeholder = t('quick_search');

    const addProjectBtnLabel = document.getElementById('add-project-btn');
    if (addProjectBtnLabel) addProjectBtnLabel.textContent = t('new_project');

    // Filter Bar
    const fwLabel = document.querySelector('#filter-bar .filter-group:nth-child(1) .filter-label');
    if (fwLabel) fwLabel.textContent = t('frameworks') + ' :';
    const tagLabel = document.querySelector('#filter-bar .filter-group:nth-child(2) .filter-label');
    if (tagLabel) tagLabel.textContent = t('tags') + ' :';
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) clearBtn.textContent = t('clear');

    // Empty State
    const emptyTitle = document.querySelector('#empty-state h3');
    if (emptyTitle) emptyTitle.textContent = t('no_projects');
    const emptyDesc = document.querySelector('#empty-state p');
    if (emptyDesc) emptyDesc.textContent = t('add_first');

    // Win settings labels
    const foregroundLabel = document.querySelector('label[for="setting-foreground-start"]');
    if (foregroundLabel) foregroundLabel.textContent = t('foreground');
    const trayLabel = document.getElementById('label-tray-mode');
    if (trayLabel) trayLabel.textContent = t('background');

    // Settings Modal specific labels
    const langLabel = document.getElementById('label-setting-language');
    if (langLabel) langLabel.textContent = t('language');
    const appNameLabel = document.getElementById('label-setting-app-name');
    if (appNameLabel) appNameLabel.textContent = t('app_name');
    const fontLabel = document.getElementById('label-setting-font');
    if (fontLabel) fontLabel.textContent = t('font');
    const cardSizeLabel = document.getElementById('label-setting-card-size');
    if (cardSizeLabel) {
        const span = cardSizeLabel.querySelector('span');
        cardSizeLabel.innerHTML = `${t('card_size')} : ${span ? span.outerHTML : ''}px`;
    }
    const animLabel = document.getElementById('label-setting-animations');
    if (animLabel) animLabel.textContent = t('animations');
    const sidebarOpacityLabel = document.getElementById('label-setting-sidebar-opacity');
    if (sidebarOpacityLabel) {
        const span = sidebarOpacityLabel.querySelector('span');
        sidebarOpacityLabel.innerHTML = `${t('sidebar_opacity')} : ${span ? span.outerHTML : ''}%`;
    }

    // Section Titles
    const sections = document.querySelectorAll('.settings-section h4');
    if (sections.length >= 3) {
        sections[0].textContent = '📱 ' + t('general');
        sections[1].textContent = '🎨 ' + t('appearance_title');
        sections[2].textContent = '⚙️ ' + t('system');
    }

    // Checkbox Labels
    const glowLabel = document.getElementById('label-glow');
    if (glowLabel) glowLabel.textContent = t('glow');
    const compactLabel = document.getElementById('label-compact');
    if (compactLabel) compactLabel.textContent = t('compact');
    const autoStartLabel = document.querySelector('label[for="setting-auto-start"]');
    if (autoStartLabel) autoStartLabel.textContent = t('auto_start');

    // Forced Update labels
    const forcedTitle = document.getElementById('label-forced-update-title');
    if (forcedTitle) forcedTitle.textContent = t('forced_update_title');
    const forcedDesc = document.getElementById('label-forced-update-desc');
    if (forcedDesc) forcedDesc.textContent = t('forced_update_desc');
    const forcedBtn = document.getElementById('forced-update-btn');
    if (forcedBtn) forcedBtn.textContent = t('update_btn');

    // Modals & Settings
    // (Many are updated when opened, but let's do the static ones)
    const settingsTitle = document.querySelector('#settings-modal h3');
    if (settingsTitle) settingsTitle.textContent = '⚙️ ' + t('settings');

    renderSpaces();
    renderProjects();
}

// Filter Bar Logic
function renderFilterBar() {
    const fwContainer = document.getElementById('framework-filters');
    const tagContainer = document.getElementById('tag-filters');
    if (!fwContainer || !tagContainer) return;

    fwContainer.innerHTML = '';
    tagContainer.innerHTML = '';

    const frameworks = [
        { id: 'next', name: 'Next.js' },
        { id: 'react', name: 'React' },
        { id: 'vue', name: 'Vue' },
        { id: 'svelte', name: 'Svelte' },
        { id: 'electron', name: 'Electron' },
        { id: 'vite', name: 'Vite' },
        { id: 'ts', name: 'TS' },
        { id: 'html', name: 'HTML' }
    ];

    frameworks.forEach(fw => {
        const chip = document.createElement('div');
        const isActive = activeFilters.frameworks.includes(fw.id);
        chip.className = `filter-chip ${isActive ? 'active' : ''}`;
        chip.textContent = fw.name;
        chip.onclick = () => {
            if (isActive) {
                activeFilters.frameworks = activeFilters.frameworks.filter(id => id !== fw.id);
            } else {
                activeFilters.frameworks.push(fw.id);
            }
            renderFilterBar();
            renderProjects();
        };
        fwContainer.appendChild(chip);
    });

    config.settings.globalTags.forEach(tag => {
        const chip = document.createElement('div');
        const isActive = activeFilters.tags.includes(tag.id);
        chip.className = `filter-chip ${isActive ? 'active' : ''}`;
        chip.style.setProperty('--tag-color', tag.color);
        chip.textContent = tag.name;
        if (isActive) {
            chip.style.background = tag.color;
            chip.style.borderColor = tag.color;
            chip.style.color = 'white';
        }
        chip.onclick = () => {
            if (isActive) {
                activeFilters.tags = activeFilters.tags.filter(id => id !== tag.id);
            } else {
                activeFilters.tags.push(tag.id);
            }
            renderFilterBar();
            renderProjects();
        };
        tagContainer.appendChild(chip);
    });

    const filterBar = document.getElementById('filter-bar');
    const hasActiveFilters = activeFilters.tags.length > 0 || activeFilters.frameworks.length > 0;
    document.getElementById('clear-filters-btn').style.display = hasActiveFilters ? 'block' : 'none';
}

// Event Listeners
function setupEventListeners() {
    projectSearch.oninput = () => renderProjects();

    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const filterBar = document.getElementById('filter-bar');

    toggleFiltersBtn.onclick = () => {
        const isHidden = filterBar.classList.toggle('hidden');
        if (!isHidden) {
            renderFilterBar();
        }
    };

    document.getElementById('clear-filters-btn').onclick = () => {
        activeFilters.tags = [];
        activeFilters.frameworks = [];
        renderFilterBar();
        renderProjects();
    };

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
            compactMode: document.getElementById('setting-compact-mode').checked,
            autoStart: document.getElementById('setting-auto-start').checked,
            foregroundStart: document.getElementById('setting-foreground-start').checked,
            trayMode: document.getElementById('setting-tray-mode').checked
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
        'setting-compact-mode', 'setting-auto-start', 'setting-foreground-start', 'setting-tray-mode'
    ];

    personalizationInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                el.onchange = updatePreview;
            } else {
                el.oninput = updatePreview;
            }
        }
    });

    document.getElementById('check-update-btn').onclick = (e) => {
        e.preventDefault();
        checkForUpdates(true);
    };

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
            compactMode: false,
            autoStart: false,
            foregroundStart: true,
            trayMode: false
        };

        document.getElementById('setting-app-name').value = p.appName || '';
        document.getElementById('setting-accent-color').value = p.accentColor || '#8b5cf6';
        document.getElementById('setting-font-family').value = p.fontFamily || "'Outfit', sans-serif";
        document.getElementById('setting-glass-blur').value = p.glassBlur || 10;
        document.getElementById('setting-border-radius').value = p.borderRadius || 12;
        document.getElementById('setting-card-size').value = p.cardSize || 280;
        const animEl = document.getElementById('setting-animations');
        if (animEl) animEl.value = p.animationLevel || 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        document.getElementById('setting-sidebar-opacity').value = p.sidebarOpacity || 80;
        document.getElementById('setting-bg-glow').checked = p.bgGlow !== false;
        document.getElementById('setting-compact-mode').checked = !!p.compactMode;
        document.getElementById('setting-auto-start').checked = !!p.autoStart;
        document.getElementById('setting-foreground-start').checked = !!p.foregroundStart;
        document.getElementById('setting-tray-mode').checked = !!p.trayMode;

        // Sync labels
        document.getElementById('val-glass-blur').textContent = p.glassBlur || 10;
        document.getElementById('val-border-radius').textContent = p.borderRadius || 12;
        document.getElementById('val-card-size').textContent = p.cardSize || 280;
        document.getElementById('val-sidebar-opacity').textContent = p.sidebarOpacity || 80;

        document.getElementById('github-token-input').value = config.settings.githubToken || '';
        document.getElementById('gitlab-token-input').value = config.settings.gitlabToken || '';
        document.getElementById('current-theme-name').textContent = config.settings.theme ? (config.settings.theme.name || 'Thème personnalisé') : 'Thème par défaut';
        document.getElementById('setting-language').value = config.settings.language || 'fr';
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

                // Validate theme structure (at least one section must be present)
                const hasValidSection = theme.colors || theme.typography || theme.dimensions ||
                    theme.effects || theme.interface;

                if (!theme.name) {
                    throw new Error("Le thème doit avoir un nom (propriété 'name')");
                }

                if (!hasValidSection) {
                    throw new Error("Le thème doit contenir au moins une section (colors, typography, dimensions, effects, ou interface)");
                }

                // Apply theme
                config.settings.theme = theme;
                applyTheme(theme);
                save();

                // Show success message with theme info
                const themeInfo = theme.author ? `${theme.name} par ${theme.author}` : theme.name;
                const description = theme.description ? `\n${theme.description}` : '';
                showToast("✨ Thème chargé", `${themeInfo}${description}`);

            } catch (e) {
                if (e instanceof SyntaxError) {
                    alert("❌ Erreur : Le fichier .thmx n'est pas un JSON valide.\n\n" + e.message);
                } else {
                    alert("❌ Erreur lors du chargement du thème :\n\n" + e.message);
                }
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

    document.getElementById('export-theme-btn').onclick = async () => {
        // Prompt for theme metadata
        const themeName = prompt("Nom du thème :", "Mon Thème Personnalisé");
        if (!themeName) return;

        const author = prompt("Auteur (optionnel) :", "");
        const description = prompt("Description (optionnel) :", "");

        // Get current CSS variables from root
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);

        // Build theme object from current settings
        const theme = {
            name: themeName,
            version: "1.0.0"
        };

        if (author) theme.author = author;
        if (description) theme.description = description;

        // Extract colors
        const colorVars = [
            '--primary', '--primary-dark', '--accent', '--bg-app',
            '--bg-sidebar', '--bg-card', '--bg-hub', '--border',
            '--text-main', '--text-muted', '--danger', '--success'
        ];

        theme.colors = {};
        colorVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName).trim();
            if (value) theme.colors[varName] = value;
        });

        // Extract typography
        const typographyVars = ['--font-main', '--font-mono'];
        const typography = {};
        typographyVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName).trim();
            if (value) typography[varName] = value;
        });
        if (Object.keys(typography).length > 0) theme.typography = typography;

        // Extract dimensions
        const dimensionVars = ['--card-size', '--border-radius', '--glass-blur'];
        const dimensions = {};
        dimensionVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName).trim();
            if (value) dimensions[varName] = value;
        });
        if (Object.keys(dimensions).length > 0) theme.dimensions = dimensions;

        // Extract effects
        const effectVars = ['--transition', '--sidebar-opacity'];
        const effects = {};
        effectVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName).trim();
            if (value) effects[varName] = value;
        });
        if (Object.keys(effects).length > 0) theme.effects = effects;

        // Extract interface settings from personalization
        const p = config.settings.personalization || {};
        theme.interface = {
            appName: p.appName || 'CODEPILOT',
            bgGlow: p.bgGlow !== false,
            compactMode: !!p.compactMode
        };

        // Save to file
        const content = JSON.stringify(theme, null, 4);
        const result = await window.electronAPI.saveFile({
            defaultPath: `${themeName.toLowerCase().replace(/\s+/g, '-')}.thmx`,
            filters: [{ name: 'Theme File', extensions: ['thmx'] }],
            content: content
        });

        if (result.success) {
            showToast("✨ Thème exporté", `Votre thème a été sauvegardé avec succès !`);
        } else if (!result.cancelled) {
            alert("❌ Erreur lors de l'export : " + result.error);
        }
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

        // Populate Space Selector
        const spaceSelect = document.getElementById('project-space-input');
        spaceSelect.innerHTML = '';
        config.spaces.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.name;
            if (s.id === config.activeSpaceId || (config.activeSpaceId === 'all' && s.id === 'default')) {
                option.selected = true;
            }
            spaceSelect.appendChild(option);
        });

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
        document.getElementById('release-project-name').innerHTML = `Projet : <b>${currentDetailProject.name}</b><br>
        <span style="font-size:0.75rem; opacity:0.7; font-family: var(--font-mono);">${currentDetailProject.repoUrl}</span>`;

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

    // Context Menu Logic
    const ctxMenu = document.getElementById('context-menu');
    const ctxProjectActions = document.getElementById('ctx-project-actions');

    document.addEventListener('contextmenu', (e) => {
        const card = e.target.closest('.project-card');
        const grid = e.target.closest('.projects-grid');

        if (card || grid) {
            e.preventDefault();
            contextMenuTarget = card ? card._project : null;

            // Toggle visibility of project-specific actions
            if (contextMenuTarget) {
                ctxProjectActions.classList.remove('hidden');
                document.getElementById('ctx-pin').innerHTML = `<span>${contextMenuTarget.pinned ? '★' : '☆'}</span> ${contextMenuTarget.pinned ? 'Désépingler' : 'Épingler'}`;

                // Show/Hide repo action
                const repoItem = document.getElementById('ctx-repo');
                if (contextMenuTarget.repoUrl) {
                    repoItem.classList.remove('hidden');
                } else {
                    repoItem.classList.add('hidden');
                }
            } else {
                ctxProjectActions.classList.add('hidden');
            }

            ctxMenu.style.left = `${e.pageX}px`;
            ctxMenu.style.top = `${e.pageY}px`;
            ctxMenu.classList.remove('hidden');
        }
    });

    document.addEventListener('click', () => {
        ctxMenu.classList.add('hidden');
    });

    // Context Menu Actions
    document.getElementById('ctx-new').onclick = () => addProjectBtn.click();
    document.getElementById('ctx-new-space').onclick = () => addSpaceBtn.click();
    document.getElementById('ctx-refresh').onclick = () => window.location.reload();

    document.getElementById('ctx-open').onclick = () => {
        if (contextMenuTarget) openDetailModal(contextMenuTarget);
    };
    document.getElementById('ctx-edit').onclick = () => {
        if (contextMenuTarget) openEditModal(contextMenuTarget);
    };
    document.getElementById('ctx-pin').onclick = () => {
        if (contextMenuTarget) togglePin(contextMenuTarget.id);
    };
    document.getElementById('ctx-delete').onclick = () => {
        if (contextMenuTarget) deleteProject(contextMenuTarget.id);
    };

    // Advanced Actions
    document.getElementById('ctx-vscode').onclick = () => {
        if (contextMenuTarget) window.electronAPI.openInEditor(contextMenuTarget.path, contextMenuTarget.editor || 'code');
    };
    document.getElementById('ctx-terminal').onclick = () => {
        if (contextMenuTarget) window.electronAPI.openTerminal(contextMenuTarget.path);
    };
    document.getElementById('ctx-folder').onclick = () => {
        if (contextMenuTarget) window.electronAPI.openPath(contextMenuTarget.path);
    };
    document.getElementById('ctx-repo').onclick = () => {
        if (contextMenuTarget && contextMenuTarget.repoUrl) window.electronAPI.openExternal(contextMenuTarget.repoUrl);
    };
    document.getElementById('ctx-copy-path').onclick = () => {
        if (contextMenuTarget) {
            navigator.clipboard.writeText(contextMenuTarget.path);
            showToast("Chemin copié", contextMenuTarget.path);
        }
    };

    document.getElementById('confirm-settings').onclick = () => {
        config.settings.githubToken = document.getElementById('github-token-input').value.trim();
        config.settings.gitlabToken = document.getElementById('gitlab-token-input').value.trim();
        config.settings.language = document.getElementById('setting-language').value;
        save();
        applyLanguage();
        showToast(t('settings'), t('toast_save'));
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
                let msg = commitRes.error;
                if (msg.includes('nothing to commit') || msg.includes('no changes added to commit')) {
                    msg = "Aucun changement à valider. Assurez-vous d'avoir des fichiers modifiés.";
                } else if (msg.includes('tell me who you are')) {
                    msg = "Configuration Git manquante (user.name/user.email).";
                }
                alert(`Erreur Commit: ${msg}`);
            }
        } else {
            alert(`Erreur Add: ${addRes.error}`);
        }
        btn.disabled = false;
        btn.textContent = "Valider le Commit";
    };

    document.getElementById('git-push-btn').onclick = async () => {
        const btn = document.getElementById('git-push-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Pushing...";

        let res = await window.electronAPI.gitPush(currentDetailProject.path);

        // Auto-fix system: Handle "fetch first" / "rejected" / "non-fast-forward"
        if (!res.success && (
            res.error.includes('fetch first') ||
            res.error.includes('rejected') ||
            res.error.includes('tip of your current branch is behind') ||
            res.error.includes('remote contains work')
        )) {
            // Try to auto-fix by pulling first
            const pullRes = await window.electronAPI.gitPull(currentDetailProject.path);
            if (pullRes.success) {
                // If pull succeeded, retry push
                res = await window.electronAPI.gitPush(currentDetailProject.path);
            }
        }

        if (res.success) {
            showToast("Git Push", "Push effectué avec succès.");
        } else {
            // Only show error if auto-fix failed or wasn't applicable
            alert(`Erreur Push: ${res.error}`);
        }

        btn.disabled = false;
        btn.textContent = originalText; // Restore original text (likely "⬆️ Push")
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
            const targetSpaceId = document.getElementById('project-space-input').value;

            if (editingProjectId) {
                // Find current space of the project
                let currentSpace = null;
                let projectIndex = -1;

                for (const s of config.spaces) {
                    const idx = s.projects.findIndex(p => p.id === editingProjectId);
                    if (idx !== -1) {
                        currentSpace = s;
                        projectIndex = idx;
                        break;
                    }
                }

                if (currentSpace) {
                    const project = currentSpace.projects[projectIndex];
                    Object.assign(project, projectData);

                    // Move if space changed
                    if (currentSpace.id !== targetSpaceId) {
                        const targetSpace = config.spaces.find(s => s.id === targetSpaceId);
                        if (targetSpace) {
                            // Remove from old
                            currentSpace.projects.splice(projectIndex, 1);
                            // Add to new
                            targetSpace.projects.push(project);
                        }
                    }
                }
            } else {
                const space = config.spaces.find(s => s.id === targetSpaceId);
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

    // New Detail Edit Button
    document.getElementById('detail-edit-project').onclick = () => {
        if (currentDetailProject) {
            openEditModal(currentDetailProject);
            detailModal.classList.add('hidden'); // Close detail to show edit modal clearly
        }
    };
}

init();
