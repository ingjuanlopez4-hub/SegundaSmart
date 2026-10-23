# Recuperación y entregas

## Reversión de código mediante PR

Primero identificar el commit **realmente integrado**: tras squash no es el SHA de
la rama original. Inspeccionar `git log`, el PR y `git show SHA_INTEGRADO`, capturar
el SHA completo y comprobar árbol limpio. Después de `git fetch origin`, crear una
rama corta nueva desde `origin/main` y ejecutar `git revert SHA_INTEGRADO`
(sustituir por ese SHA exacto). Una integración merge requiere evaluar el padre
principal antes de usar `-m`; no adivinarlo.

Revisar el diff, validar lo afectado y abrir un PR con causa, evidencia y efectos.
Nunca usar reset destructivo, force push, borrado de trabajo o reescritura de
historial compartido como rollback rutinario. No deshabilitar checks para integrar
una reversión: si se revierte el propio workflow, preparar una verificación
equivalente y coordinar la transición antes de cambiar el requisito remoto.

### Ensayo realizado (solo repositorio)

En `/tmp/opencode/ss-ci-recovery`, worktree separado y detached en
`747da95475b5bf9e98c96142e9b6c8849084f32f`, se ejecutó:

```bash
git revert --no-commit 747da95475b5bf9e98c96142e9b6c8849084f32f
git diff --cached --check
git diff --exit-code e7b9cef9dc1a118c5965291c64a4e4c6f1c0da81 --
```

Resultado: exit 0; se quitaron exactamente los tres archivos introducidos por el
commit de implementación y el árbol volvió al contenido de la base. No se creó
commit de reversión ni se publicó. Esto verifica reversión de **ese commit** en
Git, no la reversión del eventual squash final ni el funcionamiento del sitio o
la satisfacción del check requerido después de retirar CI. Reensayar sobre el SHA
integrado concreto antes de una recuperación real.

## Datos, fotografías y migraciones

Revertir código no restaura datos ni deshace una migración. Antes de una operación
autorizada, respaldar base y almacén de fotos, identificar versión de esquema,
detener escrituras si el procedimiento lo requiere y probar restauración en un
destino aislado. No copiar bases o credenciales al repositorio. Las migraciones
actuales tienen tests locales de atomicidad/rollback, pero **no se ensayó una
restauración desde backup ni recuperación de Turso/Blob** en este ciclo.

Seguir `scripts/database-migration.md`. No sustituir un respaldo por el ledger de
Prisma ni ejecutar migraciones destructivas como método de recuperación.

## Entrega autorizada

No se creó release ni tag en este ciclo. Cuando se autorice una entrega, registrar
versión acordada, SHA integrado con CI aprobado, cambios, esquema, respaldo y
ensayo de restauración si aplica, prueba de humo del entorno autorizado y plan de
recuperación con responsable. La prueba de humo debe incluir sesión, negocio
propio, creación/persistencia y aislamiento usando datos sintéticos.

Crear etiqueta/release solo tras autorización y comprobar que apunta al SHA
validado. Un build o preview local/remoto no constituye una entrega a producción.
