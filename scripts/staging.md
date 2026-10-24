# Entorno HTTPS de pruebas — 24/10/2026

## Resultado actual

Existe un **HTTPS local operativo**, no un despliegue público: `https://localhost:3443`.
Se ejecuta Next en modo producción detrás de un proxy TLS local, ambos enlazados
solo a `127.0.0.1` (TLS 3443; Next 3104). El certificado autofirmado dura 30 días;
no se instaló una CA ni se desactivó la validación TLS. No es todavía un origen
confiable/accesible para el WebView Android ni para otros dispositivos.

No se consultaron recursos remotos ni se cargaron `.env`, `.env.local` o `.vercel`
del proyecto. El grafo existente no encontró coincidencias para despliegue; el
diagnóstico se contrastó directamente con código y scripts actuales.

## Preparación local reproducible

Requisitos existentes: Node 22.22.2, dependencias instaladas y OpenSSL.

```bash
node scripts/staging-local.mjs prepare
node scripts/staging-local.mjs build
node scripts/staging-local.mjs test
node scripts/staging-local.mjs start
# En otra terminal:
node scripts/staging-smoke.mjs
```

`prepare` copia fuentes/configuración y recursos públicos a
`artifacts/staging-local/workspace`; excluye bases existentes y `public/uploads`.
Comparte únicamente las dependencias instaladas mediante enlace. No es un sandbox
de código no confiable: es aislamiento de configuración, datos y salidas de build.
Reejecutarlo actualiza archivos sin reiniciar la base ni eliminar fotos; si se
retiran fuentes del repositorio, preparar una copia nueva antes de validar esas
retiradas. No ejecutar `prepare`/`build` mientras ese servidor está atendiendo.

| Recurso | Ubicación/configuración local |
| --- | --- |
| Base de uso manual | `artifacts/staging-local/staging.db` (ruta absoluta en `DATABASE_URL`) |
| Base de regresión | `artifacts/staging-local/regression.db`, independiente de staging y `prisma/test.db` |
| Fotografías | `artifacts/staging-local/workspace/public/uploads` |
| Build | `artifacts/staging-local/workspace/.next` |
| Certificado/clave | `artifacts/staging-local/localhost.crt`, `localhost.key`; clave modo 0600 |
| QR | `APP_URL=https://localhost:3443`, destino local real, no válido como QR remoto |
| Proveedores | Turso, Blob y OpenAI explícitamente vacíos por proceso |

Todo ese directorio está ignorado por Git. El smoke test crea una cuenta sintética
con correo `.invalid` y contraseña aleatoria no registrada, comprueba la sesión y
la cierra. No constituye una cuenta manual reutilizable: para ella usar `/registro`
en este entorno y guardar la contraseña fuera del repositorio. Registrar las piezas
de ensayo mediante la aplicación; no importar datos de un negocio real.

Lint/TypeScript excluyen `artifacts`, que contiene copias de trabajo, resultados
y código generado. Las fuentes y sus pruebas permanecen incluidas. El primer lint
detectó la copia anidada y sus tipos generados; tras excluir este directorio de
artefactos, lint y tipos aprobaron.

## Propuesta concreta: Vercel + Turso + Blob exclusivos de QA

El frontend SSR y `/api` deben compartir **el mismo origen**. SQLite local y las
fotos del filesystem no son persistencia válida en funciones Vercel. El código
ya selecciona Turso por `TURSO_DATABASE_URL` y Blob por `BLOB_READ_WRITE_TOKEN`.
No hay migraciones de esquema pendientes de escribir para esta preparación.

Recursos propuestos (nombres solicitados, no identificadores ni URLs existentes):

- Proyecto Vercel **`segunda-smart-qa`**, separado del proyecto enlazado en `.vercel`.
- Base Turso nueva **`segunda-smart-qa-db`**, vacía, con token exclusivo.
- Almacén Vercel Blob público nuevo **`segunda-smart-qa-photos`**, exclusivo del
  proyecto QA. Las fotos del catálogo son públicas por diseño: usar imágenes de ensayo.
- Node 22, preset Next.js, instalación `npm ci`, build `npm run build`.
- IA externa desactivada inicialmente; funciona la alternativa local editable.

Vercel proporciona HTTPS con certificado público. La URL se obtiene **del recurso
creado**, no se deduce de estos nombres. No hay todavía una URL pública identificada.
Usar el dominio estable del proyecto QA para `APP_URL` y para Android, evitando
cambiar de origen entre páginas o depender de un enlace de deploy efímero.

### Variables que faltan en el proyecto QA

| Variable | Valor/procedencia |
| --- | --- |
| `DATABASE_URL` | `file:./unused-qa.db`, solo requerido por el esquema/generación Prisma; no es la persistencia Vercel |
| `TURSO_DATABASE_URL` | URL real de la base **nueva** entregada por Turso; obligatoria en runtime QA |
| `TURSO_AUTH_TOKEN` | Token real de esa base nueva; secreto de servidor |
| `BLOB_READ_WRITE_TOKEN` | Token real del almacén **nuevo** de fotografías; secreto de servidor |
| `APP_URL` | Origen HTTPS estable real que asigne Vercel al proyecto QA |
| `OPENAI_API_KEY` | Omitida; no reutilizar credenciales existentes |
| `OPENAI_MODEL` | Omitida; predeterminado `gpt-4o-mini` si se habilitara IA |
| `ANDROID_POC_ORIGIN` | En la terminal que genera el APK, el mismo origen HTTPS real; no es variable del backend |

El archivo `unused-qa.db` es únicamente un valor local de configuración, no una
dirección de un servicio existente. Nunca desplegar QA sin Turso/Blob: el código
recurre a almacenamiento local cuando faltan estas variables. Las sesiones están
en la base; no existe un `SESSION_SECRET` adicional que aprovisionar.

### Pasos después de autorizar el aprovisionamiento

1. Elegir cuenta/equipo y presupuesto. Crear una copia limpia independiente del
   checkout revisado, sin `.env*`, `.vercel`, bases ni fotografías. No ejecutar
   `vercel link`, `env pull` ni `--prod` desde la raíz ya vinculada. Conservar las
   mejoras locales que se quieran publicar en esa copia; revisar el diff antes.
2. Instalar/ejecutar Vercel CLI (no está en PATH en esta sesión), autenticar con el
   mecanismo oficial y crear/enlazar **solo** el proyecto QA nuevo desde esa copia.
   Crear Turso y Blob nuevos mediante sus paneles/integración; comprobar los IDs.
   No seleccionar recursos existentes por similitud de nombre.
3. Configurar las variables anteriores en el proyecto QA. El entorno Production
   de **ese proyecto separado** puede servir como QA estable; eso no autoriza
   tocar el proyecto de producción comercial. Si se habilita Preview, asignarle
   solo recursos QA, nunca variables heredadas del proyecto original.
4. En un archivo local `.env.staging.local` ignorado y con permisos 0600, guardar
   únicamente las dos variables Turso del recurso QA nuevo. Aplicar migraciones
   desde la copia revisada:

   ```bash
   node --env-file=.env.staging.local scripts/init-turso.mjs
   ```

   Es una operación **remota todavía no ejecutada**; verificar antes la identidad
   de la base. No usar `db:init:turso`, que carga la `.env.local` preexistente.
5. Desplegar desde la copia enlazada al nuevo proyecto QA. Capturar la URL asignada,
   fijarla en `APP_URL` y volver a desplegar si se estableció después del primer
   build. Confirmar certificado público, redirecciones al mismo origen y `/login`.
   Si Deployment Protection intercepta el WebView, configurar un acceso QA
   compatible en ese proyecto; no incrustar tokens de bypass en el APK. La
   autenticación propia de SegundaSmart debe seguir activa.
6. Crear dos cuentas/negocios **sintéticos** por `/registro`; comprobar aislamiento,
   producto/foto, IA local editable, QR, venta única y retirada del catálogo. Validar
   límites de carga también en Vercel (el cliente comprime a <=4 MiB y la plataforma
   puede limitar el cuerpo antes del backend). Confirmar persistencia tras redeploy.
7. Solo con la URL real comprobada, introducirla en la terminal de Android:

   ```bash
   read -r -p 'Origen HTTPS real del proyecto QA: ' ANDROID_POC_ORIGIN
   export ANDROID_POC_ORIGIN
   npm --prefix mobile/android-poc run android:sync
   ```

   Compilar con JDK 21/SDK 36, inspeccionar el origen dentro del APK e instalar con
   `adb install -r` sobre el serial observado. Completar A–J del README Android.

**Autorización externa necesaria:** crear los tres recursos nuevos en la
cuenta/equipo que se indique, aceptar sus eventuales costes y publicar este código
como servidor QA accesible por Internet, con datos sintéticos y fotografías de
ensayo. Esta solicitud no autoriza migrar, leer ni enlazar recursos de producción.
No se abrió túnel, creó recurso, migró Turso ni publicó despliegue en esta sesión.

## AVD inspeccionado y arranque actual

El SDK existe en `/tmp/opencode/android-sdk`; `adb`/`emulator` no están en PATH.
La lista predeterminada de AVD está vacía, pero con el directorio explícito aparece
**`SegundaSmart_API36`**, único AVD localizado en el directorio de este experimento.

```bash
export ANDROID_HOME=/tmp/opencode/android-sdk
export ANDROID_AVD_HOME="$PWD/artifacts/android-cycle2/avd"
"$ANDROID_HOME/emulator/emulator" -list-avds
"$ANDROID_HOME/emulator/emulator" -avd SegundaSmart_API36 -port 5556 -no-window -no-audio -no-boot-anim -no-snapshot -gpu host -feature -Vulkan -accel on -memory 2560 -cores 2 -camera-back emulated -camera-front none
```

Arranque en frío sin cargar/guardar snapshots; **sin `-wipe-data`, recreación de
AVD, desinstalación ni borrado de userdata**. El primer lanzamiento no sobrevivió
al timeout de la terminal; el segundo desacoplado sí. Log local:
`/tmp/opencode/segundasmart-avd.log`.

Evidencia actual:

```text
adb devices -l
emulator-5556  device product:sdk_phone64_x86_64 model:Android_SDK_built_for_x86_64 device:emu64x
adb -s emulator-5556 shell getprop sys.boot_completed
1
Android release: 16; API: 36
pm path com.segundasmart.poc: package:/data/app/.../base.apk
```

La ruta de paquete se abrevia para documentarla; la consulta real devolvió una
ruta instalada. Esto confirma que el paquete previo sigue presente, no su acceso
funcional al servidor. No se reinstaló ni abrió la aplicación con el origen de
ejemplo previo. El AVD queda encendido. Para detenerlo conservando datos:
`/tmp/opencode/android-sdk/platform-tools/adb -s emulator-5556 emu kill`.

## Matriz de verificación actual

| Comprobación | Resultado |
| --- | --- |
| Migraciones SQLite aisladas | APROBADAS; staging y regresión separadas |
| Build producción local | APROBADO; Next 15.5.22, 19 páginas generadas |
| Linter y TypeScript estricto | APROBADOS tras excluir copias de artefactos |
| Suite web SQLite | APROBADAS: 165 pruebas / 16 archivos |
| Política de configuración Android | APROBADAS: 2 / 2; no son flujo Android |
| HTTPS local con CA explícita | APROBADO; `/login` HTTP 200, sin `-k` |
| Smoke HTTPS | APROBADAS 6 comprobaciones: acceso, API privada 401, registro 201, cookie Secure/HttpOnly/Lax, sesión 200 y revocación tras logout |
| AVD y adb | APROBADO; `emulator-5556 device`, boot completo |
| Despliegue Vercel y DNS/TLS público | **NO EJECUTADAS**; requiere autorización/aprovisionamiento |
| Turso/Blob remotos y persistencia en redeploy | **NO EJECUTADAS** |
| Flujo móvil/responsive de este entorno | **NO EJECUTADAS**; no se ejecutó navegador móvil |
| Recorrido Android A–J, cámara, fotos y red | **NO EJECUTADAS**; falta origen público real configurado |
| Compilación/lint/instalación APK con nuevo origen | **NO EJECUTADAS**; aún no existe ese origen |
| OpenAI remoto y dispositivo físico | **NO EJECUTADAS** |

Los primeros intentos del smoke asumieron redirección HTTP inmediata en una página
SSR (puede responder 200 con redirección en streaming) y GET en una ruta solo POST
(405); se corrigió la comprobación a POST privado sin sesión (401). La última
pasada completa del smoke aprobó. No se atribuyen esos errores del comprobador a
fallos del producto ni se reutilizan resultados históricos como pruebas actuales.

El servidor local queda encendido; log `/tmp/opencode/segundasmart-staging.log`.
En uso interactivo, Ctrl+C sobre `staging-local.mjs start` detiene proxy y Next.
En el arranque desacoplado, identificar el PID de ese comando antes de enviarle
SIGTERM; no usar un cierre global de procesos Node. Conservar base/fotos si se
quieren reutilizar. No hay un despliegue remoto que revertir.
