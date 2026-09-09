// ==========================================================================
// CONFIGURACIÓN Y SELECTORES BASE / API
// ==========================================================================
const API_URL = 'http://localhost:3000/tasks';

export async function getTasks() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al conectar con la API');
    return await response.json();
}

export async function apiCreateTask(taskData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Error al guardar la nueva tarea');
    return await response.json();
}

export async function apiUpdateStatus(id, newStatus) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (!response.ok) throw new Error('Error al actualizar el estado de la tarea');
    return await response.json();
}

export async function apiUpdateTask(id, updatedFields) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
    });
    if (!response.ok) throw new Error('Error al actualizar la tarea');
    return await response.json();
}

export async function apiDeleteTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('No se pudo eliminar la tarea en el servidor');
    return await response.json();
}


// USERS API
const USERS_URL = 'http://localhost:3000/users';

export async function getUsers() {
    const response = await fetch(USERS_URL);
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return await response.json();
}

export async function apiCreateUser(userData) {
    const response = await fetch(USERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Error al registrar el usuario');
    return await response.json();
}