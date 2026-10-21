# Ejecutor de migraciones

`migrate-database.mjs` conserva su contrato `{ url, authToken }`, resolución de
URLs locales relativas a `prisma/` y cierre del cliente. El auxiliar
`database-migration.mjs` permite probar el mismo ejecutor sin cargar `.env`.
No se modifican los SQL versionados ni se añade un ledger de migraciones.

## Atomicidad y reintento

- Una sola llamada `executeMultiple` contiene `foreign_keys=OFF` **antes** de
  `BEGIN IMMEDIATE`, todas las modificaciones, la validación y `COMMIT`.
- No se usa `batch`: abre la transacción antes de ejecutar el PRAGMA y SQLite
  ignora ese cambio dentro de una transacción. Tampoco se depende de compartir
  conexión entre llamadas independientes al cliente HTTP.
- Un `CHECK` en una tabla temporal comprueba, dentro de la transacción, que el
  esquema inspeccionado no cambió, FK realmente está desactivado y
  `pragma_foreign_key_check` no devuelve infracciones antes de confirmar.
- El cliente local revierte una secuencia fallida; en HTTP el cierre del stream
  de la secuencia revierte la transacción no confirmada. Se restaura FK para la
  conexión local también en caso de error. La configuración FK no es global:
  cada conexión de la aplicación debe mantenerla activada.
- Se verifican las definiciones de tablas (columnas, defaults, PK, CHECK y FK)
  y de todos los índices versionados (columnas, unicidad y predicados), no solo
  `reference`/`defects`. Se toleran diferencias de espacios y comillas de
  identificadores; los literales SQL se conservan al comparar.
- Los índices ausentes se recrean atómicamente. Duplicados que impidan recrear
  unicidad causan rollback, nunca una confirmación parcial.
- Un esquema parcial, restricciones diferentes, índices incompatibles o una
  tabla residual `new_Product` requieren revisión/restauración manual. No se
  eliminan restos que podrían ser la única copia de datos. No se promete
  recuperar pérdidas causadas por ejecuciones antiguas sin transacción.

## Límites operativos y Turso

Ejecutar con respaldo y una ventana de mantenimiento exclusiva, sin otros
migradores ni escrituras de aplicación. No se requiere escritura en disco en
serverless para bases remotas. La secuencia usa SQLite/libSQL estándar y el
stream de `@libsql/client` 0.8.1; no necesita transacciones interactivas remotas.
Un servidor que no permita `foreign_keys=OFF`, tablas temporales o PRAGMA como
función de tabla falla sin confirmar la migración. Una pérdida de conexión
después de `COMMIT` puede dar resultado ambiguo al invocador: repetir es seguro
y vuelve a verificar el esquema y las FK.

Las pruebas focalizadas usan libSQL/SQLite real en directorios temporales del
sistema, sin leer entorno ni tocar `prisma/dev.db` o `prisma/test.db`:

```sh
npx vitest run src/lib/database-migration.test.ts
```

No equivalen a una prueba contra Turso remoto: integración debe confirmar la
secuencia en una base Turso desechable con sus credenciales y versión de
servidor. El comparador es deliberadamente conservador, no un parser de
equivalencia semántica de SQL. El separador de sentencias está acotado a los
dos archivos actuales, sin triggers ni `;` dentro de literales: si se agregan
migraciones, debe ampliarse el ejecutor y sus pruebas.

Integración incorporó este contrato a la sección Operación de README. Linter,
tipos, las 137 pruebas globales (incluidas 15 de migraciones) y compilación
aprobaron. Esta evidencia local no sustituye la comprobación remota en Turso.
