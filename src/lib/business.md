# Creación y acceso a negocios

## Causa y reproducción

El alta existente (`AuthForm` → `/api/auth/register`) creaba cuenta y primer negocio juntos. Una cuenta autenticada se redirigía de `/registro` a `/app`, sin formulario ni API para crear otro negocio. En SQLite local independiente se obtuvo `201` al registrar una cuenta y `404` al enviar una solicitud autenticada a `/api/negocios`. No se detectó una variable de configuración faltante en este entorno.

## Contrato

- `/app/negocios`, accesible desde el nombre del negocio en móvil y `Mis negocios` en escritorio, lista exclusivamente negocios propios.
- `POST /api/negocios`: sesión vigente, `name` de 2–100 caracteres después de recortar espacios y `requestKey` UUID. Devuelve `201 { id }`. El usuario propietario proviene exclusivamente de la sesión.
- Negocio, `BusinessOwnership` y actualización del negocio activo se confirman en la misma transacción. Un fallo revierte los tres. `(userId, requestKey)` es único: un reintento de la misma solicitud devuelve el negocio ya creado.
- `GET /api/negocios/[id]`: devuelve únicamente ID y nombre al propietario; devuelve `404` para un ID ajeno o inexistente.
- `POST /api/negocios/[id]`: selecciona un negocio propio dentro de una transacción. Sin propiedad responde `404` y no cambia la cuenta. No permite editar datos ni transferir propiedad.
- Sin sesión vigente, las tres operaciones responden `401`. JSON y campos inválidos en creación responden `422`; un fallo de persistencia devuelve un error recuperable sin exponer detalles internos.
- `User.businessId` sigue siendo el negocio activo de la cuenta, compartido por todas sus sesiones; las políticas existentes de piezas y ventas siguen usando ese valor recuperado en el servidor. El catálogo conserva su acceso público y solo muestra piezas disponibles.
- El formulario captura los datos antes de bloquear campos, usa un bloqueo síncrono para doble clic y conserva nombre y clave tras errores para permitir reintento. El éxito abre `/app`, mostrando el nombre del negocio creado.

## Compatibilidad y migración

`20261022000000_business_ownership` añade una tabla e índices, sin reconstruir ni borrar tablas existentes. Copia las asociaciones anteriores usuario-negocio a propiedad (el contrato previo creaba una cuenta y su negocio juntos). El registro nuevo crea la relación dentro de su transacción existente. No se cambia el negocio activo previo durante la migración ni se mueven piezas o ventas.

El ejecutor local reconoce tanto el esquema previo como el actualizado, comprueba la definición de la nueva tabla e índices y aplica tabla, backfill e índices atómicamente. Los tests verifican conservación de usuarios, sesiones y negocios, rollback del backfill, reintento e idempotencia. La creación y selección nuevas requieren aplicar esta migración antes de usar el código actualizado. No se han aplicado cambios a bases reales o remotas.

## Verificación reproducible sin reset de bases existentes

Usa un nombre nuevo de base temporal para cada ejecución. Las pruebas de la aplicación limpian exclusivamente la base indicada en `DATABASE_URL`; no apuntar a datos reales.

```bash
DATABASE_URL=file:/tmp/opencode/ss-business-tests.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= npx prisma migrate deploy
DATABASE_URL=file:/tmp/opencode/ss-business-tests.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= npx vitest run
npm run lint
npm run typecheck
DATABASE_URL=file:/tmp/opencode/ss-business.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= npm run build
```

Las pruebas HTTP nuevas usan las funciones reales de autenticación, hash de contraseñas y sesiones persistentes; solo sustituyen el contenedor de cookies de Next y seleccionan Prisma local. Cubren una sesión nueva después de crear, dos usuarios independientes y los endpoints reales de consulta, selección, QR y venta. Las pruebas de rollback inyectan un fallo SQLite después de insertar negocio y propiedad, antes de confirmar la selección.

La verificación móvil se ejecutó en Chrome headless contra la compilación de producción servida localmente en `127.0.0.1:3100`, con una base SQLite independiente. No verifica Turso remoto, despliegues, teléfonos físicos ni lector de pantalla.
