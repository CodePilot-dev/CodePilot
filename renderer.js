// State Management
let config = {
    spaces: [{ id: 'default', name: 'Général', projects: [] }],
    activeSpaceId: 'default'
};
let editingProjectId = null;
let currentDetailProject = null;

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
const addSpaceBtn = document.getElementById('add-space-btn');
const addProjectBtn = document.getElementById('add-project-btn');
const addProjectUpdateBtn = document.getElementById('add-project-update-btn');

// Detail Elements
const detailName = document.getElementById('detail-name');
const detailPath = document.getElementById('detail-path');
const detailBadges = document.getElementById('detail-badges');
const detailNotes = document.getElementById('detail-notes');
const detailScriptsList = document.getElementById('detail-scripts-list');
const detailUpdatesList = document.getElementById('detail-updates-list');
const detailEditorName = document.getElementById('detail-editor-name');

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
            <button class="pin-project ${project.pinned ? 'active' : ''}" title="${project.pinned ? 'Désépingler' : 'Épingler'}">
                ${project.pinned ? '★' : '☆'}
            </button>
            <button class="edit-project" title="Modifier le projet">✎</button>
            <button class="delete-project" title="Supprimer le projet">✕</button>
        </div>
        <div class="project-info">
            <div class="project-title-row">
                <h3>${project.name}</h3>
                ${framework ? `<span class="fw-badge ${framework.id}">${framework.name}</span>` : ''}
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
    detailEditorName.textContent = project.editor || 'VS Code';

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
    if (project.repoUrl) {
        gitBtn.classList.remove('hidden');
        gitBtn.onclick = () => window.electronAPI.openExternal(project.repoUrl);
    } else {
        gitBtn.classList.add('hidden');
    }

    detailModal.classList.remove('hidden');
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
        item.className = 'update-item-mini';
        item.innerHTML = `
            <div class="update-header">
                <h5>${update.title}</h5>
                <span class="update-status-tag">À venir</span>
            </div>
            <p>${update.description}</p>
            <span class="update-date">Prévu le ${new Date(update.id).toLocaleDateString()}</span>
        `;
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

// Event Listeners
function setupEventListeners() {
    projectSearch.oninput = () => renderProjects();
    addSpaceBtn.onclick = () => spaceModal.classList.remove('hidden');
    addProjectBtn.onclick = () => {
        editingProjectId = null;
        document.getElementById('project-name-input').value = '';
        document.getElementById('project-path-input').value = '';
        document.getElementById('project-repo-input').value = '';
        document.getElementById('project-editor-input').value = 'code';
        document.getElementById('project-notes-input').value = '';
        document.getElementById('confirm-project').textContent = 'Ajouter le projet';
        projectModal.classList.remove('hidden');
    };

    addProjectUpdateBtn.onclick = () => updateModal.classList.remove('hidden');

    document.getElementById('cancel-space').onclick = () => spaceModal.classList.add('hidden');
    document.getElementById('cancel-project').onclick = () => projectModal.classList.add('hidden');
    document.getElementById('cancel-update').onclick = () => updateModal.classList.add('hidden');
    document.getElementById('close-detail').onclick = () => detailModal.classList.add('hidden');

    document.getElementById('confirm-update').onclick = () => {
        const title = document.getElementById('update-title-input').value.trim();
        const description = document.getElementById('update-desc-input').value.trim();
        if (title && description && currentDetailProject) {
            if (!currentDetailProject.updates) currentDetailProject.updates = [];
            currentDetailProject.updates.push({ id: Date.now(), title, description });
            save();
            renderProjectUpdates();
            updateModal.classList.add('hidden');
            document.getElementById('update-title-input').value = '';
            document.getElementById('update-desc-input').value = '';
            showToast("MAJ programmée !", `Pour ${currentDetailProject.name}`);
        }
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
            if (editingProjectId) {
                config.spaces.forEach(s => {
                    const p = s.projects.find(proj => proj.id === editingProjectId);
                    if (p) {
                        p.name = name; p.path = path; p.repoUrl = repoUrl;
                        p.editor = editor; p.notes = notes;
                    }
                });
            } else {
                const spaceId = config.activeSpaceId === 'all' ? 'default' : config.activeSpaceId;
                const space = config.spaces.find(s => s.id === spaceId);
                if (space) space.projects.push({ id: Date.now().toString(), name, path, repoUrl, editor, notes, pinned: false, updates: [] });
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
