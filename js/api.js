const BASE = 'http://localhost:3000';

async function req(endpoint, method = 'GET', body = null) {
    const res = await fetch(`${BASE}${endpoint}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) throw new Error(`Error en API: ${res.statusText}`);
    return res.json();
}

export const getTasks = () => req('/tasks');
export const apiCreateTask = (task) => req('/tasks', 'POST', task);
export const apiUpdateStatus = (id, status) => req(`/tasks/${id}`, 'PATCH', { status });
export const apiUpdateTask = (id, fields) => req(`/tasks/${id}`, 'PATCH', fields);
export const apiDeleteTask = (id) => req(`/tasks/${id}`, 'DELETE');
export const getUsers = () => req('/users');
export const apiCreateUser = (user) => req('/users', 'POST', user);