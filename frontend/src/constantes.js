export const ESTADOS = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente', color: '#e11d48', clase: 'estado-pendiente' },
  { valor: 'EN_PROGRESO', etiqueta: 'En progreso', color: '#f59e0b', clase: 'estado-progreso' },
  { valor: 'TERMINADO', etiqueta: 'Terminado', color: '#16a34a', clase: 'estado-terminado' },
];

export const etiquetaEstado = (valor) =>
  ESTADOS.find((e) => e.valor === valor)?.etiqueta || valor;

export const colorEstado = (valor) =>
  ESTADOS.find((e) => e.valor === valor)?.color || '#6b7280';
