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
                // Solo persistimos si la tarjeta ha cambiado efectivamente de columna
                if (evt.from !== evt.to) {
                    const taskId = evt.item.dataset.id;
                    const newStatus = evt.to.dataset.status || evt.to.id.replace('tasks-', '');

                    // Actualización inmediata en la interfaz
                    updateCounters();

                    try {
                        await apiUpdateStatus(taskId, newStatus);
                    } catch (error) {
                        console.error('Error al actualizar estado en el servidor:', error);
                        // Reversión visual si la petición falla
                        evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex] || null);
                        updateCounters();
                        alert('No se pudo guardar el cambio de estado. La tarjeta ha vuelto a su columna.');
                    }
                }
            }
        });
    });
}