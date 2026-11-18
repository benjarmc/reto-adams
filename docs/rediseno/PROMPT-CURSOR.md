# Prompt para Cursor

Pega esto en el chat de Cursor (modo Agent), con el repo `reto-adams` abierto:

---

Implementa el rediseño descrito en @docs/rediseno/BRIEF.md.

La maqueta de referencia está en @docs/rediseno/maqueta/ (archivos `.dc.html`: úsalos solo para copiar estructura, estilos, textos y datos; no se ejecutan en la app).

Reglas:
- No cambies las fórmulas de `src/lib/scoring.ts`, la API en `src/app/api/`, `src/lib/db.ts`, la autenticación, el Dockerfile ni `docker-compose.yml`.
- Sigue el "Orden de trabajo sugerido" del brief, un paso a la vez.
- Al terminar cada paso corre `npm test` y `npm run build` y arregla lo que falle antes de seguir.
- Al final revisa la lista de "Criterios de aceptación" y dime cuáles cumpliste y cuáles no.

Empieza por el paso 1.

---

Consejo: si Cursor se desvía, pídele que vuelva a leer la sección correspondiente del brief. Si el contexto se llena, abre un chat nuevo y pídele que continúe desde el paso N.
