import { getTasks, getUsers } from './api.js';
import { renderAllTasks, initFilters, initMobileInteractions, setAppUsers, populateUserDropdowns } from './ui.js';
import { initDragAndDrop } from './dragDrop.js';
import { initCreateModal, initEditModal, initUserModal } from './modals.js';

// ==========================================================================
// INICIALIZACIÓN Y CONSUMO DE API (GET)
// ==========================================================================
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    try {
        // 1. Carga paralela de usuarios y tareas desde la API
        const [users, tasks] = await Promise.all([
            getUsers(),
            getTasks()
        ]);

        // 2. Establecer usuarios y maquetar selectores
        setAppUsers(users);
        populateUserDropdowns(users);

        // 3. Renderizar el tablero con las tareas obtenidas
        renderAllTasks(tasks);

        // 4. Iniciar eventos del DOM, filtros, modales y drag & drop
        initDragAndDrop();
        initUserModal();
        initCreateModal();
        initEditModal();
        initFilters();
        initMobileInteractions();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}