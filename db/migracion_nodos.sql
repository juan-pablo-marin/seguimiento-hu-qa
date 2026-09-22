-- Migración: de (modulos + submodulos + HU.submodulo_id) a árbol único 'nodos'.
-- Conservadora: NO mueve HU (cada HU queda en el nodo que era su submódulo).
-- Idempotente: si 'nodos' ya existe y tiene datos, no hace nada.

BEGIN;

DO $migracion$
BEGIN
  -- Solo migrar si aún existe el esquema viejo y no se ha migrado
  IF to_regclass('public.modulos') IS NULL THEN
    RAISE NOTICE 'No hay tabla modulos; nada que migrar.';
    RETURN;
  END IF;

  -- Tabla de árbol
  CREATE TABLE IF NOT EXISTS nodos (
    id          SERIAL PRIMARY KEY,
    parent_id   INTEGER REFERENCES nodos(id) ON DELETE CASCADE,
    nombre      VARCHAR(150) NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_nodos_parent ON nodos(parent_id);

  -- Si ya hay nodos, asumimos migración hecha
  IF EXISTS (SELECT 1 FROM nodos) THEN
    RAISE NOTICE 'nodos ya tiene datos; migración omitida.';
    RETURN;
  END IF;

  -- Tablas de mapeo viejo->nuevo
  CREATE TEMP TABLE map_mod (viejo INT, nuevo INT) ON COMMIT DROP;
  CREATE TEMP TABLE map_sub (viejo INT, nuevo INT) ON COMMIT DROP;

  -- 1) Módulos -> nodos raíz; 2) submódulos -> nodos hijos. Guardamos mapeo viejo->nuevo.
  DECLARE
    r RECORD;
    nuevo_id INT;
  BEGIN
    FOR r IN SELECT id, nombre, orden, creado_en FROM modulos ORDER BY orden, id LOOP
      INSERT INTO nodos (parent_id, nombre, orden, creado_en)
      VALUES (NULL, r.nombre, r.orden, r.creado_en)
      RETURNING id INTO nuevo_id;
      INSERT INTO map_mod (viejo, nuevo) VALUES (r.id, nuevo_id);
    END LOOP;

    -- 2) Submódulos -> nodos hijos del nodo de su módulo
    FOR r IN SELECT id, modulo_id, nombre, orden, creado_en FROM submodulos ORDER BY orden, id LOOP
      INSERT INTO nodos (parent_id, nombre, orden, creado_en)
      VALUES ((SELECT nuevo FROM map_mod WHERE viejo = r.modulo_id), r.nombre, r.orden, r.creado_en)
      RETURNING id INTO nuevo_id;
      INSERT INTO map_sub (viejo, nuevo) VALUES (r.id, nuevo_id);
    END LOOP;
  END;

  -- 3) Reconectar HU: nueva columna nodo_id apuntando al nodo del submódulo
  ALTER TABLE historias_usuario ADD COLUMN IF NOT EXISTS nodo_id INTEGER;
  UPDATE historias_usuario h
  SET nodo_id = ms.nuevo
  FROM map_sub ms
  WHERE h.submodulo_id = ms.viejo;

  -- 4) Restricciones sobre nodo_id
  ALTER TABLE historias_usuario
    ADD CONSTRAINT historias_usuario_nodo_id_fkey
    FOREIGN KEY (nodo_id) REFERENCES nodos(id) ON DELETE CASCADE;
  ALTER TABLE historias_usuario ALTER COLUMN nodo_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_hu_nodo ON historias_usuario(nodo_id);

  -- 5) Limpiar esquema viejo
  ALTER TABLE historias_usuario DROP CONSTRAINT IF EXISTS historias_usuario_submodulo_id_fkey;
  ALTER TABLE historias_usuario DROP COLUMN IF EXISTS submodulo_id;
  DROP TABLE IF EXISTS submodulos;
  DROP TABLE IF EXISTS modulos;

  RAISE NOTICE 'Migración a nodos completada.';
END
$migracion$;

COMMIT;
