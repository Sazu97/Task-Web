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
        console.log('Tareas obtenidas del servidor:', tasks);
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    }
}