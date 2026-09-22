# Seguimiento de Historias de Usuario (HU) — Panel de QA

Aplicación web para llevar el progreso de las HU de un proyecto de software, agrupadas por módulos. Permite crear, editar y eliminar módulos y HU, cambiar su estado y visualizar el avance con gráficas.

Pensada como herramienta interna de QA (sin autenticación por ahora, un solo proyecto).

## Características

- **Jerarquía flexible (árbol de profundidad ilimitada)**: un módulo puede tener HU directas, o subniveles, y cada subnivel puede tener a su vez más subniveles. Las HU pueden colgar de cualquier nodo. Desde cualquier nodo se puede crear un “+ Subnivel” o agregar “+ HU”.
- **HU** con código (`HU-001`), nombre/descripción, estado y observaciones.
- **3 estados**: `Pendiente`, `En progreso`, `Terminado`.
- **Modo oscuro** (más cómodo para la vista).
- **Buscador** por código o nombre de HU, combinable con los demás filtros.
- **Filtros por estado** desde varios lugares (sincronizados entre sí):
  - **Cards** (Total / Pendiente / En progreso / Terminado): filtran ese estado en **todos** los módulos.
  - **Torta**: clic en un segmento filtra ese estado en **todos** los módulos (global).
  - **Barras**: clic en una franja de color filtra ese estado **solo en el módulo** de esa barra (estado + módulo).
  - Volver a hacer clic en la misma combinación la limpia (toggle).
  - Los filtros activos se muestran como chips, con un botón “Limpiar filtros”.
  - Al filtrar se conserva la jerarquía completa (módulo › submódulo › HU) para ubicar cada HU; los módulos y submódulos sin coincidencias se ocultan.
- **CRUD completo** de módulos, submódulos y HU.
- Cambio de estado directo desde la tabla (selector inline).
- **Gráficas**:
  - Torta: distribución global de estados.
  - Barras apiladas: HU por módulo según estado.
  - Indicador de progreso general (% terminado).
- **Persistencia** real en PostgreSQL (volumen Docker).
- Todo **dockerizado** con `docker compose`.

## Arquitectura

| Servicio | Tecnología | Puerto |
|----------|-----------|--------|
| `frontend` | React + Vite, servido con Nginx | `8088` |
| `backend` | Node.js + Express (API REST) | `4000` |
| `db` | PostgreSQL 16 | `5539` (host) → `5432` (contenedor) |

El frontend habla con el backend vía `/api` (Nginx hace proxy al servicio `backend`).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y **en ejecución**.

## Cómo ejecutar

Desde la raíz del proyecto:

```bash
# (opcional) copiar variables de entorno
cp .env.example .env

# construir y levantar todo
docker compose up -d --build
```

Luego abre: **http://localhost:8088**

La base de datos se inicializa automáticamente con el esquema y unos datos de ejemplo (`db/init.sql`).

### Comandos útiles

```bash
docker compose logs -f          # ver logs
docker compose down             # detener (conserva los datos)
docker compose down -v          # detener y BORRAR los datos (elimina el volumen)
docker compose up -d --build    # reconstruir tras cambios de código
```

## Persistencia

Los datos de PostgreSQL viven en el volumen `db_data`, así que sobreviven a reinicios y a `docker compose down`. Solo se borran con `docker compose down -v`.

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `postgres` | Contraseña de PostgreSQL |
| `DB_NAME` | `hu_tracker` | Nombre de la base de datos |

## API REST (referencia rápida)

Base: `http://localhost:4000/api`

> Nota de puertos: el frontend queda en `8088` y PostgreSQL se expone en el host en `5539` (mapeado al `5432` interno) para no chocar con otro Postgres local.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Salud del servicio |
| GET | `/modulos` | Árbol completo (módulos raíz con subniveles y HU) |
| POST | `/nodos` | Crear nodo (módulo raíz si `parent_id` es null; subnivel si trae `parent_id`) |
| PUT | `/nodos/:id` | Editar / renombrar nodo |
| DELETE | `/nodos/:id` | Eliminar nodo (cascada: subniveles y HU del subárbol) |
| POST | `/hu` | Crear HU (dentro de cualquier nodo, vía `nodo_id`) |
| PUT | `/hu/:id` | Editar HU |
| PATCH | `/hu/:id/estado` | Cambiar solo el estado |
| DELETE | `/hu/:id` | Eliminar HU |
| GET | `/estadisticas` | Datos para las gráficas |

## Estructura del proyecto

```
.
├── docker-compose.yml
├── .env.example
├── db/
│   └── init.sql            # esquema + datos de ejemplo
├── backend/                # API Express
│   ├── Dockerfile
│   └── src/
│       ├── server.js
│       └── db.js
└── frontend/               # React + Vite
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.jsx
        ├── api.js
        ├── constantes.js
        └── components/
            ├── Graficas.jsx
            └── Modal.jsx
```

## Desarrollo local (sin Docker, opcional)

Requiere Node 20+ y un PostgreSQL local.

```bash
# backend
cd backend
npm install
DB_HOST=localhost npm start

# frontend (en otra terminal)
cd frontend
npm install
npm run dev      # http://localhost:5173
```

## Notas

- Herramienta interna: no incluye autenticación.
- Diseñada para un único proyecto; se puede extender a multi-proyecto añadiendo una tabla `proyectos` y una FK en `modulos`.
