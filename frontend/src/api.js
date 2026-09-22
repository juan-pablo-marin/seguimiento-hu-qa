const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  // Árbol de módulos (bosque recursivo con HU)
  getModulos: () => req('/modulos'),

  // Nodos (módulo raíz o sub-nodo; unificado)
  crearNodo: (body) => req('/nodos', { method: 'POST', body: JSON.stringify(body) }),
  editarNodo: (id, body) => req(`/nodos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarNodo: (id) => req(`/nodos/${id}`, { method: 'DELETE' }),

  // HU
  crearHU: (body) => req('/hu', { method: 'POST', body: JSON.stringify(body) }),
  editarHU: (id, body) => req(`/hu/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cambiarEstado: (id, estado) =>
    req(`/hu/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  eliminarHU: (id) => req(`/hu/${id}`, { method: 'DELETE' }),

  // Estadisticas
  getEstadisticas: () => req('/estadisticas'),
};
