import { apiCreateTask, apiUpdateTask } from './api.js';
import { dropzones, createTaskCard, updateCounters, renderTaskComments } from './ui.js';

let currentTask = null;

const statusLabels = {
    todo: 'Por Hacer',
    doing: 'En Proceso',
    done: 'Finalizado'
};

// ==========================================================================
// CREACIÓN DE TAREAS (MODAL Y POST)
// ==========================================================================
export function initCreateModal() {
    const modal = document.getElementById('create-modal');
    const btnOpen = document.getElementById('btn-open-create-modal');
    const btnClose = document.getElementById('btn-close-create-modal');
    const btnCancel = document.getElementById('btn-cancel-create');
    const form = document.getElementById('create-task-form');

    if (!modal || !btnOpen || !form) return;

    btnOpen.addEventListener('click', () => {
        form.reset();
        modal.showModal();
    });

    const closeModal = () => modal.close();
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const newTask = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            status: formData.get('status'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate') || '',
            comments: []
        };

        await createTask(newTask, modal, form);
    });
}

async function createTask(taskData, modal, form) {
    try {
        const createdTask = await apiCreateTask(taskData);

        const targetColumn = dropzones[createdTask.status];
        if (targetColumn) {
            targetColumn.appendChild(createTaskCard(createdTask));
        }

        updateCounters();
        modal.close();
        form.reset();
    } catch (error) {
        console.error('Error en POST:', error);
    }
}

// ==========================================================================
// DETALLE Y EDICIÓN DE TAREAS
// ==========================================================================
export function openEditModal(task) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    currentTask = task;

    // Rellenar datos en la vista de detalle (solo lectura)
    populateDetailView(task);

    // Rellenar los campos del formulario de edición
    populateEditForm(task);

    // Renderizar comentarios
    renderTaskComments(task.comments || []);

    // Asegurar que siempre se abra en modo lectura
    showDetailView();

    modal.showModal();
}

function populateDetailView(task) {
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-description');
    const detailPriority = document.getElementById('detail-priority');
    const detailStatus = document.getElementById('detail-status');
    const detailDate = document.getElementById('detail-due-date');

    if (detailTitle) detailTitle.textContent = task.title;
    if (detailDesc) detailDesc.textContent = task.description || 'Sin descripción añadida.';
    
    if (detailPriority) {
        detailPriority.textContent = task.priority;
        detailPriority.className = `badge badge-${task.priority.toLowerCase()}`;
    }

    if (detailStatus) {
        detailStatus.textContent = statusLabels[task.status] || task.status;
    }

    if (detailDate) {
        detailDate.textContent = task.dueDate || 'Sin fecha límite';
    }
}

function populateEditForm(task) {
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description || '';
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-due-date').value = task.dueDate || '';
}

function showDetailView() {
    const detailView = document.getElementById('task-detail-view');
    const editForm = document.getElementById('edit-task-form');
    const modalTitle = document.getElementById('modal-task-header-title');
    const btnToggle = document.getElementById('btn-toggle-edit');

    if (detailView) detailView.classList.remove('hidden');
    if (editForm) editForm.classList.add('hidden');
    if (modalTitle) modalTitle.textContent = 'Detalles de la Tarea';
    if (btnToggle) {
        btnToggle.style.display = 'flex';
        btnToggle.title = 'Editar tarea';
    }
}

function showEditForm() {
    const detailView = document.getElementById('task-detail-view');
    const editForm = document.getElementById('edit-task-form');
    const modalTitle = document.getElementById('modal-task-header-title');
    const btnToggle = document.getElementById('btn-toggle-edit');

    if (detailView) detailView.classList.add('hidden');
    if (editForm) editForm.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Editar Tarea';
    if (btnToggle) {
        btnToggle.style.display = 'none'; // Ocultar lápiz mientras se está editando
    }
}

export function initEditModal() {
    const modal = document.getElementById('edit-modal');
    const btnClose = document.getElementById('btn-close-edit-modal');
    const btnCancel = document.getElementById('btn-cancel-edit');
    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    const form = document.getElementById('edit-task-form');
    const commentForm = document.getElementById('add-comment-form');

    if (!modal) return;

    const closeModal = () => modal.close();
    if (btnClose) btnClose.addEventListener('click', closeModal);

    // Botón lápiz: conmuta a vista de formulario
    if (btnToggleEdit) {
        btnToggleEdit.addEventListener('click', () => {
            showEditForm();
        });
    }

    // Botón cancelar del formulario: vuelve a la vista de detalle sin cerrar el modal
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            if (currentTask) populateEditForm(currentTask);
            showDetailView();
        });
    }

    // Guardar cambios editados (PATCH)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const taskId = formData.get('id');

            const updatedFields = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim(),
                status: formData.get('status'),
                priority: formData.get('priority'),
                dueDate: formData.get('dueDate') || ''
            };

            await updateTaskData(taskId, updatedFields);
        });
    }

    // Publicar comentario
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentTask) return;

            const authorInput = document.getElementById('comment-author-input');
            const textInput = document.getElementById('comment-text-input');

            const newComment = {
                author: authorInput.value.trim(),
                text: textInput.value.trim(),
                date: new Date().toLocaleDateString('es-ES')
            };

            const updatedComments = [...(currentTask.comments || []), newComment];

            try {
                const updatedTask = await apiUpdateTask(currentTask.id, { comments: updatedComments });
                currentTask = updatedTask;

                renderTaskComments(currentTask.comments);
                textInput.value = '';

                // Actualizar contador en la tarjeta del tablero
                const oldCard = document.querySelector(`.task-card[data-id="${updatedTask.id}"]`);
                if (oldCard) {
                    const newCard = createTaskCard(updatedTask);
                    oldCard.replaceWith(newCard);
                }
            } catch (error) {
                console.error('Error al añadir comentario:', error);
            }
        });
    }
}

async function updateTaskData(id, updatedFields) {
    try {
        const updatedTask = await apiUpdateTask(id, updatedFields);
        currentTask = updatedTask;

        // Actualizar la vista de detalle con los nuevos datos y volver a ella
        populateDetailView(updatedTask);
        showDetailView();

        // Reemplazar la tarjeta en el tablero
        const oldCard = document.querySelector(`.task-card[data-id="${id}"]`);
        if (oldCard) oldCard.remove();

        const newCard = createTaskCard(updatedTask);
        if (dropzones[updatedTask.status]) {
            dropzones[updatedTask.status].appendChild(newCard);
        }

        updateCounters();
    } catch (error) {
        console.error('Error en PATCH de edición:', error);
    }
}