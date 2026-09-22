import { ESTADOS } from '../constantes.js';

// Renderiza un nodo del árbol de forma recursiva: su cabecera, sus HU y sus hijos.
// nivel controla la indentación (0 = módulo raíz).
export default function NodoArbol({
  nodo,
  nivel,
  collapsedIds,
  onToggleCollapse,
  onAddSubnodo,
  onEditNodo,
  onDelNodo,
  onAddHU,
  onEditHU,
  onDelHU,
  onCambiarEstado,
}) {
  const esRaiz = nivel === 0;
  const sangria = 12 + nivel * 20;
  const estaColapsado = collapsedIds.has(nodo.id);

  return (
    <div className={`nodo-bloque ${esRaiz ? 'nodo-raiz' : ''}`}>
      <div
        className={`nodo-fila ${esRaiz ? 'nodo-fila-raiz' : ''}`}
        style={{ paddingLeft: `${sangria}px` }}
      >
        <button
          type="button"
          className="btn-icono chevron-btn"
          aria-label={estaColapsado ? `Expandir ${nodo.nombre}` : `Colapsar ${nodo.nombre}`}
          onClick={() => onToggleCollapse(nodo.id)}
        >
          {estaColapsado ? '▸' : '▾'}
        </button>
        <span className={esRaiz ? 'nodo-nombre-raiz' : 'nodo-nombre'}>
          {esRaiz ? nodo.nombre : `↳ ${nodo.nombre}`}
        </span>
        <span className="nodo-conteo muted">{nodo.historias.length} HU</span>
        <div className="nodo-acciones">
          <button className="btn btn-sm" onClick={() => onAddSubnodo(nodo)}>+ Subnivel</button>
          <button className="btn btn-sm" onClick={() => onAddHU(nodo)}>+ HU</button>
          <button className="btn btn-sm" onClick={() => onEditNodo(nodo)}>Editar</button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelNodo(nodo)}>Eliminar</button>
        </div>
      </div>

      {!estaColapsado && (
        <>
          {/* HU directas de este nodo */}
          {nodo.historias.map((hu) => (
            <div className="hu-fila" key={hu.id}>
              <span className="col-nombre hu-nombre" style={{ paddingLeft: `${sangria + 20}px` }}>
                <b>{hu.codigo}</b> {hu.nombre}
              </span>
              <span className="col-estado">
                <select
                  className={`select-estado estado-${hu.estado.toLowerCase()}`}
                  value={hu.estado}
                  onChange={(e) => onCambiarEstado(hu, e.target.value)}
                >
                  {ESTADOS.map((st) => (
                    <option key={st.valor} value={st.valor}>{st.etiqueta}</option>
                  ))}
                </select>
              </span>
              <span className="col-obs muted">{hu.observaciones || '—'}</span>
              <span className="col-acciones">
                <button className="btn btn-sm" onClick={() => onEditHU(hu)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelHU(hu)}>Eliminar</button>
              </span>
            </div>
          ))}

          {/* Hijos recursivos */}
          {nodo.hijos.map((hijo) => (
            <NodoArbol
              key={hijo.id}
              nodo={hijo}
              nivel={nivel + 1}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onAddSubnodo={onAddSubnodo}
              onEditNodo={onEditNodo}
              onDelNodo={onDelNodo}
              onAddHU={onAddHU}
              onEditHU={onEditHU}
              onDelHU={onDelHU}
              onCambiarEstado={onCambiarEstado}
            />
          ))}
        </>
      )}
    </div>
  );
}
