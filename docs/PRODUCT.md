# Activos Trading — Especificación de producto y arquitectura

## 1. Visión del producto

PWA instalable que permite a inversores self-directed conectar **su propia cuenta de Charles Schwab** (OAuth oficial) para **controlar posiciones abiertas con estrategia LIFO**, **planificar ventas con objetivo mínimo del 1,5%** y **seguir un objetivo diario de crecimiento del 1%** sobre una base de cuenta estable, además de revisar trades cerrados e historial diario.

## 2. Objetivo principal

Reducir errores operativos al vender: saber **qué lote vender primero**, **a qué precio mínimo** y **cuánto ganar**, mientras se visualiza el progreso hacia la meta diaria sin recalcularla de forma incorrecta cuando quedan posiciones arrastradas.

## 3. Usuarios principales

| Persona | Necesidad |
| --- | --- |
| Trader retail (tú y otros usuarios Commercial) | Control LIFO, objetivo 1,5% por lote, meta diaria 1% |
| Desarrollador / tú mismo en espera de Schwab | Modo Demo/Mock con misma UX y contratos de servicio |
| Futuro: pequeño grupo de usuarios invitados | Multi-cuenta vía OAuth Schwab por usuario |

## 4. Módulos del sistema

| Módulo | Responsabilidad |
| --- | --- |
| **Auth (Schwab OAuth)** | Login único vía Schwab; tokens en backend cifrados; sin contraseñas propias |
| **Broker Adapter** | `BrokerService`: cuentas, posiciones, transacciones (Mock \| Schwab) |
| **Portfolio / Lots** | Lotes de compra, LIFO, estados, ventas parciales |
| **Trade History** | Trades cerrados, P/L, duración, método de cierre |
| **Daily Goal** | Base, objetivo 1%, progreso, reglas de recálculo |
| **Calculations** | Precio objetivo 1,5%, P/L, agrupación por símbolo |
| **Dashboard** | KPIs de cuenta y conexión |
| **Sync Schwab** | Importar operaciones (compras/ventas de activos) desde la API oficial |
| **Demo / Mock** | Datos de prueba mientras no hay credenciales (sin CSV) |
| **PWA Shell** | Navegación móvil, offline ligero, instalación |
| **Persistence** | Neon (prod) + adaptador local (demo) |

## 5. User stories (priorizadas)

### Epic A — Conexión y modo de operación
- **US-A1**: Como usuario, quiero conectar con Schwab desde la PWA para que la app lea mi cuenta sin dar mi contraseña aquí.
- **US-A2**: Como desarrollador en espera de credenciales, quiero usar modo Demo con datos mock para seguir construyendo.
- **US-A3**: Como usuario, quiero ver si estoy en Mock, Desconectado o Conectado.

### Epic B — Posiciones abiertas (prioridad)
- **US-B1**: Como trader, quiero ver posiciones agrupadas por símbolo con lotes en orden LIFO.
- **US-B2**: Como trader, quiero ver por lote el precio mínimo de venta para 1,5% y la ganancia estimada.
- **US-B3**: Como trader, quiero que el primer lote LIFO esté marcado como “Vender primero”.
- **US-B4**: Como trader, quiero registrar venta parcial o cierre en modo demo (simulación local).

### Epic C — Plan de venta y dashboard
- **US-C1**: Como trader, quiero un plan de venta LIFO consolidado.
- **US-C2**: Como trader, quiero dashboard con valor de cuenta, cambio del día, P/L realizado/no realizado y progreso al 1% diario.

### Epic D — Objetivo diario 1%
- **US-D1**: Como trader, quiero objetivo diario = 1% sobre base fija hasta cerrar posiciones relevantes.
- **US-D2**: Como trader, quiero historial diario (base, objetivo, resultado, estado).

### Epic E — Trades cerrados y sync desde Schwab
- **US-E1**: Historial de trades cerrados con métricas completas.
- **US-E2**: **Importar desde Schwab** las operaciones de compra/venta de activos (acciones, etc.) vía API y normalizarlas a lotes LIFO.
- **US-E3**: Detalle por símbolo.

> **No es prioridad:** importación CSV/Excel de archivos locales. Eso queda fuera de alcance por ahora.

## 6. Criterios de aceptación (muestra crítica)

**US-B1 / LIFO**
- Dado 3 compras del mismo símbolo en fechas T1 < T2 < T3, el lote T3 aparece primero como “vender primero”.
- El orden visual y el `sellPriority` coinciden.

**US-B2 / Objetivo 1,5%**
- `targetSellPrice = buyPrice * 1.015` (redondeo documentado).
- Si `currentPrice >= targetSellPrice`, estado = objetivo alcanzado.

**US-D1 / Objetivo diario**
- Si hay lotes abiertos de días anteriores, `dailyGoalBase` no cambia por fluctuación intradía.
- Tras cierre confirmado de todas las posiciones relevantes, se puede actualizar base y recalcular objetivo del día siguiente.

**US-A1 / Auth**
- No existe formulario de usuario/contraseña propio.
- Tokens nunca en `localStorage` en claro; solo cookie de sesión httpOnly.

## 7. Modelo de datos inicial

```
User (existente, Schwab)
├── SchwabToken (existente)
├── AccountSettings (targetProfitPct default 1.5, dailyGoalPct default 1)
├── TradeLot (id, symbol, boughtAt, qty, avgPrice, status, closedQty, ...)
├── ClosedTrade (symbol, buy/sell dates, qty, prices, pnl, method, notes)
├── DailySnapshot (date, baseBalance, goalAmount, actualResult, dayStatus, hadOvernightOpen)
└── SchwabSyncLog (opcional, última sync, cursor de transacciones)
```

**TradeLot.status**: `open` | `partial` | `closed`  
**Lot visual state**: `far` | `near` | `reached` (derivado de precio actual vs objetivo)

## 8. Flujo de autenticación Schwab

1. Usuario → “Conectar con Charles Schwab”.
2. Redirect `/api/auth/schwab/login` → Schwab authorize.
3. Callback → exchange code → `accountNumbers` → `User` + tokens cifrados + cookie sesión.
4. Frontend `GET /api/auth/me` → `connected` / `needsReauth`.
5. Logout destruye sesión (tokens pueden permanecer cifrados para reconexión rápida o borrarse — política: borrar en logout v2).

## 9. Flujo Mock / Demo

1. Usuario elige “Continuar en modo Demo” (sin OAuth).
2. `BrokerService` = `MockBrokerService`; datos en `LocalBrokerRepository` (IndexedDB/localStorage).
3. Mismas pantallas y mismos `PortfolioService` / `LifoStrategyService`.
4. Datos mock en localStorage (solo desarrollo).
5. Indicador global: `connectionMode: demo`.

## 10. Flujo futuro: importar desde Schwab (API real)

1. `connectionMode: schwab` + sesión válida.
2. `SchwabBrokerService` implementa `BrokerService`.
3. **Sync (lo que llamamos “import”)**: el backend consulta la API de Schwab (transacciones / posiciones) y filtra operaciones relevantes:
   - Compras de activos (acciones, ETFs, etc.).
   - Ventas que cierran o reducen lotes.
   - Excluir por ahora: transferencias, dividendos, efectivo, etc. (configurable después).
4. **Normalización**: cada compra → `TradeLot`; cada venta → actualiza LIFO y genera `ClosedTrade`.
5. Persistencia en Neon por `userId`.
6. Cálculos LIFO y daily goal **no cambian** (misma capa de negocio).

Endpoints Schwab previstos (cuando la app esté *Ready For Use*):
- `GET /trader/v1/accounts/accountNumbers`
- `GET /trader/v1/accounts/{hash}/transactions` (filtro `types=TRADE`)
- `GET /trader/v1/accounts` (balances para dashboard)

## 11. Riesgos técnicos

| Riesgo | Mitigación |
| --- | --- |
| Aprobación Commercial pendiente | Modo Demo + interfaces estables |
| Refresh token 7 días Schwab | UI “reconectar”; job de aviso |
| LIFO vs contabilidad Schwab | Documentar que LIFO es **decisión de la app**, no del broker |
| Objetivo diario mal recalculado | `DailyGoalService` con reglas explícitas + tests |
| Cookies cross-domain | Proxy Vercel → Railway (ya definido) |
| Secret en frontend | Solo backend Express |

## 12. Arquitectura propuesta (capas)

```
┌─────────────────────────────────────────┐
│  Pages (Dashboard, OpenPositions, ...)   │
├─────────────────────────────────────────┤
│  Components (cards, lot row, status)    │
├─────────────────────────────────────────┤
│  Hooks / AppContext (mode, session)      │
├─────────────────────────────────────────┤
│  Services (Portfolio, DailyGoal, Auth)   │
├─────────────────────────────────────────┤
│  BrokerService ◄── Mock │ Schwab        │
├─────────────────────────────────────────┤
│  Business Logic (LIFO, targets, P/L)     │  ← pure, testable
├─────────────────────────────────────────┤
│  Domain Types / Models                   │
├─────────────────────────────────────────┤
│  Storage (Local │ Prisma API)            │
└─────────────────────────────────────────┘
```

**Backend (Railway)**: OAuth, tokens, futuro sync Schwab.  
**Frontend**: UI + lógica de presentación; Demo autónomo; API para auth y sync futuro.

## 13. Roadmap por fases

| Fase | Entregable |
| --- | --- |
| **0** (actual) | Infra Vercel/Railway/Neon, OAuth esqueleto, PWA |
| **1** | Dominio + cálculos + Mock + Dashboard + Open Positions LIFO |
| **2** | Plan venta, trades cerrados, historial diario, reglas 1% |
| **3** | Sync Schwab real (import operaciones), detalle símbolo, tema claro/oscuro |
| **4** | Worker Railway (sync programado), estadísticas |
| **5** | Estadísticas, predicciones, alertas push |

## 14. Primer sprint recomendado (2 semanas)

**Sprint 1 — “Demo operable”**
- [ ] Tipos de dominio y servicios de cálculo con tests
- [ ] `BrokerService` + `MockBrokerService` + datos semilla
- [ ] App shell + rutas + estado conexión (demo/disconnected/connected)
- [ ] Dashboard (KPIs mock)
- [ ] Posiciones abiertas agrupadas + LIFO + etiquetas 1,5%
- [ ] Prisma: modelos TradeLot, ClosedTrade, DailySnapshot (migración)
- [ ] Documentación env y seguridad

**Definition of Done**: modo Demo usable en móvil; cálculos LIFO testeados; sin login alternativo; listo para enchufar Schwab en Fase 4.
