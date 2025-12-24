// State Management
let config = {
    spaces: [{ id: 'default', name: 'Général', projects: [] }],
    activeSpaceId: 'default'
};
let editingProjectId = null;

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
const addSpaceBtn = document.getElementById('add-space-btn');
const addProjectBtn = document.getElementById('add-project-btn');

// Initialize
async function init() {
    const savedConfig = await window.electronAPI.getConfig();
    if (savedConfig) {
        config = savedConfig;
        if (!config.activeSpaceId) config.activeSpaceId = config.spaces[0].id;
    }
    renderSpaces();
    renderProjects();
    setupEventListeners();
}

// Rendering
function renderSpaces() {
    spacesList.innerHTML = '';
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
    const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);
    if (!activeSpace) return;

    currentSpaceName.textContent = activeSpace.name;

    if (searchTerm) {
        projects = projects.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.path.toLowerCase().includes(searchTerm) ||
            (p.notes && p.notes.toLowerCase().includes(searchTerm))
        );
    }

    // Sort: Pinned first
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

    // Fetch package.json info for scripts and framework detection
    const pkg = await window.electronAPI.readPackageJson(project.path);
    const scripts = pkg && pkg.scripts ? Object.keys(pkg.scripts) : [];
    const framework = detectFramework(pkg);

    card.innerHTML = `
        <div class="project-card-header">
            <button class="pin-project ${project.pinned ? 'active' : ''}" title="${project.pinned ? 'Désépingler' : 'Épingler'}">
                ${project.pinned ? '★' : '☆'}
            </button>
            <button class="edit-project" title="Modifier le projet">✎</button>
            <button class="delete-project" title="Supprimer le projet">✕</button>
        </div>
        <div class="project-info">
            <div class="project-title-row">
                <h3>${project.name} ${project.repoUrl ? '🔗' : ''}</h3>
                ${framework ? `<span class="fw-badge ${framework.id}">${framework.name}</span>` : ''}
            </div>
            <div class="project-path">${project.path}</div>
            ${project.notes ? `<div class="project-notes">${project.notes}</div>` : ''}
        </div>
        <div class="project-actions">
            <button class="action-btn" data-action="folder">
                <span>📁</span>
                <span>Dossier</span>
            </button>
            <button class="action-btn" data-action="terminal">
                <span>💻</span>
                <span>Terminal</span>
            </button>
            <button class="action-btn" data-action="vscode" data-editor="${project.editor || 'code'}">
                <span>⚡</span>
                <span>${project.editor === 'cursor' ? 'Cursor' : 'VS Code'}</span>
            </button>
            ${project.repoUrl ? `
            <button class="action-btn" data-action="git">
                <span>📦</span>
                <span>Repo</span>
            </button>` : ''}
        </div>
        ${scripts.length > 0 ? `
        <div class="scripts-section">
            <div class="scripts-header">Scripts npm</div>
            <div class="scripts-list">
                ${scripts.map(s => `<span class="script-tag" data-script="${s}">npm run ${s}</span>`).join('')}
            </div>
        </div>` : ''}
    `;

    // Event Listeners for card actions
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

    card.querySelectorAll('.action-btn').forEach(btn => {
        btn.onclick = () => {
            const action = btn.dataset.action;
            const editor = btn.dataset.editor || 'code';
            if (action === 'folder') window.electronAPI.openFolder(project.path);
            if (action === 'terminal') window.electronAPI.openTerminal(project.path);
            if (action === 'vscode') window.electronAPI.openVSCode({ path: project.path, command: editor });
            if (action === 'git') window.electronAPI.openExternal(project.repoUrl);
        };
    });

    card.querySelectorAll('.script-tag').forEach(tag => {
        tag.onclick = () => {
            window.electronAPI.runNpmScript({
                projectPath: project.path,
                script: tag.dataset.script
            });
        };
    });

    return card;
}

// Add data-editor attribute to the button in the template
// I need to update the card.innerHTML line in renderer.js

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
    if (confirm('Supprimer ce projet de l\'espace ?')) {
        const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);
        activeSpace.projects = activeSpace.projects.filter(p => p.id !== id);
        renderProjects();
        save();
    }
}

function togglePin(id) {
    const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);
    const project = activeSpace.projects.find(p => p.id === id);
    if (project) {
        project.pinned = !project.pinned;
        renderProjects();
        save();
    }
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

function openEditModal(project) {
    editingProjectId = project.id;
    document.getElementById('project-modal-title').textContent = 'Modifier le Projet';
    document.getElementById('project-name-input').value = project.name;
    document.getElementById('project-path-input').value = project.path;
    document.getElementById('project-repo-input').value = project.repoUrl || '';
    document.getElementById('project-editor-input').value = project.editor || 'code';
    document.getElementById('project-notes-input').value = project.notes || '';
    document.getElementById('confirm-project').textContent = 'Enregistrer';
    projectModal.classList.remove('hidden');
}

function closeProjectModal() {
    projectModal.classList.add('hidden');
    editingProjectId = null;
    document.getElementById('project-modal-title').textContent = 'Nouveau Projet';
    document.getElementById('project-name-input').value = '';
    document.getElementById('project-path-input').value = '';
    document.getElementById('project-repo-input').value = '';
    document.getElementById('project-editor-input').value = 'code';
    document.getElementById('project-notes-input').value = '';
    document.getElementById('confirm-project').textContent = 'Ajouter le projet';
}

// Event Listeners Setup
function setupEventListeners() {
    // Search
    projectSearch.oninput = () => renderProjects();

    // Modals
    addSpaceBtn.onclick = () => spaceModal.classList.remove('hidden');
    addProjectBtn.onclick = () => {
        editingProjectId = null;
        closeProjectModal(); // Reset fields
        projectModal.classList.remove('hidden');
    };

    document.getElementById('cancel-space').onclick = () => spaceModal.classList.add('hidden');
    document.getElementById('cancel-project').onclick = () => closeProjectModal();

    // Space Creation
    document.getElementById('confirm-space').onclick = () => {
        const name = document.getElementById('space-name-input').value.trim();
        if (name) {
            const newSpace = {
                id: Date.now().toString(),
                name: name,
                projects: []
            };
            config.spaces.push(newSpace);
            config.activeSpaceId = newSpace.id;
            renderSpaces();
            renderProjects();
            save();
            spaceModal.classList.add('hidden');
            document.getElementById('space-name-input').value = '';
        }
    };

    // Project Creation
    document.getElementById('select-path-btn').onclick = async () => {
        const path = await window.electronAPI.selectFolder();
        if (path) {
            document.getElementById('project-path-input').value = path;
            // Auto-fill name if empty
            const nameInput = document.getElementById('project-name-input');
            if (!nameInput.value) {
                nameInput.value = path.split(/[\\/]/).pop();
            }
        }
    };

    document.getElementById('confirm-project').onclick = () => {
        const name = document.getElementById('project-name-input').value.trim();
        const path = document.getElementById('project-path-input').value.trim();
        const repoUrl = document.getElementById('project-repo-input').value.trim();
        const editor = document.getElementById('project-editor-input').value.trim() || 'code';
        const notes = document.getElementById('project-notes-input').value.trim();

        if (name && path) {
            const activeSpace = config.spaces.find(s => s.id === config.activeSpaceId);

            if (editingProjectId) {
                const project = activeSpace.projects.find(p => p.id === editingProjectId);
                if (project) {
                    project.name = name;
                    project.path = path;
                    project.repoUrl = repoUrl;
                    project.editor = editor;
                    project.notes = notes;
                }
            } else {
                activeSpace.projects.push({
                    id: Date.now().toString(),
                    name,
                    path,
                    repoUrl,
                    editor,
                    notes,
                    pinned: false
                });
            }

            renderProjects();
            save();
            closeProjectModal();
        }
    };

    // Window Controls
    document.getElementById('minimize-btn').onclick = () => window.electronAPI.minimize();
    document.getElementById('maximize-btn').onclick = () => window.electronAPI.maximize();
    document.getElementById('close-btn').onclick = () => window.electronAPI.close();
}

init();
