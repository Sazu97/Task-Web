import { getTasks } from './api.js';
import { renderAllTasks, initSearch } from './ui.js'; // <-- Añadido aquí
import { initDragAndDrop } from './dragDrop.js';
import { initCreateModal, initEditModal } from './modals.js';

// ==========================================================================
// INICIALIZACIÓN Y CONSUMO DE API (GET)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        const tasks = await getTasks();
        renderAllTasks(tasks);
        initDragAndDrop();
        initCreateModal();
        initEditModal();
        initSearch();
    } catch (error) {
        console.error('Error al cargar las tareas:', error);
    }
}