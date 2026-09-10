import { apiDeleteTask } from './api.js';
import { openEditModal } from './modals.js';

// ==========================================================================
// UTILIDADES DE SEGURIDAD (SANITIZACIÓN CONTRA XSS)
// ==========================================================================
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// 1. ESTADO GLOBAL DE USUARIOS Y SELECTORES DESPLEGABLES
// ==========================================================================
let appUsers = [];
export const setAppUsers = (users) => { appUsers = Array.isArray(users) ? users : []; };
export const getAppUsers = () => appUsers;

export function populateUserDropdowns(users = []) {
    const userList = Array.isArray(users) ? users : [];
    const options = '<option value="">Sin asignar</option>' + 
        userList.map(u => `<option value="${escapeHTML(u.id)}">${escapeHTML(u.name)}</option>`).join('');

    ['create-assignee', 'edit-assignee'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });

    const filterSelect = document.getElementById('filter-assignee');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos</option>' +
            '<option value="unassigned">Sin asignar</option>' +
            userList.map(u => `<option value="${escapeHTML(u.id)}">${escapeHTML(u.name)}</option>`).join('');
    }
}

// ==========================================================================
// 2. REFERENCIAS A CONTENEDORES (DROPZONES)
// ==========================================================================
export const dropzones = {
    todo: document.getElementById('tasks-todo'),
    doing: document.getElementById('tasks-doing'),
    done: document.getElementById('tasks-done')
};

// ==========================================================================
// 3. CONTADORES DINÁMICOS DEL TABLERO
// ==========================================================================
export function updateCounters() {
    ['todo', 'doing', 'done'].forEach(status => {
        const dropzone = document.getElementById(`tasks-${status}`);
        if (!dropzone) return;

        // Cuenta únicamente las tarjetas que no han sido ocultadas por el filtro
        const visibleCards = Array.from(dropzone.querySelectorAll('.task-card'))
            .filter(card => card.style.display !== 'none');

        const columnCounter = document.getElementById(`counter-${status}`);
        if (columnCounter) columnCounter.textContent = visibleCards.length;
    });
}

// ==========================================================================
// 4. RENDERIZADO Y MAQUETACIÓN DE TARJETAS (CARDS)
// ==========================================================================
export function renderAllTasks(tasks = []) {
    Object.values(dropzones).forEach(zone => { if (zone) zone.innerHTML = ''; });
    tasks.forEach(task => dropzones[task.status]?.appendChild(createTaskCard(task)));
    updateCounters();
}

export function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = task.id;
    card.dataset.priority = task.priority || '';
    card.dataset.tag = task.tag || '';
    card.dataset.assigneeId = task.assigneeId || '';

    // 1. Avatar seguro
    const assigned = appUsers.find(u => String(u.id) === String(task.assigneeId));
    const avatar = assigned 
        ? `<div class="card-assignee" title="Asignado a: ${escapeHTML(assigned.name)}"><img src="${escapeHTML(assigned.avatar)}" alt="${escapeHTML(assigned.name)}" class="avatar-sm" /></div>` 
        : '';

    // 2. Etiqueta de categoría segura
    const safeTag = escapeHTML(task.tag || '');
    const tagClass = safeTag ? `tag-${safeTag.toLowerCase()}` : '';
    const tagHtml = safeTag 
        ? `<span class="tag-badge ${tagClass}">${safeTag}</span>` 
        : '';

    const safePriority = escapeHTML(task.priority || 'Baja');
    const safeTitle = escapeHTML(task.title || 'Sin título');
    const safeDesc = escapeHTML(task.description || 'Sin descripción.');
    const safeDate = escapeHTML(task.dueDate || 'Sin fecha');
    const commentsCount = Array.isArray(task.comments) ? task.comments.length : 0;

    card.innerHTML = `
        <div class="card-top">
            <div class="card-badges">
                <span class="badge badge-${safePriority.toLowerCase()}">${safePriority}</span>
                ${tagHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                ${avatar}
                <button type="button" class="card-delete-btn" title="Eliminar tarea" aria-label="Eliminar tarea">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                </button>
            </div>
        </div>
        <h3 class="card-title">${safeTitle}</h3>
        <p class="card-desc">${safeDesc}</p>
        <div class="card-footer">
            <div class="card-meta-item"><span class="material-symbols-outlined">calendar_today</span><span>${safeDate}</span></div>
            <div class="card-meta-item"><span class="material-symbols-outlined">chat_bubble</span><span>${commentsCount}</span></div>
        </div>
    `;

    // Eliminación rápida
    card.querySelector('.card-delete-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Quieres eliminar la tarea "${task.title}"?`)) {
            await apiDeleteTask(task.id);
            card.remove();
            updateCounters();
        }
    });

    card.addEventListener('click', () => openEditModal(task));
    return card;
}

// ==========================================================================
// 5. RENDERIZADO DE COMENTARIOS
// ==========================================================================
export function renderTaskComments(comments = []) {
    const list = document.getElementById('edit-comments-list');
    if (!list) return;

    list.innerHTML = comments.length === 0 
        ? '<p class="no-comments-msg">No hay comentarios aún.</p>'
        : comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${escapeHTML(c.author)}</span>
                    <span class="comment-date">${escapeHTML(c.date || '')}</span>
                </div>
                <p class="comment-text">${escapeHTML(c.text)}</p>
            </div>
        `).join('');
}

// ==========================================================================
// 6. FILTROS AVANZADOS Y BUSCADOR EN TIEMPO REAL
// ==========================================================================
export function applyFilters() {
    const searchDesk = document.getElementById('search-input');
    const searchMob = document.getElementById('search-input-mobile');
    const term = (searchDesk?.value || searchMob?.value || '').toLowerCase().trim();

    const priorityFilter = document.getElementById('filter-priority')?.value || '';
    const tagFilter = document.getElementById('filter-tag')?.value || '';
    const assigneeFilter = document.getElementById('filter-assignee')?.value || '';

    document.querySelectorAll('.task-card').forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const priority = card.dataset.priority || '';
        const tag = card.dataset.tag || '';
        const assigneeId = card.dataset.assigneeId || '';

        const matchSearch = !term || title.includes(term);
        const matchPriority = !priorityFilter || priority === priorityFilter;
        const matchTag = !tagFilter || tag.toLowerCase() === tagFilter.toLowerCase();

        let matchAssignee = true;
        if (assigneeFilter === 'unassigned') {
            matchAssignee = !assigneeId;
        } else if (assigneeFilter) {
            matchAssignee = String(assigneeId) === String(assigneeFilter);
        }

        const isVisible = matchSearch && matchPriority && matchTag && matchAssignee;
        card.style.display = isVisible ? '' : 'none';
    });

    // Actualiza los contadores de cada columna según las tarjetas que quedaron visibles
    updateCounters();
}

export function initFilters() {
    const desk = document.getElementById('search-input');
    const mob = document.getElementById('search-input-mobile');

    [desk, mob].forEach(input => input?.addEventListener('input', (e) => {
        if (desk) desk.value = e.target.value;
        if (mob) mob.value = e.target.value;
        applyFilters();
    }));

    ['filter-priority', 'filter-tag', 'filter-assignee'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', applyFilters);
    });

    document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
        if (desk) desk.value = '';
        if (mob) mob.value = '';
        const prio = document.getElementById('filter-priority');
        const tag = document.getElementById('filter-tag');
        const user = document.getElementById('filter-assignee');
        if (prio) prio.value = '';
        if (tag) tag.value = '';
        if (user) user.value = '';
        applyFilters();
    });
}

// ==========================================================================
// 7. INTERACCIONES MÓVILES (MENÚ, PESTAÑAS Y FILTROS)
// ==========================================================================
export function initMobileInteractions() {
    const btnMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const tabs = document.querySelectorAll('#mobile-column-tabs .tab-button');
    const columns = document.querySelectorAll('.kanban-column');

    const btnFilterToggle = document.getElementById('btn-toggle-filters-mobile');
    const filtersToolbar = document.getElementById('filters-toolbar');
    btnFilterToggle?.addEventListener('click', () => {
        const isHidden = filtersToolbar?.classList.toggle('mobile-hidden');
        btnFilterToggle.classList.toggle('active', !isHidden);
        const labelSpan = btnFilterToggle.querySelector('span:last-child');
        if (labelSpan) {
            labelSpan.textContent = isHidden ? 'Mostrar filtros' : 'Ocultar filtros';
        }
    });

    btnMenu?.addEventListener('click', () => mobileMenu?.classList.toggle('hidden'));

    const setTab = (status) => {
        columns.forEach(col => col.classList.toggle('mobile-hidden', col.dataset.column !== status));
    };

    tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        setTab(tab.dataset.tab);
    }));

    const handleResize = () => {
        if (window.innerWidth > 768) {
            columns.forEach(col => col.classList.remove('mobile-hidden'));
        } else {
            const active = document.querySelector('#mobile-column-tabs .tab-button.active');
            setTab(active ? active.dataset.tab : 'todo');
        }
    };

    if (window.innerWidth <= 768) setTab('todo');
    window.addEventListener('resize', handleResize);
}