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
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    }
}

// Vacía dropzones y distribuye las tarjetas según su estado
function renderAllTasks(tasks) {
    Object.values(dropzones).forEach(zone => (zone.innerHTML = ''));

    tasks.forEach(task => {
        const cardElement = createTaskCard(task);
        if (dropzones[task.status]) {
            dropzones[task.status].appendChild(cardElement);
        }
    });

    updateCounters();
}

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