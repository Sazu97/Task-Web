import { apiUpdateStatus } from './api.js';
import { dropzones, updateCounters } from './ui.js';

// ==========================================================================
// DRAG & DROP (SORTABLEJS)
// ==========================================================================
export function initDragAndDrop() {
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
                    try {
                        await apiUpdateStatus(taskId, newStatus);
                    } catch (error) {
                        console.error('Error en PATCH:', error);
                    }
                }
            }
        });
    });
}