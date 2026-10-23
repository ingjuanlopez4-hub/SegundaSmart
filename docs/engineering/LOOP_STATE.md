# Continuidad del ciclo de ingeniería

## Objetivo 1 — CI reproducible

- Problema: `main` no tiene comprobaciones automáticas. Creación de negocios
  investigada primero; falla no reproducida localmente, seguimiento separado #2.
- Rama: `ci/quality-checks`. Base: `e7b9cef` de `origin/main`, sin divergencia tras fetch.
- Aislamiento: worktree `/tmp/opencode/ss-engineering-ci`; árbol original conservado.
- Archivos esperados: `.github/workflows/ci.yml`, `docs/engineering/BASELINE.md`,
  `docs/engineering/LOOP_STATE.md`. Sin cambios funcionales ni de dependencias.
- Aceptación: instalación online, generación Prisma, lint, tipos, pruebas y build
  aprobados en GitHub; PR borrador revisado y recuperación documentada.
- Evidencia local de la base: 159/159 pruebas, lint, tipos y build aprobados.
  Instalación limpia offline aprobada; online bloqueada localmente por timeout de red.
  Negocios: 12 pruebas y 14 checks de navegador aprobados con SQLite independiente.
- CI: preparado; pendiente de primera ejecución remota.
- Issue: https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/1
- PR y SHA final: pendientes de commit/publicación. Para evitar un SHA
  autorreferencial, el SHA final se registra en el PR y se obtiene con
  `git log -1 --format=%H -- .github/workflows/ci.yml`; este archivo identifica la base.
- Autorrevisión: pendiente del diff final y `git diff --check`; no es aprobación independiente.
- Riesgos: instalación necesita registry; el test reinicia solo la base desechable
  del runner. No hay comprobación de formato dedicada ni navegador en CI.
- Recuperación: revertir el commit exacto que introduzca CI mediante rama y PR;
  ninguna migración, dato, release o despliegue se modifica con este objetivo.
- Siguiente paso: ejecutar workflow desde PR borrador, registrar resultado real,
  después formalizar contribución y protección en un cambio separado.

## Investigación funcional pendiente

https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/2: identificar SHA desplegado,
pasos, HTTP saneado y migración de propiedad en el entorno afectado. No se ha
confirmado ni corregido una falla de producción en este ciclo.
