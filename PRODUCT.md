# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Participantes:** miembros del reto (Adams Academia de Gimnasia / Oaxtepec) que abren Resultados en el celular para ver rankings y su progreso frente a la meta.
- **Coach / staff:** quien carga Excel o edita datos iniciales y finales en la pestaña Datos (con contraseña), normalmente en escritorio.

## Product Purpose

App web del **Reto de Cambio**: cada persona registra peso, estatura, IMC y medidas con un objetivo (bajar, mantener o subir). Tras el periodo del reto se capturan datos finales y el tablero muestra tres rankings separados para ver quién avanzó más medido contra su propia meta. Éxito = rankings claros y actualizados, y captura confiable sin fricción.

## Positioning

Tres rankings independientes (kilos a favor, cambio porcentual, cumplimiento de meta) calibrados al objetivo individual — no un único “leaderboard” genérico de pérdida de peso.

## Operating Context

- Resultados públicos a propósito; edición protegida por `ADMIN_PASSWORD`.
- Flujo coach: Excel (.xlsx/.xls/.csv) o captura manual → Guardar → SQLite → Resultados se refrescan.
- Despliegue típico: Docker / Dokploy; base en archivo SQLite.

## Capabilities and Constraints

- Next.js 15 App Router + TypeScript + better-sqlite3; CSS propio (sin Tailwind).
- No cambiar scoring, APIs, esquema SQLite ni parsers de Excel en este rediseño.
- Sin perfiles de usuario, auth por participante, ni landing marketing de la academia.
- Superficies: `/` Resultados, `/datos` captura (+ login).

## Brand Commitments

- Marca: **Adams Academia de Gimnasia** (Oaxtepec).
- Logo oficial (A bicolor azul/rojo + script “Adams” + silueta gimnasta): asset de marca vinculante.
- Colores de marca: azul royal y rojo vibrante del logo; no sustituir por paleta SaaS genérica.
- Nombre del producto en UI: Reto de Cambio, bajo la identidad Adams.

## Evidence on Hand

- Logo PNG del usuario (origen en assets del chat; se publica en `public/`).
- Copy y reglas de ranking ya en la app / README.
- No inventar testimonios, fotos de atletas ni claims comerciales de la academia.

## Product Principles

1. Participante entiende “quién va ganando” en un vistazo en móvil.
2. Coach captura y guarda con densidad y feedback claros, sin perder filas ni Excel.
3. La identidad Adams debe ser legible sin el nav.
4. La belleza no tapa el dato: números y estados primero.
5. No fabricar prueba social ni capacidades que el producto no tiene.

## Accessibility & Inclusion

Contraste AA en texto y controles; focus visible; respetar `prefers-reduced-motion` en animaciones decorativas.
