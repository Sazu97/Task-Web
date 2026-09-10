import { apiCreateTask, apiUpdateTask, apiCreateUser } from './api.js';
import { 
    dropzones, 
    createTaskCard, 
    updateCounters, 
    renderTaskComments, 
    getAppUsers, 
    setAppUsers, 
    populateUserDropdowns 
} from './ui.js';

// ==========================================================================
// 1. ESTADO LOCAL Y CONFIGURACIÓN GENERAL
// ==========================================================================
let currentTask = null;
const statusLabels = { todo: 'Por Hacer', doing: 'En Proceso', done: 'Finalizado' };

/**
 * Enlaza apertura y cierre para cualquier elemento <dialog> nativo.
 */
function bindModalControls(modalId, btnOpenId, btnCloseId, btnCancelId) {
    const modal = document.getElementById(modalId);
    if (!modal) return null;
    document.getElementById(btnOpenId)?.addEventListener('click', () => modal.showModal());
    [btnCloseId, btnCancelId].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => modal.close());
    });
    return modal;
}

// ==========================================================================
// 2. MODAL DE USUARIOS (POST /users)
// ==========================================================================
export function initUserModal() {
    const modal = bindModalControls('user-modal', 'btn-open-user-modal', 'btn-close-user-modal', 'btn-cancel-user');
    const form = document.getElementById('create-user-form');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const avatar = data.avatar?.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`;

        const newUser = await apiCreateUser({ name: data.name.trim(), avatar });
        const users = [...getAppUsers(), newUser];
        setAppUsers(users);
        populateUserDropdowns(users);

        modal.close();
        form.reset();
    });
}

// ==========================================================================
// 3. MODAL DE CREACIÓN DE TAREAS (POST /tasks)
// ==========================================================================
export function initCreateModal() {
    const modal = bindModalControls('create-modal', 'btn-open-create-modal', 'btn-close-create-modal', 'btn-cancel-create');
    const form = document.getElementById('create-task-form');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const createdTask = await apiCreateTask({ ...data, comments: [] });

        dropzones[createdTask.status]?.appendChild(createTaskCard(createdTask));
        updateCounters();
        modal.close();
        form.reset();
    });
}

// ==========================================================================
// 4. VISTA DETALLE Y ALTERNANCIA EDICIÓN (READ-ONLY / FORM)
// ==========================================================================
export function openEditModal(task) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    currentTask = task;

    // Poblar campos de la vista de solo lectura
    document.getElementById('detail-title').textContent = task.title;
    document.getElementById('detail-description').textContent = task.description || 'Sin descripción añadida.';
    document.getElementById('detail-due-date').textContent = task.dueDate || 'Sin fecha límite';
    
    const prio = document.getElementById('detail-priority');
    if (prio) {
        prio.textContent = task.priority;
        prio.className = `badge badge-${task.priority.toLowerCase()}`;
    }
    document.getElementById('detail-status').textContent = statusLabels[task.status] || task.status;

    // Renderizar avatar y nombre del responsable en el detalle
    const assigned = getAppUsers().find(u => String(u.id) === String(task.assigneeId));
    document.getElementById('detail-assignee-wrap').innerHTML = assigned 
        ? `<div class="detail-assignee-box"><img src="${assigned.avatar}" alt="${assigned.name}" class="avatar-md" /><span class="assignee-name">${assigned.name}</span></div>`
        : '<span class="detail-text" style="padding: 0.35rem 0.6rem;">Sin asignar</span>';

    // Rellenar formulario de edición automáticamente
    const form = document.getElementById('edit-task-form');
    if (form) {
        ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'].forEach(k => {
            if (form.elements[k]) form.elements[k].value = task[k] || '';
        });
    }

    renderTaskComments(task.comments || []);
    toggleEditView(false); // Iniciar siempre en modo solo lectura
    modal.showModal();
}

/**
 * Conmuta entre el panel de lectura y el formulario editable.
 */
function toggleEditView(isEditing) {
    document.getElementById('task-detail-view')?.classList.toggle('hidden', isEditing);
    document.getElementById('edit-task-form')?.classList.toggle('hidden', !isEditing);
    document.getElementById('modal-task-header-title').textContent = isEditing ? 'Editar Tarea' : 'Detalles de la Tarea';
    const btnEdit = document.getElementById('btn-toggle-edit');
    if (btnEdit) btnEdit.style.display = isEditing ? 'none' : 'flex';
}

// ==========================================================================
// 5. CONTROLADORES DE EDICIÓN Y COMENTARIOS
// ==========================================================================
export function initEditModal() {
    const modal = document.getElementById('edit-modal');
    document.getElementById('btn-close-edit-modal')?.addEventListener('click', () => modal?.close());
    document.getElementById('btn-toggle-edit')?.addEventListener('click', () => toggleEditView(true));
    document.getElementById('btn-cancel-edit')?.addEventListener('click', () => toggleEditView(false));

    // Guardar cambios editados (PATCH /tasks/:id)
    const form = document.getElementById('edit-task-form');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const updated = await apiUpdateTask(data.id, data);
        currentTask = updated;

        openEditModal(updated);
        document.querySelector(`.task-card[data-id="${updated.id}"]`)?.replaceWith(createTaskCard(updated));
        if (dropzones[updated.status] && !document.querySelector(`.task-card[data-id="${updated.id}"]`)) {
            dropzones[updated.status].appendChild(createTaskCard(updated));
        }
        updateCounters();
    });

    // Añadir nuevo comentario (PATCH /tasks/:id -> comments)
    const commentForm = document.getElementById('add-comment-form');
    commentForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentTask) return;

        const author = document.getElementById('comment-author-input');
        const text = document.getElementById('comment-text-input');
        const comments = [...(currentTask.comments || []), {
            author: author.value.trim(),
            text: text.value.trim(),
            date: new Date().toLocaleDateString('es-ES')
        }];

        const updated = await apiUpdateTask(currentTask.id, { comments });
        currentTask = updated;
        renderTaskComments(updated.comments);
        text.value = '';

        document.querySelector(`.task-card[data-id="${updated.id}"]`)?.replaceWith(createTaskCard(updated));
    });
}