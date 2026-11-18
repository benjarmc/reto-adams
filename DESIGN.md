---
name: Reto de Cambio · Adams
description: Marcador deportivo de academia para rankings del reto corporal.
colors:
  bg: "#eef3f8"
  bg-band: "#e2eaf3"
  surface: "#ffffff"
  surface-2: "#d9e4ef"
  line: "#c5d3e0"
  fg: "#0f1b2d"
  muted: "#4a5f73"
  blue: "#1a4fc4"
  red: "#d61f26"
  good: "#0f7a4a"
  bad: "#c23b22"
  gold: "#d4a017"
  gold-ink: "#2b1f00"
  gold-wash: "#f8efd2"
  silver: "#9aa8b5"
  silver-ink: "#1a2430"
  bronze: "#b87333"
  bronze-ink: "#fff8f0"
typography:
  display:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.35rem)"
    fontWeight: 700
    letterSpacing: "-0.02em"
  display-sm:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
  brand-title:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 3.5vw, 1.9rem)"
    fontWeight: 700
  podium-name:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
  podium-value:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 700
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.875rem"
  caption:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.85rem"
  overline:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
  lede:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.95rem"
  tab:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
  button:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
  input-num:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.05rem"
rounded:
  xs: "2px"
  sm: "6px"
  md: "10px"
  place: "8px"
spacing:
  sm: "8px"
  md: "14px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
  brand-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  podium-first:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
---

# Design System

## Overview

Identidad **Marcador de academia** para el Reto de Cambio de Adams Academia de Gimnasia: dual azul/rojo del logo, tipografía condensada para números y rankings, luz diurna de gym. Resultados priorizan podio; Datos priorizan densidad de coach.

## Colors

- **Blue** (`#1a4fc4`): marca, links, valores destacados del podio.
- **Red** (`#d61f26`): CTA primaria, tab activa, acento de login.
- **Neutrals fríos**: fondos azulados; nunca cream/terracotta.
- **Gold / silver / bronze**: solo puestos 1–3 del podio.
- Tema **claro** por escena de uso (celular/gym de día).

## Typography

- **Saira Condensed**: H1/H2, tabs, botones, numerales de ranking (tabular nums).
- **Source Sans 3**: cuerpo, labels, tablas de detalle.
- Títulos de sección en mayúsculas; sin Inter ni Space Grotesk.

## Layout

- Shell `max-width: 1120px` con brand bar + tabs.
- Resultados: meta-line → podio kilos a favor → dos rankings secundarios → tabla detalle.
- Datos: barra sticky de Guardar; tabs Inicial/Final; tablas editables densas.
- Móvil primero en rankings; desktop para captura coach.

## Elevation & Depth

- Elevación real solo en podio #1 (`box-shadow` con offset y blur).
- Bandas y bordes para el resto; cards solo cuando agrupan interacción o ranking.
- Fondo con dos radiantes suaves azul/rojo (atmósfera, no glass decorativo).

## Shapes

- Radio 6px controles, 10px paneles.
- Sin pills full-round; sin border-left grueso de acento.

## Components

- **Brand bar**: logo `/logo-adams.png` + “Adams · Academia de Gimnasia” + título del reto.
- **Tabs**: underline rojo en activo; tipografía display.
- **Buttons**: primary rojo sólido; ghost/outline secundarios; `:active` scale 0.97; ease `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Podium**: grid 1-col móvil; 2º | 1º | 3º en desktop; animación de entrada respetando `prefers-reduced-motion`.
- **Rank rows**: grilla fija puesto / nombre / valor / barra; estados good/bad por color.
- **Coach sticky**: blur + borde; status ok/err.

## Do's and Don'ts

**Do**

- Mantener dual azul/rojo del logo Adams.
- Hacer que el 1er viewport diga “quién va ganando” sin scroll largo en móvil.
- Usar numerales condensados tabulares en scores.

**Don't**

- Tres cards de ranking al mismo peso visual.
- Purple/glow SaaS, cream+terracotta, Inter/Space Grotesk.
- Animar navegación de tabs (uso frecuente).
- Inventar fotos, testimonios o claims de la academia.
