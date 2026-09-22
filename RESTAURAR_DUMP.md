# Restaurar un dump PostgreSQL desde un equipo local al servidor

Esta guía restaura un dump de PostgreSQL en la aplicación HU Tracker, que se ejecuta con Docker Compose en el servidor.

## Datos del servidor

- Base de datos: `hu_tracker`
- Usuario: `postgres` (o el valor de `DB_USER` en `.env`)
- Contenedor PostgreSQL: `hu_db`
- PostgreSQL del proyecto: versión 16
- Puerto publicado en el servidor: `5539`
- Directorio del proyecto: `/root/pagina-hu-ape`

La restauración reemplaza las tablas existentes. Antes de continuar, confirma que el dump correcto está disponible y que puedes acceder por SSH al servidor.

## 1. Preparar el dump en el equipo local

El dump debe estar en formato personalizado de PostgreSQL (`custom`, normalmente generado con `pg_dump -Fc`). Por ejemplo:

```bash
pg_dump -Fc -h localhost -p 5432 -U postgres -d hu_tracker \
  -f dump-hu_tracker-$(date +%Y%m%d%H%M).dump
```

Si el archivo ya existe, no es necesario generarlo de nuevo. Comprueba que no esté vacío:

```bash
ls -lh dump-hu_tracker-*.dump
```

## 2. Copiar el dump al servidor

Ejecuta este comando desde el equipo local. Sustituye `usuario-servidor`, `IP_SERVIDOR` y la ruta del archivo:

```bash
scp ./dump-hu_tracker-202609211645.sql \
  usuario-servidor@IP_SERVIDOR:/root/pagina-hu-ape/
```

Luego entra al servidor:

```bash
ssh usuario-servidor@IP_SERVIDOR
cd /root/pagina-hu-ape
```

Comprueba que el archivo llegó correctamente:

```bash
ls -lh dump-hu_tracker-202609211645.sql
```

## 3. Cargar las variables del proyecto

Desde la raíz del proyecto en el servidor:

```bash
set -a
. ./.env
set +a

DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-hu_tracker}"
```

Si no existe `.env`, los valores anteriores usan los valores predeterminados del `docker-compose.yml`.

## 4. Comprobar que PostgreSQL está activo

```bash
docker compose up -d db
docker compose ps db
docker compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME"
```

Debe aparecer `accepting connections`.

## 5. Crear un respaldo del estado actual

Este paso permite volver atrás si el dump no es el esperado:

```bash
mkdir -p backups

docker compose exec -T db pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -Fc > "backups/hu_tracker-before-restore-$(date +%Y%m%d%H%M).dump"
```

Comprueba que el respaldo tenga contenido:

```bash
ls -lh backups/
```

## 6. Detener el backend durante la restauración

Esto evita que la aplicación escriba datos mientras se reemplazan las tablas:

```bash
docker compose stop backend
```

## 7. Restaurar el dump

### Caso habitual: dump generado con PostgreSQL 16 o anterior

Si `pg_restore --list` funciona con la versión del contenedor, restaura así:

```bash
docker run --rm \
  --network container:hu_db \
  -e PGPASSWORD="$DB_PASSWORD" \
  -v "$PWD:/work:ro" \
  postgres:16-alpine \
  pg_restore \
  -h 127.0.0.1 \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  /work/dump-hu_tracker-202609211645.sql
```

### Caso compatible: dump generado con PostgreSQL 17 y servidor PostgreSQL 16

El dump `dump-hu_tracker-202609211645.sql` fue generado con `pg_dump` 17. PostgreSQL 16 puede recibir el SQL resultante, pero su `pg_restore` no puede leer directamente el formato 1.16 del dump. Usa temporalmente las herramientas PostgreSQL 17:

```bash
set -o pipefail

docker run --rm \
  --network container:hu_db \
  -v "$PWD:/work:ro" \
  postgres:17-alpine \
  pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --file=- \
    /work/dump-hu_tracker-202609211645.sql \
  | sed '/^SET transaction_timeout = 0;$/d' \
  | docker run --rm -i \
      --network container:hu_db \
      -e PGPASSWORD="$DB_PASSWORD" \
      postgres:17-alpine \
      psql \
        -h 127.0.0.1 \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -v ON_ERROR_STOP=1
```

La línea `sed` elimina únicamente `transaction_timeout`, una configuración de PostgreSQL 17 que PostgreSQL 16 no reconoce. No omitas `ON_ERROR_STOP=1`: hace que el proceso falle ante un error real de restauración.

## 8. Iniciar nuevamente la aplicación

```bash
docker compose start backend
docker compose ps
```

Si también se detuvieron otros servicios, puedes iniciarlos con:

```bash
docker compose up -d
```

## 9. Validar la restauración

Comprueba la cantidad de registros restaurados:

```bash
docker compose exec -T db psql \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -c "SELECT 'nodos' AS tabla, COUNT(*) AS filas FROM nodos
      UNION ALL
      SELECT 'historias_usuario', COUNT(*) FROM historias_usuario;"
```

Comprueba la salud de la API:

```bash
curl -fsS http://localhost:4000/api/health
```

La respuesta esperada es:

```json
{"ok":true}
```

Finalmente, abre la aplicación en `http://IP_SERVIDOR:8088` y verifica que aparezcan los módulos y las historias de usuario esperadas.

## 10. Recuperar el estado anterior si fuera necesario

Detén primero el backend:

```bash
docker compose stop backend
```

Restaura el archivo elegido de `backups/` usando el mismo comando de restauración compatible del paso 7, cambiando la ruta del dump. Luego inicia el backend:

```bash
docker compose start backend
```

## Errores frecuentes

### `unsupported version (1.16) in file header`

El dump fue generado con `pg_dump` 17 y se está usando `pg_restore` 16. Usa el comando compatible del paso 7, que ejecuta `pg_restore` 17 en un contenedor temporal.

### `unrecognized configuration parameter "transaction_timeout"`

Se está enviando SQL generado por PostgreSQL 17 a PostgreSQL 16. Asegúrate de eliminar únicamente la línea `SET transaction_timeout = 0;` con el `sed` del comando compatible.

### `connection refused`

Comprueba el estado del servicio y espera a que PostgreSQL esté saludable:

```bash
docker compose ps
docker compose logs --tail=100 db
docker compose exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME"
```

### La aplicación no muestra los datos

Revisa los logs del backend y confirma que esté usando la misma base y credenciales definidas en `.env`:

```bash
docker compose logs --tail=100 backend
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c '\dt'
```