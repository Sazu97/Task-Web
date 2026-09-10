const BASE = 'http://localhost:3000';

async function req(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : null
    };

    const res = await fetch(`${BASE}${endpoint}`, options);

    if (!res.ok) {
        throw new Error(`Error en API (${res.status}): ${res.statusText || 'Petición fallida'}`);
    }

    // Si la respuesta no tiene contenido (p. ej. DELETE 204), evita parsear JSON
    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type');
    return (contentType && contentType.includes('application/json')) ? res.json() : null;
}

export const getTasks = () => req('/tasks');
export const apiCreateTask = (task) => req('/tasks', 'POST', task);
export const apiUpdateTask = (id, fields) => req(`/tasks/${id}`, 'PATCH', fields);
export const apiUpdateStatus = (id, status) => apiUpdateTask(id, { status });
export const apiDeleteTask = (id) => req(`/tasks/${id}`, 'DELETE');
export const getUsers = () => req('/users');
export const apiCreateUser = (user) => req('/users', 'POST', user);