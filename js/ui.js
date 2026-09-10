import { apiDeleteTask } from './api.js';
import { openEditModal } from './modals.js';

// ==========================================================================
// 1. ESTADO GLOBAL DE USUARIOS Y SELECTORES DESPLEGABLES
// ==========================================================================
let appUsers = [];
export const setAppUsers = (users) => { appUsers = users; };
export const getAppUsers = () => appUsers;


//Llena las opciones de los <select> de creación y edición con los usuarios del backend.
export function populateUserDropdowns(users) {
    const options = '<option value="">Sin asignar</option>' + 
        users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    ['create-assignee', 'edit-assignee'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });

    // Desplegable del filtro superior
    const filterSelect = document.getElementById('filter-assignee');
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos</option>' +
            '<option value="unassigned">Sin asignar</option>' +
            users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
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
        const count = document.querySelectorAll(`#tasks-${status} .task-card`).length;
        const columnCounter = document.getElementById(`counter-${status}`);
        if (columnCounter) columnCounter.textContent = count;
    });
}

// ==========================================================================
// 4. RENDERIZADO Y MAQUETACIÓN DE TARJETAS (CARDS)
// ==========================================================================
export function renderAllTasks(tasks) {
    Object.values(dropzones).forEach(zone => { if (zone) zone.innerHTML = ''; });
    tasks.forEach(task => dropzones[task.status]?.appendChild(createTaskCard(task)));
    updateCounters();
}

export function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = task.id;
    // Guardamos los datos de filtrado como atributos HTML
    card.dataset.priority = task.priority || '';
    card.dataset.tag = task.tag || '';
    card.dataset.assigneeId = task.assigneeId || '';

    // 1. Avatar de usuario asignado (si existe)
    const assigned = appUsers.find(u => String(u.id) === String(task.assigneeId));
    const avatar = assigned 
        ? `<div class="card-assignee" title="Asignado a: ${assigned.name}"><img src="${assigned.avatar}" alt="${assigned.name}" class="avatar-sm" /></div>` 
        : '';

    // 2. Pastilla de etiqueta coloreada (si existe en la tarea)
    const tagClass = task.tag ? `tag-${task.tag.toLowerCase()}` : '';
    const tagHtml = task.tag 
        ? `<span class="tag-badge ${tagClass}">${task.tag}</span>` 
        : '';

    card.innerHTML = `
        <div class="card-top">
            <div class="card-badges">
                <span class="badge badge-${task.priority.toLowerCase()}">${task.priority}</span>
                ${tagHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                ${avatar}
                <button type="button" class="card-delete-btn" title="Eliminar tarea" aria-label="Eliminar tarea">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                </button>
            </div>
        </div>
        <h3 class="card-title">${task.title}</h3>
        <p class="card-desc">${task.description || 'Sin descripción.'}</p>
        <div class="card-footer">
            <div class="card-meta-item"><span class="material-symbols-outlined">calendar_today</span><span>${task.dueDate || 'Sin fecha'}</span></div>
            <div class="card-meta-item"><span class="material-symbols-outlined">chat_bubble</span><span>${task.comments?.length || 0}</span></div>
        </div>
    `;

    // Escuchador para eliminación rápida (DELETE /tasks/:id)
    card.querySelector('.card-delete-btn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Quieres eliminar la tarea "${task.title}"?`)) {
            await apiDeleteTask(task.id);
            card.remove();
            updateCounters();
        }
    });

    // Abrir vista detalle al hacer clic sobre la tarjeta
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
                    <span class="comment-author">${c.author}</span>
                    <span class="comment-date">${c.date || ''}</span>
                </div>
                <p class="comment-text">${c.text}</p>
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

        // 1. Condición de texto (título)
        const matchSearch = !term || title.includes(term);

        // 2. Condición de prioridad
        const matchPriority = !priorityFilter || priority === priorityFilter;

        // 3. Condición de categoría / tag
        const matchTag = !tagFilter || tag.toLowerCase() === tagFilter.toLowerCase();

        // 4. Condición de responsable (soporta 'unassigned' o ID de usuario)
        let matchAssignee = true;
        if (assigneeFilter === 'unassigned') {
            matchAssignee = !assigneeId;
        } else if (assigneeFilter) {
            matchAssignee = String(assigneeId) === String(assigneeFilter);
        }

        // Mostrar solo si cumple las 4 condiciones a la vez
        const isVisible = matchSearch && matchPriority && matchTag && matchAssignee;
        card.style.display = isVisible ? '' : 'none';
    });
}

export function initFilters() {
    const desk = document.getElementById('search-input');
    const mob = document.getElementById('search-input-mobile');

    // Sincronizar buscadores de texto (escritorio y móvil)
    [desk, mob].forEach(input => input?.addEventListener('input', (e) => {
        if (desk) desk.value = e.target.value;
        if (mob) mob.value = e.target.value;
        applyFilters();
    }));

    // Escuchar cambios en los selectores desplegables
    ['filter-priority', 'filter-tag', 'filter-assignee'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', applyFilters);
    });

    // Botón de reset: restablece todos los controles y vuelve a mostrar todo
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

// Alias para mantener compatibilidad si app.js invoca initSearch()
export const initSearch = initFilters;

// ==========================================================================
// 7. INTERACCIONES MÓVILES (MENÚ, PESTAÑAS Y FILTROS)
// ==========================================================================
export function initMobileInteractions() {
    const btnMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const tabs = document.querySelectorAll('#mobile-column-tabs .tab-button');
    const columns = document.querySelectorAll('.kanban-column');

    // Desplegable de filtros en móvil
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