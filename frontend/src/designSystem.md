# HAB — Design System
> Versión 1.0 · Valfora Ecosystem · Mayo 2025

---

## Tabla de contenidos

1. [Identidad de marca](#1-identidad-de-marca)
2. [Paleta de colores](#2-paleta-de-colores)
3. [Tipografía](#3-tipografía)
4. [Espaciado y layout](#4-espaciado-y-layout)
5. [Componentes de texto](#5-componentes-de-texto)
6. [Componentes de UI](#6-componentes-de-ui)
7. [Iconografía y emojis funcionales](#7-iconografía-y-emojis-funcionales)
8. [Secciones / plantillas de página](#8-secciones--plantillas-de-página)
9. [Animaciones y motion](#9-animaciones-y-motion)
10. [Responsive breakpoints](#10-responsive-breakpoints)
11. [Variables CSS — referencia rápida](#11-variables-css--referencia-rápida)
12. [Uso por canal](#12-uso-por-canal)

---

## 1. Identidad de marca

| Elemento | Valor |
|---|---|
| **Nombre** | HAB |
| **Subtítulo** | Desarrolladores inmobiliarios |
| **Tagline operativo** | Proptech · IA · Colombia |
| **Tagline de estrategia** | Transforma la adquisición de suelo urbano usando inteligencia artificial |
| **Sector** | Proptech / Real estate / IA |
| **Mercado** | Colombia — Bogotá como epicentro |

### Tono de voz

- **Directo y técnico:** habla de datos, porcentajes, proyecciones. No adorna.
- **Confiado, no arrogante:** el mercado respalda la apuesta.
- **Educador:** el propietario no conoce el modelo; HAB lo explica.
- **Orientado al resultado:** cada pieza de comunicación termina en un "por qué importa".

### Palabras clave del ecosistema

`aporte de inmuebles` · `viabilidad normativa` · `estructuración` · `gerencia inmobiliaria` · `pipeline de proyectos` · `automatización` · `scraping` · `WhatsApp bot` · `proptech` · `suelo urbano`

---

## 2. Paleta de colores

### Colores primarios

| Token | Hex | Uso |
|---|---|---|
| `--verde` | `#2B4D2E` | Fondo hero, headers de actores, fondo de secciones principales |
| `--verde-medio` | `#3D6B40` | Header de constructoras, variante secundaria del verde |
| `--verde-claro` | `#8FA882` | Borde izquierdo de cards de problema, acentos decorativos |
| `--amarillo` | `#C9B84C` | Acento principal — números, labels, CTAs, bordes activos |
| `--crema` | `#F5F2EC` | Fondo claro principal, secciones alternadas |

### Colores neutros

| Token | Hex | Uso |
|---|---|---|
| `--gris-oscuro` | `#1A1A1A` | Fondo de secciones oscuras (revenue, marketing, financiero) |
| `--blanco` | `#FFFFFF` | Fondos de cards, texto sobre fondos oscuros |
| `--texto` | `#2C2C2C` | Cuerpo de texto sobre fondos claros |
| `--logo-color` | `#8A9A7A` | Logo HAB, elementos de marca secundarios |

### Colores semánticos (sólo en tablas financieras)

| Nombre | Hex | Uso |
|---|---|---|
| Positivo / ganancia | `#7EC87E` | Filas EBITDA positivo, indicadores de recuperación |
| Negativo / pérdida | `#E07070` | Filas EBITDA negativo, KPIs en rojo |

### Paleta de fondos por sección

```
Hero           → --verde (#2B4D2E)
Problema       → --crema (#F5F2EC)
Solución       → --gris-oscuro (#1A1A1A)
Flujo          → --verde (#2B4D2E)
Actores        → --crema (#F5F2EC)
Revenue        → --gris-oscuro (#1A1A1A)
Mercado        → --crema (#F5F2EC)
Marketing      → --gris-oscuro (#1A1A1A)
Financiero     → --gris-oscuro (#1A1A1A)
Visión         → --verde (#2B4D2E)
Footer         → --gris-oscuro (#1A1A1A)
```

> **Regla de alternancia:** oscuro → claro → oscuro → claro. Nunca dos secciones del mismo tipo seguidas.

### Opacidades estándar

| Contexto | Opacidad |
|---|---|
| Texto body sobre oscuro | `rgba(255,255,255,0.65)` |
| Texto secundario sobre oscuro | `rgba(255,255,255,0.48)` |
| Texto terciario / labels sobre oscuro | `rgba(255,255,255,0.35)` |
| Bordes sobre oscuro | `rgba(255,255,255,0.08)` |
| Fondo de cards sobre oscuro | `rgba(255,255,255,0.05)` |
| Texto body sobre claro | `#555` o `#666` |
| Acento amarillo transparente (fondos) | `rgba(201,184,76,0.14)` |
| Borde amarillo transparente | `rgba(201,184,76,0.28)` |

---

## 3. Tipografía

### Familias tipográficas

| Familia | Pesos | Rol |
|---|---|---|
| **Barlow Condensed** | 700, 900 | Display — títulos grandes, números estadísticos, logotipo |
| **Barlow** | 100, 200, 300, 400, 600, 700, 900 | Cuerpo — párrafos, labels, UI elements |

```html
<!-- Import desde Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@100;200;300;400;600;700;900&family=Barlow+Condensed:wght@700;900&display=swap" rel="stylesheet">
```

### Escala tipográfica

| Rol | Familia | Peso | Tamaño | Características |
|---|---|---|---|---|
| **Hero H1** | Barlow Condensed | 900 | `clamp(48px, 7vw, 86px)` | uppercase, line-height 0.9 |
| **Section H2** | Barlow Condensed | 900 | `clamp(38px, 5.5vw, 64px)` | uppercase, line-height 0.95 |
| **Section H2 medium** | Barlow Condensed | 900 | `clamp(34px, 5vw, 62px)` | uppercase |
| **Card title** | Barlow | 700 | `14–16px` | uppercase, letter-spacing 1px |
| **Card subtitle / label** | Barlow | 600–700 | `10–12px` | uppercase, letter-spacing 2–4px |
| **Body text** | Barlow | 300 | `14–14.5px` | line-height 1.8–1.9 |
| **Body small** | Barlow | 300–400 | `12–12.5px` | line-height 1.6–1.8 |
| **Section label** | Barlow | 600 | `10px` | uppercase, letter-spacing 4px |
| **Stat number** | Barlow Condensed | 700–900 | `clamp(26px, 4vw, 40px)` | color amarillo |
| **Stat label** | Barlow | 400 | `9px` | uppercase, letter-spacing 1px, opacidad 40% |
| **Tag / badge** | Barlow | 600 | `10px` | uppercase, letter-spacing 2px |
| **Footer link** | Barlow | 300 | `12px` | opacidad 35% |
| **Footer column title** | Barlow | 700 | `9.5px` | uppercase, letter-spacing 3px, color amarillo |
| **Disclaimer / footnote** | Barlow | 300 | `11px` | line-height 1.6, opacidad 45% |

### Reglas tipográficas

- Los **títulos display** siempre en `text-transform: uppercase`
- `line-height: 0.9–0.95` en títulos grandes (Barlow Condensed) — apretado por diseño
- `line-height: 1.8–1.9` en body text — amplio para legibilidad
- Color amarillo (`--amarillo`) en palabras clave dentro de títulos usando `<span>`
- **Nunca** usar bold en body text excepto en títulos de cards

---

## 4. Espaciado y layout

### Padding de secciones

```css
.pad {
  padding: clamp(56px, 7vw, 112px) clamp(20px, 5vw, 80px);
}
```

> Regla: padding vertical = 2× padding horizontal en pantallas grandes.

### Grid de dos columnas (estándar)

```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: clamp(32px, 5vw, 72px);
align-items: start | end | center;
```

### Grids especiales

| Grid | Columnas | Gap | Usado en |
|---|---|---|---|
| Pilares tecnológicos | `repeat(5, 1fr)` | `14px` | Sección Solución |
| Flujo de pasos | `repeat(5, 1fr)` | `0` | Sección Flujo |
| Actores / Revenue | `repeat(3, 1fr)` | `20px` | Actores, Revenue |
| KPIs financieros | `repeat(4, 1fr)` | `16px` | Mercado, Financiero |
| Evidencias de mercado | `1fr 1fr` | `20px` | Mercado |
| Cards de visión | `1fr 1fr` | `16px` | Visión |
| Timeline financiero | `repeat(6, 1fr)` | `0` | Financiero |
| Costos | `1fr 1fr` | `20px` | Financiero |

### Border radius estándar

| Uso | Valor |
|---|---|
| Cards grandes | `20px` |
| Cards medianas | `16–18px` |
| Cards pequeñas / pills | `12–14px` |
| Tags / badges | `100px` (pill) |
| Iconos / avatares cuadrados | `8–11px` |
| KPI cards | `18px` |

---

## 5. Componentes de texto

### Section Label

Aparece antes de cada H2 de sección. Siempre con línea decorativa.

```html
<div class="section-label">
  <span class="line"></span>
  Nombre de sección
</div>
```

```css
.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--amarillo);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.line {
  display: block;
  width: 30px;
  height: 2px;
  background: var(--amarillo);
  flex-shrink: 0;
}
```

> En secciones centradas, la línea aparece a ambos lados del label.

### H2 grande (`.h-big`)

```css
.h-big {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: clamp(38px, 5.5vw, 64px);
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--gris-oscuro);
  margin-bottom: 20px;
}
.h-big.w { color: var(--blanco); } /* variante sobre fondo oscuro */
```

### Body text

```css
.body-text {
  font-size: 14.5px;
  font-weight: 300;
  line-height: 1.9;
  color: #555;
}
.body-text.w { color: rgba(255,255,255,0.65); }
```

### Tag / Badge

```html
<span class="rev-tag">Fee por proyecto</span>
```

```css
/* Variante amarilla (sobre oscuro) */
display: inline-block;
background: rgba(201,184,76,0.14);
border: 1px solid rgba(201,184,76,0.28);
color: var(--amarillo);
font-size: 10px;
font-weight: 600;
letter-spacing: 2px;
text-transform: uppercase;
padding: 5px 12px;
border-radius: 100px;

/* Variante verde (sobre claro) */
background: rgba(43,77,46,0.09);
border: 1px solid rgba(43,77,46,0.18);
color: var(--verde);

/* Variante blanca (sobre verde/oscuro) */
background: rgba(255,255,255,0.07);
border: 1px solid rgba(255,255,255,0.14);
color: rgba(255,255,255,0.55);
```

---

## 6. Componentes de UI

### 6.1 Problem Card

Card con borde izquierdo de color, icono emoji y texto.

```css
.p-card {
  background: var(--blanco);
  border-radius: 14px;
  padding: 22px 26px;
  border-left: 4px solid var(--verde-claro);
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: border-color .3s, box-shadow .3s;
}
.p-card:hover {
  border-color: var(--verde);
  box-shadow: 0 6px 28px rgba(43,77,46,0.1);
}
.p-card-t { font-size: 12px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
.p-card-b { font-size: 12.5px; font-weight: 300; line-height: 1.7; color: #666; }
```

### 6.2 Pilar Card (tech pillar)

Card sobre fondo oscuro, con número decorativo grande y ícono en cuadrado verde.

```css
.pilar {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: clamp(18px,2vw,32px) clamp(14px,1.5vw,22px);
  transition: background .4s, transform .3s, border-color .3s;
}
.pilar:hover {
  background: rgba(255,255,255,0.09);
  transform: translateY(-5px);
  border-color: rgba(201,184,76,0.38);
}
.pilar-n { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 40px; color: rgba(201,184,76,0.18); }
.pilar-i { width: 42px; height: 42px; background: var(--verde); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 19px; }
.pilar-t { font-size: 11.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--blanco); }
.pilar-b { font-size: 11px; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,0.48); }
```

### 6.3 Flow Step

Paso numerado en círculo, con número badge superpuesto.

```css
.fcirc {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--amarillo);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  box-shadow: 0 0 0 8px rgba(201,184,76,0.13);
}
.fnum {
  position: absolute; top: -5px; right: -4px;
  background: var(--verde); border: 2px solid var(--amarillo);
  color: var(--amarillo);
  font-family: 'Barlow Condensed'; font-weight: 700; font-size: 11px;
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
```

Línea conectora entre pasos:
```css
.flujo-steps::before {
  content: '';
  position: absolute; top: 44px; left: 10%; right: 10%; height: 2px;
  background: linear-gradient(to right, var(--amarillo), rgba(201,184,76,0.15));
  z-index: 0;
}
```

### 6.4 Actor Card

Card con header de color sólido y lista de bullets con flecha.

```css
/* Header variants */
.act-hdr.v1 { background: var(--verde); }       /* Propietarios */
.act-hdr.v2 { background: var(--verde-medio); } /* Constructoras */
.act-hdr.v3 { background: #3D3D3D; }            /* HAB */

/* Icon box */
.act-em {
  font-size: 26px;
  background: rgba(255,255,255,0.14);
  width: 48px; height: 48px; border-radius: 11px;
}

/* Bullet list */
.act-pts li {
  font-size: 12.5px; font-weight: 400; line-height: 1.6;
  padding-left: 16px; position: relative;
}
.act-pts li::before { content: '→'; position: absolute; left: 0; color: var(--verde-claro); font-weight: 700; }
```

### 6.5 Revenue Card

Card con barra superior amarilla, número decorativo grande, y badge al pie.

```css
.rev-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: clamp(26px,3vw,42px) clamp(22px,2.5vw,34px);
  position: relative; overflow: hidden;
}
.rev-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--amarillo);
}
.rev-n { font-family: 'Barlow Condensed'; font-weight: 900; font-size: 48px; color: rgba(201,184,76,0.18); }
```

### 6.6 KPI Card

Card verde con número grande en amarillo, para métricas de mercado.

```css
.kpi {
  background: var(--verde);
  border-radius: 18px;
  padding: clamp(22px,2.5vw,32px) clamp(18px,2vw,26px);
  position: relative; overflow: hidden;
  transition: transform .3s;
}
.kpi:hover { transform: translateY(-4px); }
.kpi::after {
  content: ''; position: absolute; bottom: -28px; right: -28px;
  width: 90px; height: 90px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.kpi-n { font-family: 'Barlow Condensed'; font-weight: 900; font-size: clamp(28px,3.5vw,44px); color: var(--amarillo); }
.kpi-l { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.85); text-transform: uppercase; }
.kpi-s { font-size: 9.5px; font-weight: 300; color: rgba(255,255,255,0.38); }
```

### 6.7 Evidence Card (`.ev`)

Card de evidencia de mercado. Existe en variante clara, oscura y full-width.

```css
.ev { background: var(--blanco); border-radius: 18px; padding: 28px; box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
.ev.dk { background: var(--gris-oscuro); }
.ev.full { grid-column: 1 / -1; background: var(--crema); border: 1.5px solid rgba(43,77,46,0.14); }

/* Highlight al pie */
.ev-hl-n { font-family: 'Barlow Condensed'; font-weight: 900; font-size: 32px; color: var(--verde); }
.ev.dk .ev-hl-n { color: var(--amarillo); }
```

### 6.8 KPI Financiero (`.fin-kpi`)

Variantes por color según estado financiero.

```css
.fin-kpi.verde   { background: var(--verde); }
.fin-kpi.amarillo { background: rgba(201,184,76,0.15); border: 1px solid rgba(201,184,76,0.3); }
.fin-kpi.rojo    { background: rgba(180,60,60,0.2); border: 1px solid rgba(180,60,60,0.3); }
.fin-kpi.neutral { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
```

### 6.9 Tabla financiera

Tabla oscura con filas especiales para totales, EBITDA y márgenes.

```css
.fin-table thead tr { background: rgba(255,255,255,0.06); }
.fin-table th { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--amarillo); }
.fin-table tr.total-row td { font-weight: 700; color: var(--blanco); background: rgba(255,255,255,0.04); }
.fin-table tr.ebitda-row td { font-weight: 700; color: var(--amarillo); background: rgba(201,184,76,0.06); border-top: 2px solid rgba(201,184,76,0.25); }
.fin-table td.neg { color: #E07070; }
.fin-table td.pos { color: #7EC87E; }
```

### 6.10 Op Banner (Banner de oportunidad)

Banner dividido en dos columnas sobre fondo verde.

```css
.op-banner {
  background: var(--verde);
  border-radius: 22px;
  padding: clamp(32px,4vw,52px);
  display: grid; grid-template-columns: 1fr 1fr;
  gap: clamp(28px,4vw,52px);
  align-items: center;
}
```

Items de la columna derecha:
```css
.op-ic { width: 38px; height: 38px; background: rgba(255,255,255,0.1); border-radius: 9px; font-size: 17px; }
.op-t { font-size: 12.5px; font-weight: 700; color: var(--blanco); text-transform: uppercase; letter-spacing: .5px; }
.op-b { font-size: 11.5px; font-weight: 300; color: rgba(255,255,255,0.52); }
```

### 6.11 Marketing Card (stat card)

Card verde con número superdimensionado y tags de canales.

```css
.mkt-card { background: var(--verde); border-radius: 26px; padding: clamp(28px,4vw,48px); }
.mkt-num { font-family: 'Barlow Condensed'; font-weight: 900; font-size: clamp(50px,8vw,88px); color: var(--amarillo); }
.mkt-tag {
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.78);
  font-size: 10.5px; padding: 5px 11px; border-radius: 100px;
}
```

### 6.12 Vision Card

Card con número grande y label en minúscula.

```css
.vis-card {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: clamp(22px,2.5vw,32px) clamp(18px,2vw,26px);
}
.vis-card.feat { background: var(--amarillo); border-color: var(--amarillo); grid-column: 1 / -1; }
.vis-n { font-family: 'Barlow Condensed'; font-weight: 900; font-size: clamp(32px,4vw,50px); color: var(--amarillo); }
.vis-card.feat .vis-n { color: var(--verde); font-size: clamp(40px,5vw,60px); }
```

---

## 7. Iconografía y emojis funcionales

HAB utiliza emojis como íconos funcionales (no decorativos). Cada uno está mapeado a un concepto del modelo de negocio.

| Emoji | Concepto | Contexto |
|---|---|---|
| 🔍 / 🔎 | Búsqueda / Detección | Problema de búsqueda manual, paso 1 del flujo |
| 📊 | Análisis de datos | Problema de viabilidad |
| 📞 | Contacto / Comunicación | Problema de contacto limitado |
| 🏘️ | Propietarios / Barrio | Educación del mercado |
| 🤖 | Scraping automatizado | Pilar 1 |
| 📐 | Viabilidad normativa | Pilar 2 |
| 💬 | Bot WhatsApp | Pilar 3 |
| 🏗️ | Estructuración / Constructoras | Pilar 4, actor constructora |
| 📅 | Agendamiento | Pilar 5 |
| ⚡ | Rapidez / Automatización | Paso 2 del flujo |
| 📲 | WhatsApp / Contacto digital | Paso 3 del flujo |
| 📋 | Documentación | Paso 4 del flujo |
| 🤝 | Cierre / Alianza | Paso 5 del flujo |
| 🏠 | Propietarios | Actor propietario |
| ⚙️ | HAB como operador | Actor HAB |
| 🏙️ | Ciudad / Bogotá | Oportunidad de mercado |
| 📱 | WhatsApp masivo | Canal digital |
| 🚀 | First mover | Ventaja competitiva |
| 🎓 | Educación | Estrategia de contenidos |
| 📣 | Demanda inbound | Marketing |
| 🔁 | Casos de éxito | Social proof |
| ⚠️ | Disclaimer / Aviso | Notas legales y financieras |

> Los íconos se presentan siempre dentro de un contenedor cuadrado con fondo verde (`background: var(--verde); border-radius: 10px`), excepto en los pasos del flujo donde van en círculo amarillo.

---

## 8. Secciones / plantillas de página

### Estructura de una sección estándar (2 columnas)

```
[section-label]
[H2 grande]            [cuerpo de texto / cards]
```

### Estructura de sección centrada (flujo, revenue)

```
       [section-label centrado]
          [H2 centrado]
[card] [card] [card] [card] [card]
```

### Hero section

```
[left: tag + H1 + descripción + stats]    [right: elementos decorativos]
```

Elementos decorativos del hero:
- `.h-arch` — arco grande con borde blanco 10% opacidad
- `.h-arch2` — arco interior con borde amarillo 22% opacidad
- `.h-circle` — círculo decorativo en esquina inferior derecha

### Fondo watermark (secciones oscuras)

En secciones sobre `--gris-oscuro`, se usa una palabra gigante como watermark:

```css
.s-sol::before { content: 'HAB'; }
.s-fin::before { content: 'P&G'; }
/* Estilos comunes: */
position: absolute; right: -20px; top: 50%; transform: translateY(-50%);
font-family: 'Barlow Condensed'; font-weight: 900;
font-size: clamp(100px,18vw,280px);
color: rgba(255,255,255,0.03);
pointer-events: none;
```

---

## 9. Animaciones y motion

### Fade-in on scroll (patrón principal)

```css
.fade-in {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .65s ease, transform .65s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
const obs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.07 });

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.07 + 's'; // stagger de 4 elementos
  obs.observe(el);
});
```

> **Stagger:** cada grupo de 4 elementos tiene delay incremental de 70ms.

### Hover states estándar

| Componente | Efecto |
|---|---|
| Cards oscuras (pilar, rev-card) | `transform: translateY(-5px)` + `border-color` a amarillo |
| Cards claras (act-card) | `transform: translateY(-7px)` + `box-shadow` más pronunciado |
| KPI cards | `transform: translateY(-4px)` |
| Problem cards | `border-color` pasa a `--verde` + sombra verde suave |
| Evidence cards | Sin transform, solo `box-shadow` en las claras |

### Transiciones base

```css
transition: background .3s, border-color .3s, transform .3s, box-shadow .3s;
```

---

## 10. Responsive breakpoints

| Breakpoint | Cambios principales |
|---|---|
| `≤ 900px` | Ocultar hero-right, colapsar grids a 1 columna (texto) y 2 columnas (cards) |
| `≤ 560px` | Todos los grids a 1 columna; KPIs en 2 columnas; stats del hero con gap reducido |

### Comportamiento de grids por breakpoint

| Grid | Desktop | ≤ 900px | ≤ 560px |
|---|---|---|---|
| Hero | 1fr 1fr | 1 col (hero-right oculto) | 1 col |
| Problema / intros | 1fr 1fr | 1 col | 1 col |
| Pilares (5) | 5 cols | 2 cols | 1 col |
| Flujo (5) | 5 cols | 2 cols | 1 col |
| Actores (3) | 3 cols | 2 cols | 1 col |
| Revenue (3) | 3 cols | 2 cols | 1 col |
| KPIs (4) | 4 cols | 2 cols | 2 cols |
| Evidencias | 2 cols | 1 col | 1 col |
| Visión cards | 2 cols | 2 cols | 1 col |
| Footer | 1.5fr 1fr 1fr | 1 col | 1 col |

### Regla para el conector del flujo

```css
@media (max-width: 900px) {
  .flujo-steps::before { display: none; } /* ocultar línea conectora */
}
```

---

## 11. Variables CSS — referencia rápida

```css
:root {
  /* Colores de marca */
  --verde: #2B4D2E;
  --verde-medio: #3D6B40;
  --verde-claro: #8FA882;
  --amarillo: #C9B84C;
  --crema: #F5F2EC;
  --gris-oscuro: #1A1A1A;
  --blanco: #FFFFFF;
  --texto: #2C2C2C;
  --logo-color: #8A9A7A;

  /* Semánticos (financiero) */
  --positivo: #7EC87E;
  --negativo: #E07070;

  /* Opacidades frecuentes (no variables, pero valores estándar) */
  /* Texto sobre oscuro:   rgba(255,255,255,0.65) */
  /* Secundario oscuro:    rgba(255,255,255,0.48) */
  /* Terciario oscuro:     rgba(255,255,255,0.35) */
  /* Borde oscuro:         rgba(255,255,255,0.08) */
  /* Card sobre oscuro:    rgba(255,255,255,0.05) */
  /* Amarillo bg:          rgba(201,184,76,0.14)  */
  /* Amarillo border:      rgba(201,184,76,0.28)  */
  /* Verde bg:             rgba(43,77,46,0.09)    */
  /* Verde border:         rgba(43,77,46,0.18)    */
}
```

---

## 12. Uso por canal

### Web / HTML landing

Usar el sistema completo. Fondo alternado oscuro/claro. Animaciones de scroll con `.fade-in`.

### Presentaciones (PowerPoint / Figma)

- **Fondo oscuro:** `--gris-oscuro (#1A1A1A)` o `--verde (#2B4D2E)`
- **Fondo claro:** `--crema (#F5F2EC)`
- **Texto en oscuro:** blanco 65% para body, blanco 100% para títulos
- **Acento:** siempre `--amarillo (#C9B84C)` para números y palabras clave
- Tipografía: Barlow Condensed 900 para displays, Barlow 300 para body
- No usar animaciones complejas — solo fade-in simple

### Documentos (Word / PDF)

- Fondo blanco con bordes laterales o superiores en `--verde` o `--amarillo`
- Headers de sección: Barlow Condensed 900, uppercase, color `--verde`
- Tablas: header `--verde` con texto blanco, filas alternadas crema/blanco
- Tags/badges en texto: recuadro con borde `--amarillo`, fondo `rgba(201,184,76,0.12)`

### WhatsApp / Mensajería

- Sin colores de fondo — comunicación en texto plano
- Estructura: label en mayúsculas → dato → descripción corta
- Ejemplo: `ESTRUCTURACIÓN | $XX COP | Fee por entrega del análisis normativo y financiero`
- Emojis funcionales del mapeo de la sección 7

### Redes sociales (Instagram / LinkedIn)

- **Formato oscuro:** fondo `--gris-oscuro`, número grande en `--amarillo`, label en blanco 35%
- **Formato claro:** fondo `--crema`, dato en `--verde`, acento `--amarillo`
- Número / stat siempre en Barlow Condensed 900
- Formato cuadrado (1:1): padding mínimo 48px, número central
- Formato historia (9:16): número en 60–80% del width, label debajo en 300 weight

### Email marketing

- Background: `--crema` o `--blanco`
- Header: bloque `--verde` con texto blanco
- Acento en bullets: `→` en `--verde-claro`
- CTA button: fondo `--amarillo (#C9B84C)`, texto `--gris-oscuro`, border-radius 100px, padding 12px 28px, Barlow 700

---

## Checklist de consistencia

Antes de publicar cualquier activo de HAB, verificar:

- [ ] ¿Los colores vienen de la paleta definida? (sin grises intermedios propios)
- [ ] ¿El título usa Barlow Condensed 900 en uppercase?
- [ ] ¿El cuerpo de texto es Barlow 300?
- [ ] ¿Los números estadísticos están en `--amarillo`?
- [ ] ¿Los fondos alternan entre oscuro y claro?
- [ ] ¿Las palabras clave del titular están resaltadas en `--amarillo` con `<span>`?
- [ ] ¿Los íconos tienen contenedor cuadrado con fondo `--verde`?
- [ ] ¿Los tags/badges son en pill (`border-radius: 100px`)?
- [ ] ¿El tono de copy es directo, técnico y orientado a resultado?
- [ ] ¿Se usa `→` como bullet en listas (en lugar de `•`)?

---