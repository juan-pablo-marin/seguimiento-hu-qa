-- Subniveles de APE (id=2) según la lista aportada por QA.
BEGIN;

-- Renombrar el CMS existente (conserva sus HU)
UPDATE nodos SET nombre = 'Módulo CMS - Portal APE' WHERE id = 4;

-- Agregar los subniveles nuevos bajo APE (parent_id = 2)
INSERT INTO nodos (parent_id, nombre, orden) VALUES
  (2, 'Módulo de Personas', 2),
  (2, 'Módulo Hidrocarburos', 3),
  (2, 'Módulo Portal APE', 4),
  (2, 'Módulo Transaccional Administrador', 5),
  (2, 'Módulo Transaccional APE - Banco de Instructores', 6),
  (2, 'Módulo Transaccional APE - EMPRESAS', 7),
  (2, 'Módulo transaccional APE - Solicitudes', 8);

COMMIT;
