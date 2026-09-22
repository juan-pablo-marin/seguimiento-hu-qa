import { ESTADOS } from '../constantes.js';

// Cards clicables que filtran por estado (global, sin módulo).
// filtro = { estado, moduloId }. Aquí solo importa 'estado'; el módulo se limpia.
export default function FiltroEstados({ totales, filtro, onFiltrar }) {
  const totalHU = totales.PENDIENTE + totales.EN_PROGRESO + totales.TERMINADO;

  const cards = [
    { valor: null, etiqueta: 'Total', cantidad: totalHU, color: '#3b82f6' },
    ...ESTADOS.map((e) => ({
      valor: e.valor,
      etiqueta: e.etiqueta,
      cantidad: totales[e.valor],
      color: e.color,
    })),
  ];

  return (
    <section className="filtro-cards">
      {cards.map((c) => {
        // Activa si coincide el estado y NO hay filtro de módulo (las cards son globales)
        const activa = filtro.estado === c.valor && !filtro.moduloId;
        return (
          <button
            key={c.valor ?? 'total'}
            className={`card-estado ${activa ? 'activa' : ''}`}
            style={{ '--acento': c.color }}
            onClick={() => onFiltrar({ estado: c.valor, moduloId: null })}
            aria-pressed={activa}
          >
            <span className="card-estado-label">{c.etiqueta}</span>
            <span className="card-estado-num">{c.cantidad}</span>
          </button>
        );
      })}
    </section>
  );
}
