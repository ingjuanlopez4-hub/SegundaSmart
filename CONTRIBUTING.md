# Contribuir a SegundaSmart

## Un objetivo por cambio

Usamos `main` estable, ramas cortas (`fix/…`, `ci/…`, `docs/…`) y PR pequeños.
Una corrección funcional no comparte PR con una actualización masiva o una
reorganización. No cambiar licencia ni atribuciones sin decisión del propietario.

Antes de editar, leer `AGENTS.md`, `README.md` y las instrucciones del módulo.
Recorrer: observar → priorizar → aislar → implementar → verificar → revisar →
proponer integración → registrar. Registrar problema, evidencia, alcance,
aceptación, validación y recuperación en un issue real; sin acceso, en
`docs/engineering/LOOP_STATE.md`. Distinguir reportado, verificado y pendiente.

## Preparar la rama

```bash
git status --short --branch
git branch --show-current
git log -10 --oneline
git diff --stat
git fetch origin
git rev-list --left-right --count HEAD...origin/main
git rev-parse origin/main
```

Inspeccionar el remoto sin publicar credenciales. No hacer pull/rebase a ciegas.
Con árbol limpio, comprobar que el nombre está libre y crear la rama sobre la
base identificada. Ejemplo, sustituyendo `fix/objetivo` por un nombre concreto:

```bash
git branch --list fix/objetivo
git switch -c fix/objetivo origin/main
```

Si hay trabajo ajeno o cambios sin commit, conservarlos: usar un worktree nuevo
basado en un SHA identificado, sin stash automático ni limpieza destructiva.
Registrar SHA y lista corta de archivos esperados antes de editar.
Incorporar la base con merge en ramas compartidas. Rebase solo para trabajo propio,
limpio y sin consumidores conocidos; nunca forzar el push de historia compartida.

## Instalación y validación

Node 22.22.2 y npm 10.9.7 están comprobados. `package-lock.json` es autoritativo.
Revisar scripts antes de instalar. En checkout desechable sin `.env`/`.env.local`:

```bash
npm ci --no-audit --no-fund
npm run db:generate
npm run lint
npm run typecheck
TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= npm test
DATABASE_URL=file:./test.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= npm run build
```

**`npm test` reinicia `prisma/test.db`.** Nunca usar una base real. Para controlar
otra ruta temporal seguir `src/lib/business.md`, con un nombre nuevo. El pipeline
no dispone de formato dedicado; el control disponible es ESLint. No rebajar reglas
ni desactivar tests. Distinguir fallos previos de regresiones.

- Lógica: reproducir primero y añadir regresión significativa cuando sea viable.
- Negocios: sesión real, persistencia, propietario, entradas/errores y aislamiento.
- UI: móvil, carga, error recuperable, vacío, éxito y foco/validación de campos.
- Migración: base desechable, integridad/rollback y recuperación de datos definida.
- Documentación: contrastar rutas y comandos; no crear tests que repitan texto.

## Commits y PR

Mantener el estilo existente: `fix: …`, `ci: …`, `docs: …`. Añadir solo rutas
revisadas con `git add ruta…`, nunca `git add .` sobre cambios ajenos. Antes de
cada commit: `git status`, `git diff`, `git log --oneline -10`,
`git diff --cached` y `git diff --cached --check`. Revisar secretos, datos reales,
respaldos y archivos generados. Actualizar documentación del módulo.

Publicar la rama y abrir PR en borrador con problema, resultado, aceptación,
resultados por SHA, riesgos y recuperación. Enlazar solo issues reales. Hacer
autorrevisión de **todos** los commits y del diff contra la base. La autorrevisión
no es una aprobación independiente. El check debe pasar en el HEAD final; si cambia
el código, repetir validaciones afectadas. Consultar `gh pr checks NUMERO`.

## Integración

`main` tiene protección verificada por API: PR obligatorio, `quality-checks`
de GitHub Actions obligatorio y rama actualizada, conversaciones resueltas,
administradores incluidos, force push y borrado bloqueados. No hay filtros de
rutas en CI ni merge queue configurada. Si se introduce merge queue, añadir
`merge_group` antes de exigir el check en esa cola.

Solo hay un colaborador: **0 aprobaciones externas obligatorias** para evitar
bloqueos. Solicitar revisión a otro colaborador cuando esté disponible y revisar
entonces esta regla. Squash ya estaba permitido y es la preferencia para estos PR;
no se deshabilitaron los otros métodos existentes.

Los cambios de configuración remota no se aplican por fusionar un JSON; consultar
el estado real y la evidencia en `docs/engineering/GITHUB_CONTROLS.md`. No integrar
ni desplegar sin autorización. La integración Vercel existente puede iniciar
previews al publicar PR; un preview aprobado no prueba producción.

Registrar el cierre en `LOOP_STATE.md`: objetivo, base/rama/SHA, archivos,
resultados, CI, issue/PR, riesgos y siguiente paso. Registrar el SHA final en el PR
evita referencias autorreferenciales en el commit. «Local», «PR abierto», «CI
aprobado», «integrado» y «desplegado» son estados distintos.

Si tres intentos razonados no aportan evidencia nueva, registrar hipótesis y
bloqueo concreto. Para recuperación y entregas, seguir
[RECOVERY.md](docs/engineering/RECOVERY.md).
