-- Esquema de base de datos para seguimiento de HU
-- Árbol flexible: 'nodos' auto-referenciado (parent_id NULL = módulo raíz).
-- Las HU pueden colgar de cualquier nodo. Profundidad ilimitada.
-- Estados: 'PENDIENTE', 'EN_PROGRESO', 'TERMINADO'

CREATE TABLE IF NOT EXISTS nodos (
    id          SERIAL PRIMARY KEY,
    parent_id   INTEGER REFERENCES nodos(id) ON DELETE CASCADE,  -- NULL = módulo raíz
    nombre      VARCHAR(150) NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nodos_parent ON nodos(parent_id);

CREATE TABLE IF NOT EXISTS historias_usuario (
    id            SERIAL PRIMARY KEY,
    nodo_id       INTEGER NOT NULL REFERENCES nodos(id) ON DELETE CASCADE,
    codigo        VARCHAR(50) NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'TERMINADO')),
    observaciones TEXT,
    orden         INTEGER NOT NULL DEFAULT 0,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hu_nodo ON historias_usuario(nodo_id);

-- Datos de ejemplo: un módulo con submódulos y un módulo con HU directas
INSERT INTO nodos (id, parent_id, nombre, orden) VALUES
    (1, NULL, 'Empresa', 1),        -- módulo raíz
    (2, 1, 'General', 1),           -- submódulo de Empresa
    (3, NULL, 'RAV', 2);            -- módulo raíz con HU directas
SELECT setval('nodos_id_seq', (SELECT MAX(id) FROM nodos));

INSERT INTO historias_usuario (nodo_id, codigo, nombre, estado, orden)
SELECT v.nodo_id, v.codigo, v.nombre, v.estado, v.orden
FROM (VALUES
    (2, 'HU-001', 'Registro de empresa', 'TERMINADO', 1),
    (2, 'HU-002', 'Edición de empresa', 'EN_PROGRESO', 2),
    (3, 'HU-001', 'Crear RAV', 'PENDIENTE', 1),
    (3, 'HU-002', 'Consultar RAV', 'PENDIENTE', 2)
) AS v(nodo_id, codigo, nombre, estado, orden)
WHERE NOT EXISTS (SELECT 1 FROM historias_usuario)
;
