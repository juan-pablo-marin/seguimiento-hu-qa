-- Migración: introducir la capa de submódulos entre módulos y HU.
-- Idempotente: se puede correr varias veces sin romper.
-- Aplica sobre una BD que YA tiene datos con historias_usuario.modulo_id.

BEGIN;

-- 1) Tabla de submódulos
CREATE TABLE IF NOT EXISTS submodulos (
    id          SERIAL PRIMARY KEY,
    modulo_id   INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    nombre      VARCHAR(150) NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submodulo_modulo ON submodulos(modulo_id);

-- 2) Crear un submódulo "General" por cada módulo que aún no lo tenga
INSERT INTO submodulos (modulo_id, nombre, orden)
SELECT m.id, 'General', 1
FROM modulos m
WHERE NOT EXISTS (
    SELECT 1 FROM submodulos s WHERE s.modulo_id = m.id AND s.nombre = 'General'
);

-- 3) Agregar la columna submodulo_id a las HU (nullable temporalmente)
ALTER TABLE historias_usuario ADD COLUMN IF NOT EXISTS submodulo_id INTEGER;

-- 4) Asignar cada HU al submódulo "General" de su módulo actual
--    (solo si todavía tiene modulo_id y no tiene submodulo_id)
UPDATE historias_usuario h
SET submodulo_id = s.id
FROM submodulos s
WHERE h.submodulo_id IS NULL
  AND h.modulo_id IS NOT NULL
  AND s.modulo_id = h.modulo_id
  AND s.nombre = 'General';

-- 5) Añadir FK y NOT NULL una vez migrados los datos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'historias_usuario_submodulo_id_fkey'
    ) THEN
        ALTER TABLE historias_usuario
            ADD CONSTRAINT historias_usuario_submodulo_id_fkey
            FOREIGN KEY (submodulo_id) REFERENCES submodulos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Solo forzar NOT NULL si ya no quedan nulos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM historias_usuario WHERE submodulo_id IS NULL) THEN
        ALTER TABLE historias_usuario ALTER COLUMN submodulo_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hu_submodulo ON historias_usuario(submodulo_id);

-- 6) Eliminar la vieja columna modulo_id (ya no se usa)
ALTER TABLE historias_usuario DROP COLUMN IF EXISTS modulo_id;

COMMIT;
