# Tzedaká Digital · ISEJ

Web app de donaciones — una Pushke (caja de Tzedaká) digital — con animación de moneda, sonido sintetizado y redirección a los links de Mercado Pago de ISEJ.

## Stack

- Vite + JavaScript Vanilla
- Tailwind CSS
- Web Audio API (sonido de moneda sintetizado, sin dependencias externas)

## Requisitos

- Node.js 18 o superior
- npm

## Cómo ejecutar el proyecto localmente

1. Instalar las dependencias:

```bash
npm install
```

2. Levantar el servidor de desarrollo:

```bash
npm run dev
```

3. Abrir en el navegador la URL que muestra la terminal (por defecto [http://localhost:5173](http://localhost:5173)).

## Build de producción

```bash
npm run build
```

Los archivos optimizados quedan en `dist/`. Para previsualizar ese build:

```bash
npm run preview
```

Podés subir el contenido de `dist/` a cualquier hosting estático (Netlify, Vercel, GitHub Pages, un servidor propio, etc.).

## Estructura del proyecto

```
├── index.html          # Estructura de la página (hero, Pushke SVG, grilla de montos)
├── src/
│   ├── main.js          # Lógica: sonido de moneda, animación y redirección a Mercado Pago
│   └── style.css        # Estilos Tailwind + animación de la moneda
├── public/
│   ├── assets/
│   │   └── logo_isej.png  # Logo oficial de ISEJ (descargado de isej.com)
│   └── favicon.svg
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Personalización

- **Logo institucional:** `public/assets/logo_isej.png` es el logo oficial de ISEJ (bajado de isej.com, PNG transparente 500×500). Si la institución actualiza su branding, reemplazá el archivo manteniendo el mismo nombre (así no hay que tocar `index.html`).
- **Montos y links de Mercado Pago:** están definidos como `data-amount` / `data-url` en los botones `.donate-btn` dentro de `index.html`.
- **Colores:** definidos en `tailwind.config.js` — base institucional en `isej.navy`, `isej.blue`, `isej.sky`, `isej.skydark`, `isej.white` (azul marino, celeste y blanco), con `isej.red` / `isej.reddark` como acento puntual tomado del logo (usado en el botón "Otro monto" y el resplandor detrás del logo).
- **Pushke:** el dibujo de la caja de Tzedaká es un SVG inline en `index.html` (id `pushke`), grande y protagónica, con **cuerpo de vidrio/acrílico transparente** para ver el interior, panel frosted con Estrella de David y el texto **"TZEDAKÁ"** en español. La ranura (id `coin-slot`) y la zona interior de acumulación (id `interior-bounds`, invisible) son los puntos de referencia reales que usa `main.js` para calcular dónde cae y dónde se asienta cada moneda — la animación se recalcula en base a su posición renderizada, así que sigue alineada sin importar el tamaño de pantalla.
- **Acumulación de monedas:** cada donación agrega una moneda que se queda dentro de la Pushke (no se elimina del DOM); las siguientes monedas se apilan visualmente más arriba dentro de la zona interior. El contador vive en memoria (`coinsDropped` en `main.js`) y se reinicia al recargar la página — no usa `localStorage`.

## Comportamiento al donar

Al hacer clic en un monto:

1. Se sintetiza un sonido de "caída" (whoosh filtrado) durante todo el trayecto, más un clink metálico de impacto y un pequeño rebote — todo con Web Audio API, sin archivos externos.
2. La moneda cae durante ~3 segundos desde arriba, entra por la ranura y se asienta sobre las monedas ya donadas, con un pequeño rebote al aterrizar; la Pushke hace un "wobble" en el momento del impacto.
3. Recién al cumplirse los ~3 segundos se abre una nueva pestaña con el link de Mercado Pago correspondiente.

Los tiempos están centralizados en constantes al inicio de `main.js` (`FALL_DURATION`, `IMPACT_TIME`, `REDIRECT_DELAY`) por si querés ajustarlos. La pestaña de Mercado Pago se abre de forma sincrónica al clic (antes del delay) para evitar que los navegadores —especialmente Safari/iOS— la bloqueen como pop-up.
