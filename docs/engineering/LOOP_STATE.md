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
- CI: ejecución real [39905368920](https://github.com/ingjuanlopez4-hub/SegundaSmart/actions/runs/39905368920)
  aprobada en 55 s para `747da95475b5bf9e98c96142e9b6c8849084f32f`, incluyendo
  instalación online, generación, lint, tipos, 159 pruebas y build.
- Issue: https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/1
- PR borrador: https://github.com/ingjuanlopez4-hub/SegundaSmart/pull/3.
  Commit de implementación: `747da95475b5bf9e98c96142e9b6c8849084f32f`.
  Para evitar un SHA autorreferencial, el HEAD final y su ejecución se registran
  en el PR; consultar `gh pr view 3 --json headRefOid,statusCheckRollup`.
- Autorrevisión: diff completo, rutas staged y `git diff --cached --check`
  aprobados; solo tres archivos esperados, sin secretos ni datos. No es aprobación independiente.
- Riesgos: instalación necesita registry; el test reinicia solo la base desechable
  del runner. No hay comprobación de formato dedicada ni navegador en CI.
- Recuperación: revertir el commit exacto que introduzca CI mediante rama y PR;
  ninguna migración, dato, release o despliegue se modifica con este objetivo.
- Estado: PR abierto, CI de implementación aprobado; aún no integrado.
- Siguiente paso: comprobar CI del HEAD final tras este registro, después
  formalizar contribución y protección en un cambio separado.
- Integración existente: Vercel inicia previews al publicar PR; se observó su
  check automático. No se ejecutó despliegue manual ni se verificó producción.

## Investigación funcional pendiente

https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/2: identificar SHA desplegado,
pasos, HTTP saneado y migración de propiedad en el entorno afectado. No se ha
confirmado ni corregido una falla de producción en este ciclo.
