# Reto de Cambio

App web para un reto entre amigos: cada persona registra su **peso, estatura, IMC y medidas** junto con su **objetivo** (bajar, mantener o subir). Un mes después se capturan los datos finales y el tablero muestra **tres rankings por separado** para ver quién tuvo mejor rendimiento.

- **Next.js 15** (App Router) + **TypeScript**
- **SQLite** con `better-sqlite3` (un solo archivo, sin servidor de base de datos)
- **Docker** listo para **Dokploy**

## Cómo funciona

| Pestaña | Qué hace |
| --- | --- |
| **Resultados** (pública) | Los tres rankings y el detalle por persona. |
| **Datos** (con contraseña) | Captura manual o carga de Excel inicial y final. Al tocar **Guardar** se actualiza la base. |

### Los tres rankings

1. **Más kilos a favor.** Cambio de peso en la dirección de su objetivo. Quien quería bajar suma lo que bajó, quien quería subir suma lo que subió. Quien quería mantenerse suma 0 si se quedó dentro del margen y resta lo que se pasó.
2. **Mayor cambio porcentual.** Esos kilos a favor entre el peso inicial. Así una persona de 120 kg y una de 60 kg compiten en igualdad.
3. **Cumplimiento de la meta.** Kilos a favor entre la meta en kg que cada quien se puso. Quien busca mantenerse llega a 100% dentro del margen y baja a 0% cuando se mueve el doble del margen.

El IMC se calcula con peso y estatura. El detalle por persona muestra el cambio de IMC y de cada medida. El margen para quien busca mantenerse es de ±1 kg por defecto y se cambia en la pestaña **Datos**.

### Formato del Excel

Acepta `.xlsx`, `.xls` y `.csv` (primera hoja). Los encabezados no distinguen mayúsculas ni acentos. Hay botones **Copiar encabezados** para pegarlos en un Excel nuevo.

**Inicial**

| Nombre | Objetivo | Meta_kg | Peso | Estatura | Cintura | Cadera | Brazo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rosela | bajar | 4 | 68 | 163 | 82 | 100 | 28 |

**Final** (mismas medidas, mismo nombre de persona)

| Nombre | Peso | Cintura | Cadera | Brazo |
| --- | --- | --- | --- | --- |
| Rosela | 65.8 | 79.5 | 98.5 | 27.5 |

- Cualquier columna numérica extra se toma como una medida en cm.
- La estatura puede venir en cm o en metros (`1.63` se convierte a `163`).
- Las personas se cruzan por nombre, sin importar acentos ni mayúsculas.
- Quien busca bajar o subir necesita `Meta_kg` para entrar al ranking de cumplimiento.

## Variables de entorno

| Variable | Para qué | Por defecto |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Contraseña para editar. **Si está vacía, cualquiera con el enlace puede editar.** | vacía |
| `SESSION_SECRET` | Firma de la sesión. Si falta, se usa `ADMIN_PASSWORD`. | — |
| `DATABASE_PATH` | Ruta del archivo SQLite. | `./data/reto.db` (en Docker: `/data/reto.db`) |
| `SEED_DEMO` | `true` carga 5 personas de ejemplo la primera vez con la base vacía. No se vuelven a cargar después de vaciar. | `false` |
| `PORT` | Solo local: `npm run dev` / `npm start`. | `3000` |
| `HOST_PORT` | Solo Docker Compose: puerto del **host** (mapea a 3000 dentro del contenedor). | `3000` |

## Desarrollo local

```bash
cp .env.example .env.local     # ajusta ADMIN_PASSWORD
npm install
npm run dev                    # http://localhost:3000 (o el PORT de .env)
npm test                       # pruebas del cálculo, el parser de Excel y la validación
```

La base se crea sola en `./data/reto.db`.

## Docker

```bash
docker compose up --build      # http://localhost:3000
ADMIN_PASSWORD=mi-clave SEED_DEMO=true docker compose up --build
HOST_PORT=3100 docker compose up --build   # si el 3000 del host ya está ocupado
```

La base vive en el volumen `/data`. Sin volumen, los datos se pierden al recrear el contenedor.

## Despliegue en Dokploy

La forma más simple es una **Application** con el Dockerfile del repo.

1. En Dokploy crea un proyecto y una **Application**. Origen **GitHub** (`benjarmc/reto-adams`, rama `main`) y tipo de build **Dockerfile**.
2. En **Environment** agrega:
   ```
   ADMIN_PASSWORD=<una contraseña larga>
   ```
   Opcional: `SESSION_SECRET=<texto aleatorio>`.
3. En **Advanced → Volumes** agrega un **Volume Mount** (tipo *Volume*, no *Bind*) con **Mount Path** `/data`. Sin este paso la base se borra en cada despliegue.
4. En **Domains** agrega tu dominio con **Container Port** `3000` y HTTPS activado.
5. **Deploy**.

El Dockerfile ya trae un `HEALTHCHECK` contra `/api/health`.

### Si prefieres el tipo Compose

También funciona con `docker-compose.yml`. En **Environment** agrega:

```
ADMIN_PASSWORD=<una contraseña larga>
HOST_PORT=3100
```

Usa `HOST_PORT` si el deploy falla con `Bind for 0.0.0.0:3000 failed: port is already allocated`.

En **Domains**, el **Container Port debe ser `3000`** (puerto interno del contenedor), no 3100. El 3100 solo es el puerto del host; Traefik/Cloudflare hablan con el contenedor en 3000. Si pones 3100 en el dominio verás **502**.

El volumen `reto-data` ya viene definido en el compose. No definas `PORT=3100` en Environment de Dokploy: el compose fuerza `PORT=3000` dentro del contenedor.

> Si usas un volumen tipo *Bind* en vez de *Volume*, la carpeta del host debe poder escribirla el usuario `node` (uid 1000): `chown 1000:1000 <carpeta>`.

### Respaldo

La base completa es un archivo. Dos formas de respaldarla:

- **JSON público** de los datos: `GET https://tu-dominio/api/state`
- **Archivo SQLite**, dentro del contenedor: `sqlite3 /data/reto.db ".backup /data/respaldo.db"` o copiando `/data/reto.db`, `reto.db-wal` y `reto.db-shm` juntos con el contenedor detenido.

## Estructura

```
src/
  app/
    page.tsx              Resultados (lee SQLite en cada visita)
    datos/page.tsx        Captura (pide contraseña si ADMIN_PASSWORD existe)
    api/state             GET público · PUT protegido (reemplaza todo en una transacción)
    api/login, logout     Sesión con cookie httpOnly
    api/health            Healthcheck
  components/             Resultados (servidor) · Editor y Login (cliente)
  lib/
    scoring.ts            Cálculo de IMC, kilos a favor, % y cumplimiento
    parse.ts, excel.ts    Lectura de Excel en el navegador
    validate.ts           Limpieza de lo que llega por la API
    db.ts                 SQLite: esquema, lectura y guardado
tests/scoring.test.ts
```

### Esquema SQLite

`settings` (margen) · `medidas` (columnas de medidas en orden) · `personas` (nombre, objetivo, meta) · `registros` (peso, estatura y medidas por persona y fase `inicial` o `final`).

## Notas de seguridad

- Los resultados son públicos a propósito. Solo la edición pide contraseña.
- No hay límite de intentos de login más allá de una pausa de 400 ms por intento fallido. Usa una contraseña larga.
- `xlsx` (SheetJS en npm, 0.18.5) se usa solo en el navegador de quien carga el archivo, nunca en el servidor.
