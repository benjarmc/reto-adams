# Rediseño visual · Reto de Cambio

Brief para implementar la maqueta en la app actual (Next.js 15 + SQLite).
La maqueta está en `docs/rediseno/maqueta/`. Son archivos `.dc.html` de un editor de diseño: **no se ejecutan**, úsalos solo como referencia de markup, estilos inline, textos y datos. La lógica de cada pantalla está en el `<script data-dc-script>` al final de cada archivo.

| Archivo de maqueta | Pantalla | Ruta en la app |
| --- | --- | --- |
| `Main.dc.html` | Resultados, escritorio | `/` |
| `Movil.dc.html` | Resultados, celular (misma página, responsive) | `/` |
| `Persona.dc.html` | Detalle de una persona | `/persona/[nombre]` (nueva) |
| `Captura.dc.html` | Captura de datos | `/datos` |

## Reglas que no se rompen

- **No cambiar las fórmulas** de `src/lib/scoring.ts` (`calcRow`, `comparar`, `rankings`). Solo se agregan funciones nuevas.
- **No cambiar la API** (`src/app/api/*`), el esquema de `src/lib/db.ts`, la autenticación, el Dockerfile ni el compose.
- `npm test` y `npm run build` deben pasar al final de cada paso.
- Todo funciona a 390 px de ancho sin scroll horizontal de la página (las tablas sí pueden tener scroll dentro de su caja).
- Sin librerías de UI nuevas. CSS propio con variables, como ya está en `src/app/globals.css`. Se puede agregar `next/font`.
- Accesible: botones reales, `aria-selected` en los tabs, foco visible, contraste mínimo 4.5:1 en texto.

## Sistema visual

### Tipografía (con `next/font/google` en `src/app/layout.tsx`)

| Rol | Fuente | Uso |
| --- | --- | --- |
| Display | `Bricolage_Grotesque` 700/800 | Títulos, posiciones del podio, logo |
| Texto | `Geist` 400/500/600 | Todo lo demás |
| Números | `Geist_Mono` 500/600 | Kilos, %, medidas, IMC (`font-variant-numeric: tabular-nums`) |

Exponerlas como variables CSS (`--font-display`, `--font-body`, `--font-mono`).

### Colores (reemplazan los tokens de `globals.css`)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--bg` | `#F2F3F7` | `#0B0D17` | Fondo de página |
| `--surface` | `#FFFFFF` | `#151829` | Tarjetas |
| `--surface-2` | `#E6E8EF` | `#20243A` | Segmented control, pistas de barras |
| `--line` | `#E3E5EC` | `#2A2F48` | Bordes |
| `--fg` | `#0F1222` | `#EEF0F7` | Texto |
| `--muted` | `#5B6175` | `#A3A9BE` | Texto secundario |
| `--ink` | `#0F1222` | `#0F1222` | Bloques oscuros fijos (tile principal, header móvil) |
| `--first` | `#FF5B2E` | `#FF6B42` | Primer lugar, CTA principal. Texto encima: `#1B0A03` |
| `--accent` | `#2F5BFF` | `#7C97FF` | Barras, segundo lugar, links |
| `--good` | `#1C7A4E` | `#5FD39E` | Cambios a favor |
| `--bad` | `#C23B22` | `#FF8E78` | Cambios en contra |

Chips de objetivo: Bajar `#FFE8E0 / #9A2E10`, Subir `#E3E9FF / #1C3FD6`, Mantener `#ECEDF2 / #3D4356` (en oscuro, versiones con fondo al 20% del color).

Avatares: círculo con iniciales (2 letras) y fondo pastel elegido de forma estable por el hash del nombre normalizado (`norm()` de scoring): `#FFD9CC`, `#D6E0FF`, `#CDEFE3`, `#F6E1FF`, `#FFF0C2`. Texto siempre `#0F1222`.

### Forma y movimiento

- Radios: tarjetas grandes 24 px, tarjetas chicas 16–20 px, botones 10–12 px, chips 999 px.
- Sin sombras por defecto. Hover en tarjetas: `translateY(-2px)` y sombra suave.
- Al cambiar de ranking, la altura de las columnas del podio y el ancho de las barras animan con `transition: .6s cubic-bezier(.2,.8,.2,1)`.
- Respetar `prefers-reduced-motion: reduce` (sin transiciones).

## Pantallas

### 1. Resultados (`/`)

Orden de arriba a abajo, todo dentro de un contenedor de `max-width: 1240px`:

1. **Header**: logo (cuadro oscuro con línea ascendente naranja, está como SVG en la maqueta), nombre "Reto de Cambio", chip "Datos de ejemplo" solo si `SEED_DEMO=true` y los datos siguen siendo los de `src/lib/demo.ts`, y nav Resultados / Captura. Reemplaza `src/components/Nav.tsx`.
2. **Hero**: eyebrow "Corte final · N participantes", título "¿Quién avanzó más?", subtítulo, y a la derecha el **segmented control** de 3 opciones: Kilos a favor, % de cambio, Cumplimiento.
3. **Podio**: tarjeta con el título y la descripción del ranking activo, y 3 columnas en orden 2º · 1º · 3º. Alturas 132 / 184 / 104 px (en móvil 64 / 92 / 48). Colores: 1º `--first`, 2º `--accent`, 3º `--ink`. El avatar del 1º lleva doble anillo naranja. Si hay menos de 3 personas, mostrar las que haya.
4. **Números clave**: fila de 4 tarjetas que se envuelve. Ver "Datos nuevos".
5. **Dos columnas** (`flex-wrap`, en móvil se apilan):
   - Izquierda: **Tabla completa**, una fila por persona con posición, avatar, nombre, chip de objetivo, barra proporcional al primero, subtítulo y valor. Cada fila es un link a `/persona/[nombre]`.
   - Derecha: **Destacados** (hasta 3 tarjetas con ícono SVG) y un `<details>` "Cómo se calcula" con el texto actual.
6. Mantener los bloques actuales de **avisos** y **"Sin comparar todavía"**, con el nuevo estilo.
7. El **detalle por persona** en tabla que existe hoy se quita de esta página; ahora vive en `/persona/[nombre]`.

Estado vacío: tarjeta con "Todavía no hay nada que comparar" y un botón a `/datos`.

En móvil (`< 640px`): el hero, el segmented control y el podio van dentro de un bloque oscuro (`--ink`) con esquinas inferiores redondeadas, como en `Movil.dc.html`.

**Arquitectura**: `src/app/page.tsx` sigue siendo server component y llama a `leerEstado()`, `comparar()`, `rankings()` y las funciones nuevas. Pasa todo serializado a un client component nuevo `src/components/Tablero.tsx`, que solo guarda el ranking activo en `useState`. Opcional: reflejar el ranking en `?r=kilos|pct|meta` con `router.replace` sin scroll.

### 2. Detalle de persona (`/persona/[nombre]`, nueva)

Server component con `dynamic = 'force-dynamic'`. Busca la fila con `norm(param) === norm(fila.nombre)`; si no existe, `notFound()`.

1. Botón volver (44×44, ícono chevron) a `/`.
2. Tarjeta con **anillo SVG** del cumplimiento (r=52, trazo 12, `stroke-dasharray` proporcional, color `--first`), avatar, nombre, chip "↓ Bajar 5.0 kg" y una línea "Logró 3.4 kg. Le faltaron 1.6 kg." Para quien busca mantenerse: "Se movió 0.5 kg, dentro del margen de ±1 kg." Si no tiene meta, el anillo muestra "—" con el texto "Sin meta en kg".
3. **Posición en los 3 rankings**: 3 tarjetas `#N`. La mejor posición va resaltada en `--first`.
4. Bloque oscuro con **Peso** (antes → después, Δ kg y Δ %) e **IMC** (antes → después, Δ y cambio de categoría si cambió).
5. **Medidas**: una fila por medida con Δ en cm (color good/bad según el objetivo: bajar/mantener = bajar es bueno; subir = subir es bueno) y una barra que compara antes y después.

### 3. Captura (`/datos`)

Rediseño de `src/components/Editor.tsx` y `Login.tsx` con la misma lógica de estado, guardado y parseo que ya tienen.

1. Título "Captura de datos", subtítulo, y botones **Descargar plantilla** y **Guardar cambios** (`--first`, deshabilitado sin cambios). El indicador "Hay cambios sin guardar" se queda.
2. **Stepper de 2 pasos** (botones grandes): "1 Datos iniciales" y "2 Datos finales". Reemplaza los tabs actuales.
3. **Dropzone**: `<label>` con borde punteado que envuelve el `<input type="file">`. Acepta clic y **arrastrar y soltar** (`onDragOver` + `onDrop` → `leerArchivo()`), con estado visual al arrastrar encima.
4. **Resumen del último archivo** (tarjeta oscura): nombre del archivo, chips con número de personas, medidas detectadas y advertencias.
5. **Tabla** con avatar + nombre, celdas tipo input (`.cell` en la maqueta), botón Quitar, y una columna **Estado** con chip: "Listo", "Sin meta: se mide por margen" (mantener), "Falta meta" (bajar/subir sin meta), "Falta peso o estatura", y en la fase final "No está en el inicial".
6. **+ Persona** y **+ Medida** arriba de la tabla. "+ Medida" abre un input en línea, sin `prompt()`.
7. **Descargar plantilla**: genera un `.xlsx` en el navegador con SheetJS (`XLSX.utils.aoa_to_sheet` + `XLSX.writeFile`) con los encabezados de la fase activa y las medidas actuales. Sustituye a "Copiar encabezados".
8. El margen de "mantener" queda en un campo pequeño junto al título de la tabla inicial.

Login: tarjeta centrada con el mismo estilo, input grande y botón `--first`.

## Datos nuevos (en `src/lib/`, con pruebas en `tests/`)

Crear `src/lib/insights.ts`:

```ts
export function resumen(filas: Fila[], estado: Estado): {
  kgBajados: { total: number; nombres: string[] } | null;   // suma de -dPeso de quienes bajaron con objetivo "bajar"
  cinturaPromedio: { antes: number; despues: number; delta: number } | null; // si existe una medida cuyo norm() es "cintura"
  enMeta: { n: number; total: number; nombres: string[] };  // cumpl >= 100
  masaGanada: { total: number; nombres: string[] } | null;  // suma de dPeso > 0 con objetivo "subir"
};

export function destacados(filas: Fila[], medidas: string[]): {
  titulo: string; nombre: string; valor: string; icono: 'cintura' | 'imc' | 'constante' | 'medida';
}[]; // máximo 3: mayor reducción de cintura (o de la primera medida), mayor baja de IMC, la más constante entre quienes buscan mantenerse

export function categoriaImc(imc: number): string; // OMS: <18.5 Bajo peso · 18.5–24.9 Normal · 25–29.9 Sobrepeso · 30–34.9 Obesidad I · 35–39.9 Obesidad II · ≥40 Obesidad III

export function posiciones(filas: Fila[]): Record<string, { kilos: number; pct: number; meta: number | null }>; // por norm(nombre)

export function colorAvatar(nombre: string): string; // hash estable sobre norm(nombre)
export function iniciales(nombre: string): string;   // "Rosela" → "RO", "Ana María" → "AM"
```

Una tarjeta o destacado que no aplica (por ejemplo, nadie tiene medida "Cintura") **no se muestra**; nunca se inventa un número.

Pruebas mínimas con `DEMO` (de `src/lib/demo.ts`):
- `resumen`: kgBajados.total = 9.6 (Rosela, Benja, Chuy); cinturaPromedio.delta = −2.0; enMeta.n = 1 (Lupita); masaGanada.total = 2.2 (Mau).
- `destacados`: Chuy en cintura (−5.0 cm) y en IMC; Lupita como la más constante.
- `categoriaImc`: 30.2 → "Obesidad I", 29.1 → "Sobrepeso", 18.49 → "Bajo peso".
- `posiciones`: Benja = kilos 2, pct 1, meta 3.

## Orden de trabajo sugerido

1. Tokens, fuentes y header nuevos (`globals.css`, `layout.tsx`, `Nav.tsx`). Build verde.
2. `src/lib/insights.ts` + pruebas. `npm test` verde.
3. Resultados: `Tablero.tsx` con segmented control, podio animado, números clave, tabla y destacados.
4. Página `/persona/[nombre]` y links desde la tabla.
5. Captura: stepper, dropzone con drag & drop, resumen, chips de estado, descargar plantilla.
6. Revisión final a 390 px y 1440 px, en modo claro y oscuro, con y sin datos.

## Criterios de aceptación

- [ ] Las tres pantallas se ven como la maqueta en escritorio y en celular.
- [ ] Cambiar de ranking reordena podio y tabla con animación, sin recargar la página.
- [ ] Cada persona de la tabla abre su detalle, y un nombre inexistente da 404.
- [ ] Arrastrar un Excel a la dropzone lo carga igual que el botón.
- [ ] "Descargar plantilla" baja un `.xlsx` con los encabezados correctos.
- [ ] Con la base vacía se ven estados vacíos útiles, sin errores.
- [ ] `npm test` y `npm run build` pasan; la API y la base no cambiaron.
