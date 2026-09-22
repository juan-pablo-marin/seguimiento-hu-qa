import express from 'express';
import cors from 'cors';
import pool, { query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_PROGRESO', 'TERMINADO'];

// --- Salud ---
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// =====================================================
//  ÁRBOL DE NODOS  (módulo raíz = parent_id NULL; anidación ilimitada)
//  Las HU cuelgan de cualquier nodo.
// =====================================================

// Construye el bosque (lista de árboles) con HU incluidas en cada nodo.
function construirArbol(nodos, hus) {
  const porId = new Map();
  nodos.forEach((n) => porId.set(n.id, { ...n, hijos: [], historias: [] }));
  hus.forEach((h) => {
    const nodo = porId.get(h.nodo_id);
    if (nodo) nodo.historias.push(h);
  });
  const raices = [];
  porId.forEach((nodo) => {
    if (nodo.parent_id == null) raices.push(nodo);
    else {
      const padre = porId.get(nodo.parent_id);
      if (padre) padre.hijos.push(nodo);
      else raices.push(nodo); // huérfano defensivo
    }
  });
  return raices;
}

// GET /api/modulos -> bosque de módulos raíz con sus subárboles y HU
app.get('/api/modulos', async (_req, res, next) => {
  try {
    const nodos = await query('SELECT * FROM nodos ORDER BY orden, id');
    const hus = await query('SELECT * FROM historias_usuario ORDER BY orden, id');
    res.json(construirArbol(nodos.rows, hus.rows));
  } catch (e) {
    next(e);
  }
});

// Crear nodo (módulo raíz si parent_id es null/omitido; sub-nodo si trae parent_id)
app.post('/api/nodos', async (req, res, next) => {
  try {
    const { parent_id, nombre, orden } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (parent_id != null) {
      const padre = await query('SELECT 1 FROM nodos WHERE id = $1', [parent_id]);
      if (padre.rowCount === 0) return res.status(400).json({ error: 'El nodo padre no existe' });
    }
    const result = await query(
      'INSERT INTO nodos (parent_id, nombre, orden) VALUES ($1, $2, $3) RETURNING *',
      [parent_id ?? null, nombre.trim(), Number.isFinite(orden) ? orden : 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// Editar nodo (renombrar / reordenar)
app.put('/api/nodos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, orden } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const result = await query(
      'UPDATE nodos SET nombre = $1, orden = $2 WHERE id = $3 RETURNING *',
      [nombre.trim(), Number.isFinite(orden) ? orden : 0, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Nodo no encontrado' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// Eliminar nodo (cascada: sub-nodos y todas las HU del subárbol)
app.delete('/api/nodos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM nodos WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Nodo no encontrado' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// =====================================================
//  HISTORIAS DE USUARIO (HU) — cuelgan de un nodo
// =====================================================

// Crear HU
app.post('/api/hu', async (req, res, next) => {
  try {
    const { nodo_id, codigo, nombre, estado, observaciones, orden } = req.body;
    if (!nodo_id) return res.status(400).json({ error: 'nodo_id es obligatorio' });
    if (!codigo || !codigo.trim()) return res.status(400).json({ error: 'El código es obligatorio' });
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const nodo = await query('SELECT 1 FROM nodos WHERE id = $1', [nodo_id]);
    if (nodo.rowCount === 0) return res.status(400).json({ error: 'El nodo no existe' });
    const est = estado && ESTADOS_VALIDOS.includes(estado) ? estado : 'PENDIENTE';
    const result = await query(
      `INSERT INTO historias_usuario (nodo_id, codigo, nombre, estado, observaciones, orden)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nodo_id, codigo.trim(), nombre.trim(), est, observaciones || null, Number.isFinite(orden) ? orden : 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// Editar HU (completa)
app.put('/api/hu/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, estado, observaciones, orden } = req.body;
    if (!codigo || !codigo.trim()) return res.status(400).json({ error: 'El código es obligatorio' });
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      `UPDATE historias_usuario
       SET codigo = $1, nombre = $2, estado = $3, observaciones = $4, orden = $5, actualizado_en = now()
       WHERE id = $6 RETURNING *`,
      [codigo.trim(), nombre.trim(), estado || 'PENDIENTE', observaciones || null, Number.isFinite(orden) ? orden : 0, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'HU no encontrada' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// Cambiar solo el estado
app.patch('/api/hu/:id/estado', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      'UPDATE historias_usuario SET estado = $1, actualizado_en = now() WHERE id = $2 RETURNING *',
      [estado, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'HU no encontrada' });
    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

// Eliminar HU
app.delete('/api/hu/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM historias_usuario WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'HU no encontrada' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// =====================================================
//  ESTADÍSTICAS
//  totales: global por estado.
//  porModulo: agregado por módulo RAÍZ, recorriendo todo su subárbol.
// =====================================================
app.get('/api/estadisticas', async (_req, res, next) => {
  try {
    const totalesQ = await query(
      `SELECT estado, COUNT(*)::int AS cantidad FROM historias_usuario GROUP BY estado`
    );

    // Recursivo: por cada nodo, encuentra su raíz; luego agrega las HU por raíz.
    const porModuloQ = await query(`
      WITH RECURSIVE ancestro AS (
        -- Cada nodo con su propio id como candidato de raíz inicial
        SELECT id, parent_id, id AS raiz_id
        FROM nodos
        UNION ALL
        SELECT a.id, n.parent_id, n.id AS raiz_id
        FROM ancestro a
        JOIN nodos n ON n.id = a.parent_id
      ),
      raiz_de_nodo AS (
        -- La raíz real de cada nodo es el ancestro cuyo parent_id es NULL
        SELECT a.id AS nodo_id, a.raiz_id
        FROM ancestro a
        JOIN nodos r ON r.id = a.raiz_id
        WHERE r.parent_id IS NULL
      )
      SELECT
        raices.id AS modulo_id,
        raices.nombre AS modulo,
        COUNT(h.id)::int AS total,
        COUNT(*) FILTER (WHERE h.estado = 'TERMINADO')::int AS terminado,
        COUNT(*) FILTER (WHERE h.estado = 'EN_PROGRESO')::int AS en_progreso,
        COUNT(*) FILTER (WHERE h.estado = 'PENDIENTE')::int AS pendiente
      FROM nodos raices
      LEFT JOIN raiz_de_nodo rn ON rn.raiz_id = raices.id
      LEFT JOIN historias_usuario h ON h.nodo_id = rn.nodo_id
      WHERE raices.parent_id IS NULL
      GROUP BY raices.id, raices.nombre, raices.orden
      ORDER BY raices.orden, raices.id
    `);

    const base = { PENDIENTE: 0, EN_PROGRESO: 0, TERMINADO: 0 };
    for (const row of totalesQ.rows) base[row.estado] = row.cantidad;
    res.json({ totales: base, porModulo: porModuloQ.rows });
  } catch (e) {
    next(e);
  }
});

// Manejador de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;

async function esperarDB(reintentos = 15) {
  for (let i = 0; i < reintentos; i++) {
    try {
      await query('SELECT 1');
      return;
    } catch {
      console.log(`Esperando base de datos... (${i + 1}/${reintentos})`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('No se pudo conectar a la base de datos');
}

esperarDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
