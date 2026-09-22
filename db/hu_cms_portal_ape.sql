-- Contenido de "Módulo CMS - Portal APE" (nodo id=4)
BEGIN;

-- Subnivel dentro de CMS
INSERT INTO nodos (parent_id, nombre, orden)
VALUES (4, 'Módulo de Orientación Ocupacional', 1);

-- HU directas en "Módulo CMS - Portal APE"
INSERT INTO historias_usuario (nodo_id, codigo, nombre, estado, orden) VALUES
  (4, 'GTI-F-000-HU', 'Publicación Boletines de Microruedas', 'PENDIENTE', 1),
  (4, 'GTI-F-000-HU', 'Publicación Boletines de Prensa', 'PENDIENTE', 2),
  (4, 'GTI-F-000-HU', 'Publicación de Ventana Emergente', 'PENDIENTE', 3),
  (4, 'HU-LP-EVE-001', 'Eventos', 'PENDIENTE', 4);

COMMIT;
