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