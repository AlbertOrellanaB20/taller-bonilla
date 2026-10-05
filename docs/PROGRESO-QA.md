# Progreso QA — Pasada completa antes de la demo al profesor

Última actualización: 2026-10-05 (en curso)

## Cómo retomar
Si esta sesión se corta, retómala con `claude --continue` y sigue desde la fase marcada como "en curso".

## Fase 0 — Salud del entorno
- [x] Variables en Vercel Production: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD — **las 5 existen**.
- [x] Último despliegue de producción: READY (dpl_Cui8naofgu9dJAg99tRBYgYPUFT5, commit 6b1eabc).
- [x] /api/keep-alive existe (src/app/api/keep-alive/route.ts) con cron diario en vercel.json (0 12 * * *).
- [ ] Confirmar Supabase activo y datos del seed presentes — pendiente.
- [ ] Logs de runtime de Vercel: la herramienta del MCP falla con 403 (mismo límite de permisos de equipo ya reportado en sesiones anteriores) — no se puede revisar por esta vía. Se usará consola del navegador por pantalla en su lugar.

## Fase 1 — Login y sesión
- [ ] Pendiente

## Fase 2 — Pasada completa por rol
- [ ] Pendiente

## Fase 3 — Base de datos real y tiempo real
- [ ] Pendiente

## Fase 4 — Calidad general (consola, responsive, validación, factura, moneda, íconos)
- [ ] Pendiente

## Fase 5 — Limpieza de datos de prueba
- [ ] Pendiente

## Fase 6 — Documentación (guion-presentacion.md)
- [ ] Pendiente

## Fase 7 — Publicar a master
- [ ] Pendiente (ya se está trabajando directo en master, ver nota abajo)

## Nota sobre el flujo de ramas
Esta sesión viene trabajando directo en `master` desde conversaciones anteriores (no en
`worktree-portar-figma-nextjs`, que está desactualizada). Los commits de esta pasada de
QA se harán directo en `master`, igual que las correcciones previas — así que el paso
"fusionar la rama de trabajo a master" del plan original no aplica tal cual; en su lugar,
cada fase se commitea y empuja directo a master, y solo se detiene el push si algo crítico
queda roto.

## Errores encontrados en esta pasada
(se va llenando conforme se prueba)
