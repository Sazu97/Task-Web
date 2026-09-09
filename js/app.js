import { getTasks, getUsers } from './api.js';
import { renderAllTasks, initSearch, initMobileInteractions, setAppUsers, populateUserDropdowns } from './ui.js';
import { initDragAndDrop } from './dragDrop.js';
import { initCreateModal, initEditModal, initUserModal } from './modals.js';

// ==========================================================================
// INICIALIZACIÓN Y CONSUMO DE API (GET)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        // 1. Cargar usuarios del servidor y llenar los selectores
        const users = await getUsers();
        setAppUsers(users);
        populateUserDropdowns(users);

        // 2. Cargar tareas y renderizar el tablero
        const tasks = await getTasks();
        renderAllTasks(tasks);

        // 3. Iniciar escuchadores e interacciones
        initDragAndDrop();
        initUserModal();
        initCreateModal();
        initEditModal();
        initSearch();
        initMobileInteractions();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}