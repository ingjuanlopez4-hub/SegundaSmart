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
- Estado: PR abierto, CI del HEAD final `12b946ee301efe156766364770fcac5333256d2a`
  aprobado: [39905585747](https://github.com/ingjuanlopez4-hub/SegundaSmart/actions/runs/39905585747).
  Ciclo de propuesta completado; aún no integrado.
- Siguiente paso: revisión del propietario e integración autorizada de #3;
  contribución y protección continúan en el objetivo 2 separado.
- Integración existente: Vercel inicia previews al publicar PR; se observó su
  check automático. No se ejecutó despliegue manual ni se verificó producción.

## Objetivo 2 — Contribución y recuperación trazables

- Problema: faltan contrato de contribución, plantillas y guía de recuperación.
- Issue: https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/4.
- Rama `docs/contributing`, base `12b946ee301efe156766364770fcac5333256d2a`.
  Worktree `/tmp/opencode/ss-engineering-docs`. Depende de #3 porque extiende el
  registro de ingeniería y usa su workflow; PR dirigido a `ci/quality-checks`
  para presentar solamente el incremento. Retarget a `main` y nueva validación
  después de integrar #3; no se hará merge automáticamente.
- Archivos esperados: `CONTRIBUTING.md`, `SECURITY.md`, `README.md`, `.gitignore`,
  plantillas PR/issues, `.github/dependabot.yml`, `docs/PRODUCTO_VERIFICADO.md`,
  `docs/engineering/{BASELINE,LOOP_STATE,GITHUB_CONTROLS,RECOVERY}.md` y
  `docs/engineering/main-protection.json`. Sin cambios de aplicación o dependencias.
- Aceptación: comandos/rutas contrastados, documentación de evidencia y límites,
  exclusiones verificadas, configuración remota consultada y CI final aprobado.
- Remoto aplicado: protección de `main` y reporte privado de seguridad; lectura
  posterior aprobada. Un único colaborador, 0 aprobaciones externas obligatorias;
  squash ya habilitado, no se modificaron métodos de merge. No funciones de pago.
- Recuperación ensayada: `git revert --no-commit 747da95475b5bf9e98c96142e9b6c8849084f32f`
  en worktree detached desechable. Diff contra `e7b9cef` vacío (exit 0), sin
  publicación. No es ensayo de recuperación de datos o producción.
- Validación local del incremento: instalación limpia offline, generación Prisma,
  lint, tipos, 159/159 pruebas y build aprobados. YAML de workflow, Dependabot y
  formularios válido; JSON de protección válido. 16 enlaces locales contrastados.
  Seis rutas sintéticas de entornos/bases ignoradas y `.env.example` no ignorado.
- Autorrevisión: rutas, manejo de secretos y distinción entre controles aplicados
  y archivos preparados revisados; `git diff --check` aprobado. No es revisión independiente.
- PR borrador: https://github.com/ingjuanlopez4-hub/SegundaSmart/pull/5.
  CI de implementación `549eb4be5eff2bd0125b09413b0b044e866bc48d` aprobado:
  [39906407665](https://github.com/ingjuanlopez4-hub/SegundaSmart/actions/runs/39906407665).
  Incluye instalación online, Prisma, lint, tipos, 159 pruebas y build.
  El SHA y ejecución del HEAD final tras este registro se guardan en el PR;
  consultar `gh pr view 5 --json headRefOid,statusCheckRollup`.
  Estado: PR abierto con CI de implementación aprobado, no integrado.
- Riesgos: CI aún no está en `main`; integrar primero #3. Dependabot y plantillas
  están preparados, no activos en la rama predeterminada hasta integrar el cambio.
  La configuración remota sí se aplicó, no depende de fusionar los documentos.
- Recuperación: revertir SHA integrado mediante PR; no borrar protecciones como
  limpieza rutinaria. Un rollback de código no revierte configuración GitHub.
- Siguiente paso: comprobar CI del HEAD final tras este registro; luego revisión
  del propietario, integración autorizada de #3, retarget de #5 a `main` y nueva
  comprobación. La investigación #2 requiere evidencia del entorno afectado.

## Investigación funcional pendiente

https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/2: identificar SHA desplegado,
pasos, HTTP saneado y migración de propiedad en el entorno afectado. No se ha
confirmado ni corregido una falla de producción en este ciclo.
