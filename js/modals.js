import { apiCreateTask, apiUpdateTask } from './api.js';
import { dropzones, createTaskCard, updateCounters, renderTaskComments } from './ui.js';

// Tarea actualmente seleccionada en el modal de edición
let currentTask = null;

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

    // Abrir modal nativo
    btnOpen.addEventListener('click', () => {
        form.reset();
        modal.showModal();
    });

    // Cerrar modal
    const closeModal = () => modal.close();
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Enviar formulario (POST)
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

        // Insertar en la columna correspondiente
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
// EDICIÓN DE TAREAS (MODAL Y PATCH)
// ==========================================================================
export function openEditModal(task) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    currentTask = task;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description || '';
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-due-date').value = task.dueDate || '';

    // Renderizar los comentarios de la tarea seleccionada
    renderTaskComments(task.comments || []);

    modal.showModal();
}

export function initEditModal() {
    const modal = document.getElementById('edit-modal');
    const btnClose = document.getElementById('btn-close-edit-modal');
    const btnCancel = document.getElementById('btn-cancel-edit');
    const form = document.getElementById('edit-task-form');
    const commentForm = document.getElementById('add-comment-form');

    if (!modal) return;

    const closeModal = () => modal.close();
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Guardar cambios en los datos de la tarea
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

            await updateTaskData(taskId, updatedFields, modal);
        });
    }

    // Publicar nuevo comentario
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

                // Actualizar tarjeta en el tablero reemplazando el elemento existente
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

async function updateTaskData(id, updatedFields, modal) {
    try {
        const updatedTask = await apiUpdateTask(id, updatedFields);
        currentTask = updatedTask;

        // Reemplazar la tarjeta en el DOM
        const oldCard = document.querySelector(`.task-card[data-id="${id}"]`);
        if (oldCard) oldCard.remove();

        const newCard = createTaskCard(updatedTask);
        if (dropzones[updatedTask.status]) {
            dropzones[updatedTask.status].appendChild(newCard);
        }

        updateCounters();
        modal.close();
    } catch (error) {
        console.error('Error en PATCH de edición:', error);
    }
}