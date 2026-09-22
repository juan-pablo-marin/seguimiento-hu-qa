import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from './api.js';
import { ESTADOS, etiquetaEstado } from './constantes.js';
import Graficas from './components/Graficas.jsx';
import FiltroEstados from './components/FiltroEstados.jsx';
import NodoArbol from './components/NodoArbol.jsx';
import Modal from './components/Modal.jsx';

// Filtra un nodo recursivamente por estado + texto. Devuelve el nodo con sus
// hijos y HU filtradas, o null si nada del subárbol coincide.
function filtrarNodo(nodo, filtro, texto) {
  const historias = nodo.historias.filter((h) => {
    const coincideEstado = !filtro.estado || h.estado === filtro.estado;
    const coincideTexto =
      !texto ||
      h.codigo.toLowerCase().includes(texto) ||
      h.nombre.toLowerCase().includes(texto);
    return coincideEstado && coincideTexto;
  });
  const hijos = nodo.hijos
    .map((h) => filtrarNodo(h, filtro, texto))
    .filter(Boolean);
  if (historias.length === 0 && hijos.length === 0) return null;
  return { ...nodo, historias, hijos };
}

// Cuenta todas las HU de un subárbol
function contarHU(nodo) {
  return nodo.historias.length + nodo.hijos.reduce((a, h) => a + contarHU(h), 0);
}

function getIdsNodos(nodo) {
  const ids = [nodo.id];
  nodo.hijos.forEach((hijo) => ids.push(...getIdsNodos(hijo)));
  return ids;
}

export default function App() {
  const [modulos, setModulos] = useState([]); // bosque de nodos raíz
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  // Filtro: estado (null = todas) + moduloId (raíz, null = todos)
  const [filtro, setFiltro] = useState({ estado: null, moduloId: null });
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalNodo, setModalNodo] = useState(null); // { id?, parent_id?, nombre, titulo }
  const [modalHU, setModalHU] = useState(null);     // { id?, nodo_id, codigo, nombre, estado, observaciones }

  const cargar = useCallback(async () => {
    try {
      setError(null);
      const [mods, stats] = await Promise.all([api.getModulos(), api.getEstadisticas()]);
      setModulos(mods);
      setEstadisticas(stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const hayFiltro = Boolean(filtro.estado || filtro.moduloId || busqueda.trim());

  // Árbol filtrado por estado + módulo raíz + texto, conservando jerarquía.
  const arbolFiltrado = useMemo(() => {
    if (!hayFiltro) return modulos;
    const texto = busqueda.trim().toLowerCase();
    return modulos
      .filter((m) => !filtro.moduloId || m.id === filtro.moduloId)
      .map((m) => filtrarNodo(m, filtro, texto))
      .filter(Boolean);
  }, [modulos, filtro, busqueda, hayFiltro]);

  const moduloFiltradoNombre = filtro.moduloId
    ? modulos.find((m) => m.id === filtro.moduloId)?.nombre
    : null;

  const totalHU = modulos.reduce((acc, m) => acc + contarHU(m), 0);

  const idsTodosNodos = useMemo(
    () => modulos.flatMap((modulo) => getIdsNodos(modulo)),
    [modulos]
  );

  const alternarColapso = useCallback((id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const colapsarTodo = useCallback(() => {
    setCollapsedIds(new Set(idsTodosNodos));
  }, [idsTodosNodos]);

  const expandirTodo = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

  // --- Acciones HU ---
  const cambiarEstado = async (hu, estado) => {
    try { await api.cambiarEstado(hu.id, estado); await cargar(); }
    catch (e) { alert(e.message); }
  };
  const eliminarHU = async (hu) => {
    if (!confirm(`¿Eliminar la HU "${hu.codigo} — ${hu.nombre}"?`)) return;
    try { await api.eliminarHU(hu.id); await cargar(); }
    catch (e) { alert(e.message); }
  };

  // --- Acciones nodo ---
  const eliminarNodo = async (nodo) => {
    if (!confirm(`¿Eliminar "${nodo.nombre}", todo su contenido (subniveles y HU)?`)) return;
    try { await api.eliminarNodo(nodo.id); await cargar(); }
    catch (e) { alert(e.message); }
  };

  const abrirNuevoModulo = () => setModalNodo({ parent_id: null, nombre: '', titulo: 'Nuevo módulo' });
  const abrirNuevoSubnodo = (padre) =>
    setModalNodo({ parent_id: padre.id, nombre: '', titulo: `Nuevo subnivel en “${padre.nombre}”` });
  const abrirEditarNodo = (nodo) =>
    setModalNodo({ id: nodo.id, nombre: nodo.nombre, titulo: 'Editar nombre' });

  const abrirNuevaHU = (nodo) =>
    setModalHU({ nodo_id: nodo.id, codigo: '', nombre: '', estado: 'PENDIENTE', observaciones: '' });
  const abrirEditarHU = (hu) =>
    setModalHU({
      id: hu.id, nodo_id: hu.nodo_id, codigo: hu.codigo,
      nombre: hu.nombre, estado: hu.estado, observaciones: hu.observaciones || '',
    });

  const guardarNodo = async (e) => {
    e.preventDefault();
    const { id, parent_id, nombre } = modalNodo;
    try {
      if (id) await api.editarNodo(id, { nombre });
      else await api.crearNodo({ parent_id, nombre });
      setModalNodo(null);
      await cargar();
    } catch (err) { alert(err.message); }
  };

  const guardarHU = async (e) => {
    e.preventDefault();
    const { id, nodo_id, codigo, nombre, estado, observaciones } = modalHU;
    try {
      if (id) await api.editarHU(id, { codigo, nombre, estado, observaciones });
      else await api.crearHU({ nodo_id, codigo, nombre, estado, observaciones });
      setModalHU(null);
      await cargar();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Seguimiento de Historias de Usuario</h1>
          <p className="muted">Panel de QA — estructura flexible por niveles</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevoModulo}>
          + Nuevo módulo
        </button>
      </header>

      {error && <div className="alerta-error">Error: {error}</div>}

      {cargando ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          {estadisticas && (
            <FiltroEstados totales={estadisticas.totales} filtro={filtro} onFiltrar={setFiltro} />
          )}

          <Graficas estadisticas={estadisticas} filtro={filtro} onFiltrar={setFiltro} />

          {/* Barra de búsqueda y filtros activos */}
          <div className="barra-herramientas">
            <div className="acciones-arbol">
              <button className="btn btn-sm" onClick={colapsarTodo}>Colapsar todo</button>
              <button className="btn btn-sm" onClick={expandirTodo}>Expandir todo</button>
            </div>
            <input
              className="buscador"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o nombre de HU…"
            />
            {hayFiltro && (
              <div className="chips-filtro">
                {filtro.estado && <span className="chip">Estado: {etiquetaEstado(filtro.estado)}</span>}
                {moduloFiltradoNombre && <span className="chip">Módulo: {moduloFiltradoNombre}</span>}
                {busqueda.trim() && <span className="chip">Texto: “{busqueda.trim()}”</span>}
                <button
                  className="btn btn-sm"
                  onClick={() => { setFiltro({ estado: null, moduloId: null }); setBusqueda(''); }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <section className="tabla-seccion">
            <div className="tabla-cabecera">
              <span className="col-nombre">Requerimientos funcionales</span>
              <span className="col-estado">Estado</span>
              <span className="col-obs">Observaciones</span>
              <span className="col-acciones">Acciones</span>
            </div>

            {modulos.length === 0 && (
              <p className="muted vacio">Aún no hay módulos. Crea el primero con “+ Nuevo módulo”.</p>
            )}

            {modulos.length > 0 && arbolFiltrado.length === 0 && (
              <p className="muted vacio">No hay HU que coincidan con los filtros aplicados.</p>
            )}

            {arbolFiltrado.map((m) => (
              <NodoArbol
                key={m.id}
                nodo={m}
                nivel={0}
                collapsedIds={collapsedIds}
                onToggleCollapse={alternarColapso}
                onAddSubnodo={abrirNuevoSubnodo}
                onEditNodo={abrirEditarNodo}
                onDelNodo={eliminarNodo}
                onAddHU={abrirNuevaHU}
                onEditHU={abrirEditarHU}
                onDelHU={eliminarHU}
                onCambiarEstado={cambiarEstado}
              />
            ))}
          </section>
        </>
      )}

      {/* Modal nodo (módulo raíz o subnivel) */}
      {modalNodo && (
        <Modal titulo={modalNodo.titulo} onCerrar={() => setModalNodo(null)}>
          <form onSubmit={guardarNodo} className="form">
            <label>
              Nombre
              <input
                autoFocus
                value={modalNodo.nombre}
                onChange={(e) => setModalNodo({ ...modalNodo, nombre: e.target.value })}
                placeholder="Ej. Empresa, Facturación, Módulo X…"
                required
              />
            </label>
            <div className="form-acciones">
              <button type="button" className="btn" onClick={() => setModalNodo(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal HU */}
      {modalHU && (
        <Modal titulo={modalHU.id ? 'Editar HU' : 'Nueva HU'} onCerrar={() => setModalHU(null)}>
          <form onSubmit={guardarHU} className="form">
            <div className="form-grid">
              <label>
                Código
                <input
                  autoFocus
                  value={modalHU.codigo}
                  onChange={(e) => setModalHU({ ...modalHU, codigo: e.target.value })}
                  placeholder="HU-001"
                  required
                />
              </label>
              <label>
                Estado
                <select
                  value={modalHU.estado}
                  onChange={(e) => setModalHU({ ...modalHU, estado: e.target.value })}
                >
                  {ESTADOS.map((s) => (
                    <option key={s.valor} value={s.valor}>{s.etiqueta}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Nombre / descripción
              <input
                value={modalHU.nombre}
                onChange={(e) => setModalHU({ ...modalHU, nombre: e.target.value })}
                placeholder="Descripción de la historia de usuario"
                required
              />
            </label>
            <label>
              Observaciones
              <textarea
                rows={3}
                value={modalHU.observaciones}
                onChange={(e) => setModalHU({ ...modalHU, observaciones: e.target.value })}
                placeholder="Notas de QA (opcional)"
              />
            </label>
            <div className="form-acciones">
              <button type="button" className="btn" onClick={() => setModalHU(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      <footer className="app-footer muted">
        Herramienta interna de QA · {totalHU} HU registradas
      </footer>
    </div>
  );
}
