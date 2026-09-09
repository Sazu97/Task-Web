import { apiDeleteTask } from './api.js';
import { openEditModal } from './modals.js';

// ==========================================================================
// ESTADO LOCAL DE USUARIOS Y SELECTORES DESPLEGABLES
// ==========================================================================
let appUsers = [];

export function setAppUsers(users) {
    appUsers = users;
}

export function getAppUsers() {
    return appUsers;
}

export function populateUserDropdowns(users) {
    const createSelect = document.getElementById('create-assignee');
    const editSelect = document.getElementById('edit-assignee');

    const optionsHtml = '<option value="">Sin asignar</option>' + 
        users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    if (createSelect) createSelect.innerHTML = optionsHtml;
    if (editSelect) editSelect.innerHTML = optionsHtml;
}

// ==========================================================================
// CONFIGURACIÓN Y SELECTORES BASE
// ==========================================================================
export const dropzones = {
    todo: document.getElementById('tasks-todo'),
    doing: document.getElementById('tasks-doing'),
    done: document.getElementById('tasks-done')
};

// ==========================================================================
// CÁLCULO DE CONTADORES
// ==========================================================================
export function updateCounters() {
    const todoCount = document.querySelectorAll('#tasks-todo .task-card').length;
    const doingCount = document.querySelectorAll('#tasks-doing .task-card').length;
    const doneCount = document.querySelectorAll('#tasks-done .task-card').length;

    const countTodo = document.getElementById('counter-todo');
    const countDoing = document.getElementById('counter-doing');
    const countDone = document.getElementById('counter-done');

    if (countTodo) countTodo.textContent = todoCount;
    if (countDoing) countDoing.textContent = doingCount;
    if (countDone) countDone.textContent = doneCount;

    const statTodo = document.getElementById('stat-todo');
    const statDoing = document.getElementById('stat-doing');
    const statDone = document.getElementById('stat-done');

    if (statTodo) statTodo.textContent = todoCount;
    if (statDoing) statDoing.textContent = doingCount;
    if (statDone) statDone.textContent = doneCount;

    const statTodoMob = document.getElementById('stat-todo-mobile');
    const statDoingMob = document.getElementById('stat-doing-mobile');
    const statDoneMob = document.getElementById('stat-done-mobile');

    if (statTodoMob) statTodoMob.textContent = todoCount;
    if (statDoingMob) statDoingMob.textContent = doingCount;
    if (statDoneMob) statDoneMob.textContent = doneCount;
}

// ==========================================================================
// TARJETAS DE TAREAS
// ==========================================================================
export function renderAllTasks(tasks) {
    Object.values(dropzones).forEach(zone => {
        if (zone) zone.innerHTML = '';
    });

    tasks.forEach(task => {
        const cardElement = createTaskCard(task);
        if (dropzones[task.status]) {
            dropzones[task.status].appendChild(cardElement);
        }
    });

    updateCounters();
}

export function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = task.id;

    const priorityClass = `badge-${task.priority.toLowerCase()}`;
    const commentsCount = task.comments ? task.comments.length : 0;
    const formattedDate = task.dueDate || 'Sin fecha';

    // Buscar si la tarea tiene responsable asignado para pintar su avatar
    const assignedUser = appUsers.find(u => String(u.id) === String(task.assigneeId));
    const userAvatarHtml = assignedUser
        ? `<div class="card-assignee" title="Asignado a: ${assignedUser.name}">
             <img src="${assignedUser.avatar}" alt="${assignedUser.name}" class="avatar-sm" />
           </div>`
        : '';

    card.innerHTML = `
    <div class="card-top">
        <span class="badge ${priorityClass}">${task.priority}</span>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${userAvatarHtml}
            <button type="button" class="card-delete-btn" title="Eliminar tarea" aria-label="Eliminar tarea">
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
            </button>
        </div>
    </div>
    <h3 class="card-title">${task.title}</h3>
    <p class="card-desc">${task.description || 'Sin descripción.'}</p>
    <div class="card-footer">
        <div class="card-meta-item">
            <span class="material-symbols-outlined">calendar_today</span>
            <span>${formattedDate}</span>
        </div>
        <div class="card-meta-item">
            <span class="material-symbols-outlined">chat_bubble</span>
            <span>${commentsCount}</span>
        </div>
    </div>
    `;

    const deleteBtn = card.querySelector('.card-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmDelete = confirm(`¿Quieres eliminar la tarea "${task.title}"?`);
            if (confirmDelete) {
                await deleteTask(task.id, card);
            }
        });
    }

    card.addEventListener('click', () => {
        openEditModal(task);
    });

    return card;
}

export function renderTaskComments(comments) {
    const list = document.getElementById('edit-comments-list');
    if (!list) return;

    list.innerHTML = '';

    if (comments.length === 0) {
        list.innerHTML = '<p class="no-comments-msg">No hay comentarios aún.</p>';
        return;
    }

    comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment-item';
        commentEl.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${comment.date || ''}</span>
            </div>
            <p class="comment-text">${comment.text}</p>
        `;
        list.appendChild(commentEl);
    });
}

async function deleteTask(id, cardElement) {
    try {
        await apiDeleteTask(id);
        cardElement.remove();
        updateCounters();
    } catch (error) {
        console.error('Error en DELETE:', error);
    }
}

// ==========================================================================
// FILTRO DE BÚSQUEDA EN TIEMPO REAL
// ==========================================================================
export function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-input-mobile');

    function filterCards(query) {
        const term = query.trim().toLowerCase();
        const cards = document.querySelectorAll('.task-card');

        cards.forEach(card => {
            const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            card.style.display = title.includes(term) ? '' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchInputMobile) searchInputMobile.value = e.target.value;
            filterCards(e.target.value);
        });
    }

    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', (e) => {
            if (searchInput) searchInput.value = e.target.value;
            filterCards(e.target.value);
        });
    }
}

// ==========================================================================
// INTERACCIÓN MÓVIL (MENÚ HAMBURGUESA Y PESTAÑAS)
// ==========================================================================
export function initMobileInteractions() {
    const btnMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const tabs = document.querySelectorAll('#mobile-column-tabs .tab-button');
    const columns = document.querySelectorAll('.kanban-column');

    if (btnMenu && mobileMenu) {
        btnMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    function applyMobileTab(selectedStatus) {
        columns.forEach(col => {
            const colStatus = col.dataset.column;
            if (colStatus === selectedStatus) {
                col.classList.remove('mobile-hidden');
            } else {
                col.classList.add('mobile-hidden');
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTab = tab.dataset.tab;
            applyMobileTab(targetTab);
        });
    });

    if (window.innerWidth <= 768) {
        applyMobileTab('todo');
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            columns.forEach(col => col.classList.remove('mobile-hidden'));
        } else {
            const activeTab = document.querySelector('#mobile-column-tabs .tab-button.active');
            applyMobileTab(activeTab ? activeTab.dataset.tab : 'todo');
        }
    });
}