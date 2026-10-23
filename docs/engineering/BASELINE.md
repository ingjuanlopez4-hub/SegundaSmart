# Línea base de ingeniería

Inspección del 22 de octubre de 2026. Base: `e7b9cef` (`main`).
«Verificado» describe una ejecución o consulta de este ciclo; «reportado» no
implica reproducción. No se ejecutaron despliegues ni migraciones remotas.

| Área | Evidencia | Estado | Siguiente acción |
| --- | --- | --- | --- |
| Git | `git status --short --branch`, rama, últimos 10 commits y diff: árbol limpio en `main`; `fetch origin` y divergencia `0 0` | Verificado | Mantener ramas cortas; base completa mediante `git rev-parse e7b9cef` |
| GitHub | Repositorio público `ingjuanlopez4-hub/SegundaSmart`, predeterminada `main`, upstream `origin/main`; autenticación y API indican ADMIN/push | Verificado | Publicar PR borrador; no integrar ni desplegar automáticamente |
| Gobierno inicial | API: protección de `main` inexistente (404), rulesets vacíos, un colaborador con administración; squash ya permitido | Verificado | Configurar controles solo después de CI real; no exigir aprobación imposible |
| Secretos | Solo `.env.example` y `next-env.d.ts` entre rutas de entorno rastreadas; sin bases/claves rastreadas detectadas por nombre. API: cero alertas de secret scanning; protección de push habilitada | Verificado, alcance limitado | No equivale a auditoría exhaustiva del historial. Ampliar exclusiones de entornos en otro objetivo |
| Herramientas | Next 15.5.22, React 19.1, TypeScript 5.8.3 estricto, Prisma 6.12, Vitest 3.2.7, ESLint 9; Node 22.22.2 / npm 10.9.7 locales | Verificado | Usar mismas versiones en CI sin actualizar dependencias |
| Instalación | Único lockfile de dependencias: `package-lock.json`; `npm ci` en worktree limpio tuvo timeout y luego ETIMEDOUT de registry. `npm ci --offline --no-audit --no-fund --foreground-scripts` instaló 438 paquetes desde caché | Verificado con limitación de red | Confirmar instalación online en runner GitHub |
| Scripts de instalación | Se revisaron manifiesto y efectos observados: Prisma genera cliente/motores, Sharp instala binario, esbuild y resolver preparan binarios | Verificado | No sustituir lockfile ni desactivar scripts necesarios |
| Persistencia | SQLite local; adaptador libSQL si existe `TURSO_DATABASE_URL`; tres migraciones versionadas, ejecutor local y remoto documentados | Verificado localmente | Turso remoto pendiente; respaldar datos y fotos antes de una migración autorizada |
| Negocios | Reporte de falla; la documentación previa describe corrección en `c925269` | Reportado | Seguimiento real: [issue #2](https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/2) |
| Reproducción actual | `src/app/api/negocios/route.test.ts`: 12 pruebas aprobadas con SQLite independiente; creación 201, propietario, nueva sesión, selección, aislamiento, 401/422, doble envío y rollback | Verificado; falla no reproducida en estas condiciones | Obtener SHA, HTTP y estado de migración del entorno afectado; no declarar resuelto en producción |
| Navegador | Chrome headless contra `next start`, SQLite nueva, puerto 3217: 14 checks aprobados; 360/390/768/1440 px, registro/cookie, errores, carga, creación, recarga y regreso al negocio inicial, cero excepciones JS | Verificado en emulación local | No cubre teléfono físico, Turso ni despliegue |
| Pruebas | 159 pruebas / 15 archivos aprobados tanto en base absoluta temporal como con `npm test` en worktree sin `.env` | Verificado | CI debe usar solo SQLite desechable; `npm test` reinicia `prisma/test.db` |
| Lint / tipos / build | `npm run lint`, `npm run typecheck`, `npm run build`: exit 0 en base y worktree limpio | Verificado | Ejecutar los mismos scripts en CI |
| Formato | No existe script ni herramienta de formato dedicada | Verificado, paso ausente | No anunciar verificación de formato; ESLint es el control disponible |
| CI inicial | API: cero ejecuciones; no existen workflows versionados en la base | Verificado | [Issue #1](https://github.com/ingjuanlopez4-hub/SegundaSmart/issues/1): pipeline mínimo y ejecución real |
| Despliegue y proveedores | README describe Vercel/Turso/Blob/OpenAI; configuración local ignorada existente no se copió al worktree ni se imprimió | Documentado; operación remota pendiente | No equiparar compilación local a funcionamiento en producción ni enlaces sociales a integración Meta |

## Repetir las comprobaciones sin tocar datos existentes

En un worktree nuevo, sin `.env` ni `.env.local`, tras revisar los scripts:

```bash
node --version
npm --version
npm ci --no-audit --no-fund
npm run db:generate
npm run lint
npm run typecheck
TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= npm test
DATABASE_URL=file:./test.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= npm run build
```

`npm test` contiene un reset explícito de `prisma/test.db`; usar únicamente un
checkout desechable. Para escoger otra base, usar las instrucciones de
`src/lib/business.md` con un nombre temporal **nuevo** y binarios locales ya
instalados. Las pruebas borran filas de la base seleccionada.

Evidencia de navegador temporal de este ciclo:
`/tmp/opencode/ss-engineering-business-browser.json` y
`/tmp/opencode/ss-engineering-business-mobile.png`. Se reutilizó el script local
ignorado `artifacts/verify-business-flow.mjs`, previamente inspeccionado, cambiando
solo origen y salidas. No es todavía una prueba de navegador versionada ni parte
de CI; no se garantiza la conservación de `/tmp`.
