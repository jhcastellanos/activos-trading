# Activos Trading

PWA multiusuario para seguimiento de activos de trading con **inicio de sesión mediante Charles Schwab** (OAuth 2.0). Cada usuario conecta su propia cuenta de Schwab, y la app carga sus operaciones para análisis y estadísticas.

Stack: **Vite + React + TypeScript** (PWA) + **funciones serverless de Vercel** (`api/`) + **Neon Postgres** vía **Prisma**.

## Arquitectura

- Frontend PWA instalable en el teléfono.
- Backend como funciones serverless en `api/`, mismo dominio que la PWA (sin CORS, una sola Callback URL).
- "Iniciar sesión con Schwab" es el único login: completar el OAuth crea la sesión.
- Tokens de Schwab cifrados en reposo (AES-256-GCM) y guardados por usuario en Neon.
- Refresco automático del access token (30 min); el refresh token dura 7 días.

```
src/                      Frontend (PWA)
  App.tsx                 Puerta de sesión + dashboard
  Portfolio.tsx           Portafolio local (localStorage)
  auth/                   useSession, pantalla de login
  schwab/                 cliente API + vista de transacciones
api/                      Funciones serverless (Vercel)
  auth/schwab/login.ts    inicia OAuth
  schwab/callback.ts      callback OAuth, crea usuario + sesión
  auth/me.ts, logout.ts   sesión
  schwab/accounts.ts      cuentas del usuario
  schwab/transactions.ts  transacciones del usuario
  _lib/                   db (Prisma+Neon), crypto, session, schwab (oauth/cliente)
prisma/schema.prisma      modelos User y SchwabToken
```

## Requisitos previos

1. **Cuenta de desarrollador Schwab (Commercial)** con app en estado *Ready For Use*:
   - Registro en https://developer.schwab.com/register
   - Solicitar acceso a **Trader API - Commercial**
   - Registrar la app con Callback URL: `https://TU_DOMINIO.vercel.app/api/schwab/callback`
   - Obtener **App Key** y **Secret**
2. **Proyecto en Neon** (https://console.neon.tech) y su connection string con pooling.
3. Node.js 18+.

## Variables de entorno

Copia `.env.example` a `.env` y complétalo:

```bash
cp .env.example .env
# Genera secretos:
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 32   # TOKEN_ENC_KEY
```

| Variable | Descripción |
| --- | --- |
| `SCHWAB_CLIENT_ID` | App Key de Schwab |
| `SCHWAB_CLIENT_SECRET` | Secret de Schwab |
| `SCHWAB_CALLBACK_URL` | Debe coincidir EXACTO con la registrada |
| `APP_BASE_URL` | URL pública para redirecciones |
| `SESSION_SECRET` | Clave de la cookie de sesión (>=32) |
| `TOKEN_ENC_KEY` | Clave AES-256 (32 bytes base64 o 64 hex) |
| `DATABASE_URL` | Connection string de Neon (con pooling) |

## Base de datos

```bash
npm run prisma:generate     # genera el cliente
npm run prisma:migrate      # crea las tablas (necesita DATABASE_URL)
```

## Desarrollo

- Solo UI (sin backend): `npm run dev`
- App completa (PWA + funciones): `npm run dev:vercel` (requiere Vercel CLI: `npm i -g vercel`)

## Build

```bash
npm run build
```

## Deploy (Vercel + Neon)

1. Conecta el repo de GitHub a Vercel (framework: Vite).
2. Carga todas las variables de entorno en el proyecto de Vercel.
3. Asegura que la Callback registrada en Schwab coincide con `https://TU_DOMINIO.vercel.app/api/schwab/callback`.
4. Ejecuta las migraciones contra Neon (`npm run prisma:deploy`).
5. Verifica el flujo OAuth real una vez la app de Schwab esté *Ready For Use*.

## Notas

- Sin la app de Schwab aprobada, el botón redirige a Schwab pero el login real fallará hasta el estado *Ready For Use*.
- El portafolio manual (localStorage) sigue disponible; las estadísticas/predicciones sobre datos de Schwab se construirán en una iteración posterior.

## Instalar en el teléfono

Abre la URL desplegada (HTTPS) en el móvil y usa "Agregar a pantalla de inicio" (iOS Safari) o "Instalar app" (Android Chrome).
