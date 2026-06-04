# Activos Trading

PWA para seguimiento de activos de trading (cripto, acciones, forex). Instalable en el teléfono y funciona offline. Construida con **Vite + React + TypeScript** y `vite-plugin-pwa`.

## Características

- Portafolio con cálculo de invertido, valor actual y ganancia/pérdida (P&L).
- Edición rápida del precio actual de cada activo.
- Datos guardados en el dispositivo (`localStorage`).
- Instalable como app (PWA) en iOS y Android con ícono propio.
- UI responsive optimizada para móvil.

## Requisitos

- Node.js 18+ (probado con Node 23)

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

## Build de producción

```bash
npm run build
npm run preview
```

El build genera la carpeta `dist/` con el service worker y el manifest listos para desplegar.

## Instalar en el teléfono

1. Despliega el contenido de `dist/` en cualquier hosting con HTTPS (Vercel, Netlify, GitHub Pages, etc.).
2. Abre la URL en el navegador del teléfono.
3. **Android (Chrome):** menú → "Agregar a pantalla de inicio" / "Instalar app".
4. **iOS (Safari):** botón Compartir → "Agregar a pantalla de inicio".

> En desarrollo el service worker está habilitado (`devOptions.enabled`), así que también puedes probar la instalación desde `npm run dev` en `localhost`.

## Generar íconos

Los íconos PNG se generan desde `public/favicon.svg`:

```bash
npm install --no-save sharp
node scripts/gen-icons.mjs
```

## Estructura

```
src/
  App.tsx              UI principal del portafolio
  main.tsx             entry point de React
  types.ts             tipos de dominio (Asset)
  useLocalStorage.ts   persistencia local
  useInstallPrompt.ts  prompt de instalación PWA
public/                íconos y favicon
vite.config.ts         configuración de Vite + PWA
```
