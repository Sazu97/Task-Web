// ==========================================================================
// CONFIGURACIÓN Y SELECTORES BASE
// ==========================================================================
const API_URL = 'http://localhost:3000/tasks';

// Contenedores de cada columna
const dropzones = {
    todo: document.getElementById('tasks-todo'),
    doing: document.getElementById('tasks-doing'),
    done: document.getElementById('tasks-done')
};

// ==========================================================================
// INICIALIZACIÓN Y CONSUMO DE API (GET)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al conectar con la API');
        const tasks = await response.json();
        renderAllTasks(tasks);
        initDragAndDrop();
        initCreateModal();
        initEditModal();
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    }
}

// Vacía dropzones y distribuye las tarjetas según su estado
function renderAllTasks(tasks) {
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

// ==========================================================================
// TARJETAS DE TAREAS
// ==========================================================================

// Crea la estructura HTML de cada tarjeta
function createTaskCard(task) {
    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = task.id;

    const priorityClass = `badge-${task.priority.toLowerCase()}`;
    const commentsCount = task.comments ? task.comments.length : 0;
    const formattedDate = task.dueDate || 'Sin fecha';

    card.innerHTML = `
    <div class="card-top">
        <span class="badge ${priorityClass}">${task.priority}</span>
        <button type="button" class="card-delete-btn" title="Eliminar tarea" aria-label="Eliminar tarea">
        <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
        </button>
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

    // Escuchar el clic para borrar la tarea
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

    // Escuchar el clic sobre la tarjeta para abrir edición
    card.addEventListener('click', () => {
        openEditModal(task);
    });

    return card;
}

// ==========================================================================
// CÁLCULO DE CONTADORES
// ==========================================================================
function updateCounters() {
    const todoCount = document.querySelectorAll('#tasks-todo .task-card').length;
    const doingCount = document.querySelectorAll('#tasks-doing .task-card').length;
    const doneCount = document.querySelectorAll('#tasks-done .task-card').length;

    // Contadores de cada columna
    const countTodo = document.getElementById('counter-todo');
    const countDoing = document.getElementById('counter-doing');
    const countDone = document.getElementById('counter-done');

    if (countTodo) countTodo.textContent = todoCount;
    if (countDoing) countDoing.textContent = doingCount;
    if (countDone) countDone.textContent = doneCount;

    // Contadores de la barra superior (Escritorio)
    const statTodo = document.getElementById('stat-todo');
    const statDoing = document.getElementById('stat-doing');
    const statDone = document.getElementById('stat-done');

    if (statTodo) statTodo.textContent = todoCount;
    if (statDoing) statDoing.textContent = doingCount;
    if (statDone) statDone.textContent = doneCount;

    // Contadores de la barra superior (Móvil)
    const statTodoMob = document.getElementById('stat-todo-mobile');
    const statDoingMob = document.getElementById('stat-doing-mobile');
    const statDoneMob = document.getElementById('stat-done-mobile');

    if (statTodoMob) statTodoMob.textContent = todoCount;
    if (statDoingMob) statDoingMob.textContent = doingCount;
    if (statDoneMob) statDoneMob.textContent = doneCount;
}

// ==========================================================================
// DRAG & DROP (SORTABLEJS)
// ==========================================================================
function initDragAndDrop() {
    const columns = [dropzones.todo, dropzones.doing, dropzones.done];

    columns.forEach(column => {
        if (!column) return;

        new Sortable(column, {
            group: 'kanban-board',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async (evt) => {
                // Solo guardamos si la tarjeta ha cambiado de columna
                if (evt.from !== evt.to) {
                    const taskId = evt.item.dataset.id;
                    const newStatus = evt.to.dataset.status;

                    // Actualizar contadores inmediatamente en la interfaz
                    updateCounters();

                    // Persistir el cambio en json-server
                    await updateTaskStatus(taskId, newStatus);
                }
            }
        });
    });
}

// Envía la petición PATCH con el nuevo estado de la tarea
async function updateTaskStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado de la tarea');
        }
    } catch (error) {
        console.error('Error en PATCH:', error);
    }
}

// ==========================================================================
// CREACIÓN DE TAREAS (MODAL Y POST)
// ==========================================================================
function initCreateModal() {
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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) throw new Error('Error al guardar la nueva tarea');

        const createdTask = await response.json();

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
function openEditModal(task) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-title').value = task.title;
    document.getElementById('edit-description').value = task.description || '';
    document.getElementById('edit-status').value = task.status;
    document.getElementById('edit-priority').value = task.priority;
    document.getElementById('edit-due-date').value = task.dueDate || '';

    modal.showModal();
}

function initEditModal() {
    const modal = document.getElementById('edit-modal');
    const btnClose = document.getElementById('btn-close-edit-modal');
    const btnCancel = document.getElementById('btn-cancel-edit');
    const form = document.getElementById('edit-task-form');

    if (!modal || !form) return;

    const closeModal = () => modal.close();
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

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

async function updateTaskData(id, updatedFields, modal) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
        });

        if (!response.ok) throw new Error('Error al actualizar la tarea');

        const updatedTask = await response.json();

        // Reemplazar la tarjeta vieja en el DOM
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

// ==========================================================================
// ELIMINACIÓN DE TAREAS (DELETE)
// ==========================================================================
async function deleteTask(id, cardElement) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('No se pudo eliminar la tarea en el servidor');
        }

        // Quitar la tarjeta visualmente y recalcular métricas
        cardElement.remove();
        updateCounters();
    } catch (error) {
        console.error('Error en DELETE:', error);
    }
}