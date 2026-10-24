# Prueba Android de SegundaSmart — ciclos 1 y 2

Estado actual: **PARCIAL/BLOQUEADO: APK debug construido, instalado y abierto en
emulador; HTTPS de pruebas y recorrido funcional Android pendientes**.
Es un experimento debug aislado.
Base inspeccionada: `e7b9cef`. Trabajo iniciado el 23/10/2026; logs UTC del 24/10.

## Ciclo 2 — ejecución y evidencia

Se conserva Capacitor 8.5.3 con Next SSR remoto; no hubo incompatibilidad que
justificara cambiar arquitectura. No se realizaron commits, publicaciones ni
comandos de migración; se conservaron los cambios previos de usuario.

### Herramientas comprobadas

- Fedora 43 / Linux 7.2.11 x86_64, Ryzen 5 5625U, 14 GiB RAM; 181 GiB libres
  inicialmente en workspace. `/dev/kvm` legible/escribible y AMD-V presente.
- Node 22.22.2, npm 10.9.7; `npm ci` en raíz y experimento sin cambiar lockfiles.
- JDK **21.0.12.1** de Fedora ya instalado; se seleccionó en cada proceso con
  `JAVA_HOME`/`PATH` y `-Dorg.gradle.java.home`. Launcher y daemon de Gradle 8.14.3
  comprobados en Java 21. JDK 25 sigue siendo el predeterminado global.
- SDK local **`/tmp/opencode/android-sdk`**: plataforma 36 rev 2, Build Tools
  **35.0.0** (mínimo/predeterminado de AGP 8.13.0 según
  [documentación oficial](https://developer.android.com/build/releases/agp-8-13-0-release-notes)),
  platform-tools 37.0.1, adb 1.0.41. No se cambió targetSdk para instalar SDK.
- Command-line Tools **23.0**, descargadas desde el repositorio oficial y
  verificadas con su checksum. El nuevo launcher `sdkmanager` intentó descargar
  otra CLI y terminó con versión `unknown`; **ese exit 0 no se consideró PASS**.
  Se usó la implementación Java oficial incluida en el mismo paquete (ver abajo),
  que reportó 23.0, instaló los paquetes y gestionó los prompts reales de licencia.
- Android Studio/Gradle de IDE no se ejecutaron; las comprobaciones son del wrapper
  CLI. Si se abre en IDE, seleccionar explícitamente el mismo JDK de Gradle.

### Resultado de build y fotografías

`./gradlew :app:lintDebug :app:testDebugUnitTest :app:assembleDebug --no-daemon
-Dorg.gradle.java.home=/usr/lib/jvm/java-21-openjdk` desde `android/`:
**exit 0, BUILD SUCCESSFUL, 128 tareas ejecutadas**. Lint sin errores, con avisos
de plantilla/dependencias sin ocultarlos. La prueba Java de plantilla no acredita UX.

APK actual: `android/app/build/outputs/apk/debug/app-debug.apk`, **4.120.159 bytes**,
2026-10-24T06:40:21Z, appId `com.segundasmart.poc`, debug, versión 1.0/code 1,
minSdk 24/compileSdk y targetSdk 36. Firma v2 verificada con `apksigner`.
SHA-256:

```text
5e8d2de4de55d64db265b81055f5f568c519584fc3c32e15f569fd0c931e71ca
```

**Instalación/apertura observadas:** emulador 37.2.12, imagen AOSP x86_64 API 36
rev 2, Android 16, perfil virtual Pixel 5 (modelo reportado `Android SDK built for
x86_64`), WebView **133.0.6943.137**, serial `emulator-5556`. `adb install -r`
terminó en `Success`; `am start -W` en `Status: ok`; proceso vivo y pantalla local
«No se pudo conectar» capturada en `artifacts/android-cycle2/android-launch.png`.
No es acceso a HTTPS de pruebas ni sesión Android. Dispositivo/cámara físicos
**NOT_RUN**; no había dispositivo físico conectado.

La descarga inicial del emulador falló; se recuperaron sus archivos oficiales
por rangos HTTPS con checksum validado (helpers/evidencia local en `artifacts/android-cycle2/`).
El registro local del paquete usó metadata oficial y el esquema genérico local
del propio SDK, sin fabricar aceptación de licencias. Los arranques SwiftShader
terminaron con SIGSEGV incluso sin KVM/Vulkan; un stack saneado señaló
`libGLESv2.so`. **GPU del host + Vulkan desactivado + KVM** sí permitió arrancar.
No se modificaron kernel, seguridad global, arquitectura ni dependencias de la app.

**Este APK conserva el origen de ejemplo heredado**; es un artefacto diagnóstico,
no evidencia de acceso al servidor de pruebas. Se ejecutó `npx --no-install cap
sync android` sobre la configuración existente para verificar sincronización y
build. No se generó un origen real ficticio. Falta un HTTPS autorizado que sirva
este checkout, con datos/almacén de pruebas y acceso de una cuenta de pruebas.
No se ha desplegado la compresión al servidor remoto ni se ha abierto un túnel.

Inspección del origen/sesión: las pantallas SSR y `fetch` relativos comparten
servidor; no hay backend local empaquetado. La sesión propia usa cookie HttpOnly,
SameSite=Lax, Secure en producción, duración de 30 días y hash de token en servidor
(`src/lib/auth.ts`). No se identificaron callbacks OAuth, cabeceras CORS ni una
comprobación CSRF/Origin explícita en los Route Handlers inspeccionados; no se
añadieron excepciones ni se modificó ese contrato para el contenedor. La cookie
real de WebView, redirects y restricciones de navegación requieren los casos 02/14.

Fotografías: preprocesamiento real añadido en el formulario compartido con worker,
EXIF aplicado, lado <=2048, JPEG <=4 MiB, eliminación de EXIF/GPS, tiempo e intentos
acotados, cancelación/errores sin perder el formulario. Backend intacto, límite
exacto **5.242.880 bytes (5 MiB)**. Contrato:
[`src/lib/photo-client.md`](../../src/lib/photo-client.md).

Regresión web contra SQLite aislada: **165 pruebas/16 archivos**, linter, tipos
y build aprobados. **22 comprobaciones de Chrome headless a 390px**: fotografía
pública real 14.679.474 →395.900 bytes y 10109×4542→2048×921, foto pequeña sin
ampliación, EXIF 6 vertical, carga/persistencia real, error 422 recuperable,
archivo corrupto, doble envío bloqueado, cancelación DOM, offline antes de guardar
y recuperación explícita. Esto **no sustituye pruebas Android** ni cámara física.
Tras el build nativo se añadió a ESLint únicamente la exclusión de las carpetas
Gradle `mobile/android-poc/android/**/build/**`: contenían `native-bridge.js`
generado por Capacitor. No se excluyeron fuentes del experimento ni pruebas.

Evidencia local ignorada: `artifacts/android-cycle2/` (`initial.md`, logs y JSON con
comandos/códigos, `photo-web-qa.mjs/.json`, capturas). APK y descargas no se suben
al repositorio. Matriz con precondiciones, pasos, esperado, observado y estado:
**[ACCEPTANCE.md](ACCEPTANCE.md)**. La falta de idempotencia del alta sigue siendo
un riesgo de respuesta perdida: consultar inventario antes de repetir.

### Reproducción de este entorno (CLI)

Desde la raíz, en una sesión con el SDK ya instalado:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=/tmp/opencode/android-sdk
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
java -version
javac -version
adb version
```

Si el bootstrap de herramientas 23.0 no funciona, la implementación Java incluida
se puede invocar en esa sesión, sin reemplazar los ejecutables instalados:

```bash
sdkmanager_java() {
  "$JAVA_HOME/bin/java" -cp "$ANDROID_HOME/cmdline-tools/latest/lib/avdmanager-classpath.jar:$ANDROID_HOME/cmdline-tools/latest/lib/sdklib/tools.sdklib.jar" com.android.sdklib.tool.sdkmanager.SdkManagerCli --sdk_root="$ANDROID_HOME" "$@"
}
sdkmanager_java --version
sdkmanager_java --list_installed
# Instalación si faltan: responder a los prompts de licencia oficiales.
sdkmanager_java --install 'platforms;android-36' 'build-tools;35.0.0' platform-tools
```

Desde `mobile/android-poc`, **solo después de recibir el origen autorizado**:

```bash
npm ci --prefer-offline --ignore-scripts --no-audit --no-fund
npm test
: "${ANDROID_POC_ORIGIN:?Define el origen HTTPS de pruebas autorizado}"
npm run android:sync
npm run doctor
```

Desde `mobile/android-poc/android`:

```bash
./gradlew --version
./gradlew :app:lintDebug :app:testDebugUnitTest :app:assembleDebug --no-daemon -Dorg.gradle.java.home="$JAVA_HOME"
sha256sum app/build/outputs/apk/debug/app-debug.apk
adb devices -l
# Elegir un serial operativo/autorizado observado, sin asumirlo.
: "${ANDROID_SERIAL:?Define el serial observado en adb devices}"
adb -s "$ANDROID_SERIAL" install -r app/build/outputs/apk/debug/app-debug.apk
adb -s "$ANDROID_SERIAL" shell am start -W -n com.segundasmart.poc/.MainActivity
```

Arranque que funcionó en esta máquina, desde la raíz (crear AVD solo si ese nombre
no existe; no usar `--force` sobre un AVD con datos existentes):

```bash
sdkmanager_java --install emulator 'system-images;android-36;default;x86_64'
export ANDROID_AVD_HOME="$PWD/artifacts/android-cycle2/avd"
mkdir -p "$ANDROID_AVD_HOME"
avdmanager list avd
avdmanager create avd --name SegundaSmart_API36 --package 'system-images;android-36;default;x86_64' --device pixel_5
"$ANDROID_HOME/emulator/emulator" -accel-check
"$ANDROID_HOME/emulator/emulator" -avd SegundaSmart_API36 -port 5556 -no-window -no-audio -no-boot-anim -no-snapshot -gpu host -feature -Vulkan -accel on -memory 2560 -cores 2 -camera-back emulated -camera-front none
```

El comando de emulador permanece en primer plano; usar otra terminal con el mismo
SDK para `adb devices -l`. No tomar `offline` por un destino operativo. En esta
sesión se utilizaron procesos supervisados con logs/códigos en el directorio de
evidencia. La cámara se configuró emulada, pero **no se ejecutó captura**: falta el
formulario remoto. No equivale a hardware físico.

No se creó `local.properties`: el wrapper recibió `ANDROID_HOME`. Si se usa ese
archivo para IDE, sigue ignorado. `/tmp` es temporal: perderlo exige reinstalar SDK
y restaurar un entorno de datos de pruebas autorizado, no cambiar rutas en Git.
El contenido web se construye con `npm run build` en raíz y debe servirse en el
HTTPS de pruebas; no se copia `.next` al APK. Los checks de este ciclo usaron
`DATABASE_URL=file:/tmp/opencode/ss-android-cycle2.db` y proveedores remotos vacíos.

### Reversión acotada del ciclo 2

- Revisar cambios posteriores antes de revertir. `ProductForm.tsx` estaba limpio
  al inicio: revertir solo sus cambios de este ciclo. Retirar únicamente los nuevos
  archivos `src/lib/photo-client.ts`, `photo-worker.ts`, `photo-dimensions.ts`,
  `photo-dimensions.test.ts`, `photo-limits.ts` y `photo-client.md` si no tienen
  trabajo posterior. Restaurar solo el párrafo de fotografías en README raíz,
  **conservando el enlace Android previo**.
- Retirar este apartado de ciclo 2 y `ACCEPTANCE.md` si se revierte documentación;
  conservar todo el proyecto Android y el registro del ciclo 1 preexistentes.
  No retirar `mobile/` entero para revertir este ciclo.
- Revertir solo la entrada de directorios Gradle añadida a `eslint.config.mjs`
  si también se retiran esos resultados generados; conservar las exclusiones previas.
- Ninguna migración que revertir. No borrar bases/fotos existentes. El SDK y
  descargas locales pueden conservarse; variables se seleccionaron por proceso,
  sin modificar alternativas globales de Java ni configuración de IDE.
- Detener únicamente servidores/emulador de esta prueba, verificando PID/serial.
  Para el AVD creado aquí: `adb -s emulator-5556 emu kill` tras comprobar el serial.
  No desinstalar ni borrar datos de un teléfono ajeno; desinstalar la prueba borra
  su sesión y requiere verificar previamente el impacto.

Al finalizar este ciclo se detuvieron el servidor de pruebas local y el AVD;
puertos 3102/5556/9334 cerrados y sin destinos adb, conservando los datos del AVD.
Evidencia: `artifacts/android-cycle2/shutdown.log/.json`. Para continuar, arrancar
el emulador con el comando verificado de GPU host; el único acceso externo que
falta para el recorrido es el HTTPS de pruebas autorizado con esta versión y
permiso para una cuenta de pruebas. La captura física requiere además hardware.

---

## Archivo histórico — ciclo 1 (estado al iniciar el ciclo 2)

Las secciones siguientes conservan el diagnóstico y los comandos del primer ciclo;
las afirmaciones de herramientas/fotos/APK faltantes describen **ese momento**.

## Observación y estado real

- Next.js 15.5.22 / React 19 / TypeScript estricto. Las pantallas privadas son
  Server Components y dependen del servidor; `.next` no es un `webDir` estático.
- Backend en Route Handlers, Prisma 6.12 / SQLite o Turso. Sesión de 30 días
  mediante cookie `segunda_session` HttpOnly, SameSite=Lax, Secure en producción;
  el servidor conserva solamente el hash del token (`src/lib/auth.ts`).
- **Sí hay creación de negocios**: `/registro` crea cuenta, negocio y propiedad
  en transacción; `/app/negocios` y `POST /api/negocios` permiten crear otro con
  sesión. La selección exige propiedad (`src/app/api/negocios/[id]/route.ts`).
  Las 12 pruebas de negocios aprobadas cubren registro, acceso posterior,
  aislamiento, caducidad, reintentos y rollback. Esto verifica el código local,
  no la disponibilidad del despliegue remoto ni el registro desde Android.
  Si el servidor elegido carece de esas migraciones/rutas, usuarios nuevos no
  podrán incorporarse; comprobarlo antes de usar la prueba.
- Fotografías: multipart, Sharp verifica decodificación, formato y límites;
  almacén local `public/uploads/<businessId>` o Vercel Blob. El formulario
  admite JPEG/PNG/WebP hasta 5 MB y pide captura trasera. **No hay compresión
  cliente**: las fotos grandes de cámaras reales pueden rechazarse.
- Ventas: transacción, reclamación condicional AVAILABLE→SOLD por negocio y
  unicidad de `Sale.productId`; no se confirma éxito antes de la respuesta.
  Una respuesta perdida exige consultar inventario/historial: un reintento
  de la misma pieza da conflicto y no otra venta. El alta de producto no tiene
  clave idempotente: no reintentar automáticamente una respuesta perdida.
- Existentes en web: inventario con búsqueda/paginación, ventas y ganancias,
  QR descargable, lector web, catálogo/compartir, IA editable con alternativa
  local. **No comprobados en Android**: todas esas capacidades y sus APIs web.
- Cambios de usuario encontrados y conservados: `.opencode/README.md` y
  `.opencode/agents/ss-ingeniero.md`. No hay cambios de esquema/API para Android.

## Decisión de arquitectura provisional

| Alternativa | Reutilización y backend | Dispositivo / navegación / teléfono modesto | Mantenimiento |
| --- | --- | --- | --- |
| Capacitor | Reutiliza pantallas web solo si hay servidor SSR o adaptación a cliente estático. Mismo origen conserva cookies y APIs actuales. | Selector/cámara vía WebView, QR depende de APIs o plugin; Atrás, teclado y áreas seguras requieren prueba. Conserva coste de red/SSR y JS web (~102 kB compartidos en build local). | Menor superficie inicial para una persona; empaquetar assets locales requeriría separar pantallas dependientes del servidor y resolver auth/CORS. |
| React Native | Reutiliza validaciones/tipos puros, no DOM, CSS ni Server Components. Necesita nuevas pantallas y definir lectura de datos/autenticación móvil. | Navegación y cámara/QR con módulos nativos; mejor control, coste de dependencias y pruebas. Rendimiento debe medirse. | Dos interfaces y más contratos que mantener. |
| Kotlin nativo | Reutiliza backend y contratos, prácticamente ninguna interfaz. Tampoco existe hoy API de listado equivalente a todas las consultas Server Component. | Máximo control de cámara, Photo Picker, QR y ciclo de vida; no demuestra por sí solo mejor rendimiento comercial. | Mayor coste inicial de reimplementación para un desarrollador independiente. |

**Elegida para el experimento: Capacitor 8.5.3 con web alojada en HTTPS de pruebas.**
La documentación oficial marca `server.url` y `allowNavigation` como opciones de
desarrollo, no de producción. Por eso se deshabilita la variante release en
`android/app/build.gradle`. No se ha aprobado una migración ni una arquitectura
de distribución. Primero validar cookie real + backend + selector del dispositivo;
después decidir entre adaptación estática Capacitor o una solución para web alojada
con soporte de distribución, contrastando costes. No copiar `.next` al APK.

### Límites de seguridad del experimento

- `ANDROID_POC_ORIGIN` exige HTTPS sin credenciales, rutas, consultas ni fragmentos;
  solo contiene una URL pública, nunca claves de Turso/Blob/OpenAI.
- `MainActivity` restringe documentos navegables al mismo esquema, host y puerto;
  enlaces HTTPS externos salen al navegador y otros esquemas se bloquean. Sin
  comodines `allowNavigation`, plugins adicionales ni interfaces JS propias.
  Los recursos de imágenes del servidor/Blob siguen siendo recursos web.
- Permanecen los plugins internos de Capacitor; las sustituciones de cookies y
  HTTP se desactivan. La sesión queda en el cookie jar privado de WebView;
  no se extrae a preferencias, localStorage o logs. Cookie de terceros desactivada,
  persistencia solicitada al pausar, backup desactivado y solo permiso INTERNET.
  FileProvider se limita a `Pictures/` privado externo de la aplicación, donde
  Capacitor crea las capturas; no expone la raíz del almacenamiento compartido.
- HTTPS con validación estándar, sin excepciones TLS, HTTP ni contenido mixto.
  Los permisos del manifest combinado todavía requieren revisión tras compilar.
- Página de error local sin puente nativo, scripts ni reenvío de POST: volver al
  acceso realiza GET y avisa de comprobar operaciones con respuesta perdida.
  No hay cola de escrituras ni sincronización sin conexión.
- Íconos/splash de plantilla identifican una prueba. No están preparados para tienda.

## MVP y aceptación pendiente en Android

Todos los pasos siguientes están respaldados por implementación web. No equivalen
a capacidades Android aprobadas hasta ejecutarlos en emulador/dispositivo.

| Paso | Comportamiento / aceptación | Dependencias / faltantes | Carga, vacío, error y desconexión |
| --- | --- | --- | --- |
| Acceso/registro | Credenciales correctas abren `/app`; incorrectas no. Registro crea primer negocio; logout y sesión caducada cierran acceso. Reiniciar conserva sesión vigente. | Cookie HTTPS real; servidor de pruebas y Android pendientes. | Botón bloqueado y error en formulario; sin sesión va a login; caída al abrir muestra página local. |
| Negocio autorizado | Crear/seleccionar uno propio, recargar y mantener selección; IDs ajenos rechazados. | Propiedad/migraciones existentes; selección es global por cuenta entre sesiones. | Estado de guardado, errores y reintento con requestKey; alta inicial evita cuenta sin negocio. |
| Foto/producto | Abrir selector/captura, cancelar sin perder texto, subir imagen real válida y ver pieza persistida; rechazar >5 MB/formato inválido. | Selector/cámara WebView pendientes; no compresión actual. | Vista previa, guardado bloqueado, error conserva formulario; tras respuesta perdida consultar antes de repetir. |
| Inventario | Mostrar solo negocio activo, foto y precio correctos, paginación y disponibilidad actual. | Consultas SSR existentes; medición en teléfono modesto pendiente. | Carga de ruta, inventario vacío, búsqueda sin resultados y reintento de foto; no prometer datos offline. |
| Venta | Confirmar pieza/importe; doble pulsación y dos clientes producen una sola venta; una pieza ajena da conflicto. | Transacción y unicidad existentes; prueba de interrupción real pendiente. | Envío bloqueado; sin piezas estado vacío; error conserva importe, 409 refresca disponibilidad; no confirmar sin servidor. |
| Resultado | Historial/ganancia exactos; vendida desaparece del catálogo sin sesión. | Resúmenes e historial existentes. | Carga de ruta; historial vacío; error de consulta y recuperación al reconectar. |

Después del recorrido principal: búsqueda (ya web), compartir HTTPS y QR generado;
lector de QR y cámara con permiso requieren otra validación pequeña. IA editable y
alternativa local existentes, integración remota no verificada. Sin pagos,
notificaciones ni sincronización completa offline.

## Reproducir configuración, compilación e instalación

Requisitos: Node >=22, **JDK 21** seleccionado en `JAVA_HOME` y `PATH`, Android SDK
con plataforma 36, build tools compatibles, platform-tools/adb; emulador o teléfono
con depuración USB. El template fija minSdk 24, compile/target 36, AGP 8.13.0 y
Gradle 8.14.3. La máquina inspeccionada tiene JDK 25, sin SDK ni adb en PATH.

Desde `mobile/android-poc`:

```bash
npm ci
npm test
# Sustituir por un servidor de PRUEBAS HTTPS accesible desde el dispositivo.
# qa.example.test es solo un ejemplo, no un servicio disponible.
ANDROID_POC_ORIGIN=https://qa.example.test npm run android:sync
npm run doctor
```

El proyecto `android/` está versionado. `android:add` solo se usa al regenerar un
proyecto eliminado intencionadamente: regenerar elimina las protecciones nativas
personalizadas y exige reaplicarlas/revisarlas. `android:sync` las conserva.
La configuración generada y assets copiados están ignorados; se recrean en cada sync.
No usar producción para pruebas de alta o venta. El servidor debe usar una base y
almacén fotográfico de pruebas y tener las migraciones existentes aplicadas.

Desde `mobile/android-poc/android`, una vez resuelto el diagnóstico:

```bash
./gradlew :app:lintDebug :app:testDebugUnitTest :app:assembleDebug --no-daemon
adb devices
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.segundasmart.poc/.MainActivity
```

Ruta esperada, **todavía no generada**: `android/app/build/outputs/apk/debug/app-debug.apk`.
No se garantiza compilación hasta resolver herramientas y ejecutar Gradle. La firma
debug la crea Android fuera de Git. No hay AAB ni configuración de firma release.

## Protocolo de validación en Android

Registrar modelo, Android/API, versión WebView, commit, origen de pruebas y evidencia
sin credenciales. Marcar cada caso aprobado/fallido, no solo capturar la pantalla:

1. Acceso incorrecto/correcto, registro de usuario nuevo, crear/cambiar negocio,
   rechazo de negocio ajeno, logout y sesión expirada.
2. Formulario en 360px de ancho útil, texto aumentado, teclado decimal y Atrás
   cerrando teclado antes de abandonar; áreas seguras con navegación por gestos.
3. Selector/cámara: elegir, cancelar, rotar y volver de segundo plano; permiso
   concedido/rechazado/revocado si se solicita. No conceder micrófono/almacenamiento
   global. Verificar foto de cámara real >5 MB y definir compresión si falla.
4. Alta, foto visible, inventario y venta; doble toque, dos sesiones compitiendo,
   desconexión antes/después de enviar y conciliación al recuperar conexión.
5. Resultado exacto y catálogo público sin la vendida. Red lenta, pantalla de error
   y GET de recuperación sin reenviar escrituras. Enlaces externos sin puente;
   bloquear HTTP, otro puerto y esquemas `intent:`, `javascript:` y `data:`.
6. Restauración tras cierre/reinicio, vuelta de segundo plano y cookie persistente;
   TalkBack, etiquetas, foco, contraste y objetivos táctiles. Medir en teléfono
   modesto antes de afirmar rendimiento aceptable.

## Registro del primer ciclo

**Objetivo del ciclo:** prueba mínima de acceso existente y selección de foto en Android.

**Evidencia inicial:** web SSR y contratos inspeccionados, Git con dos cambios de
usuario conservados; sin Android previo, adb ni SDK detectados. Creación de negocios
presente y respaldada por pruebas locales.

**Cambio realizado:** paquete aislado y lockfile, Capacitor 8.5.3, proyecto Android,
configuración HTTPS validada, restricciones nativas, error recuperable y diagnóstico.
README principal enlaza este contrato. Backend, datos y dependencias raíz conservados.

**Validación ejecutada:**

- `npm install --fetch-retries=0 --fetch-timeout=30000 --ignore-scripts` excedió
  120 segundos; segundo intento falló por EIDLETIMEOUT de npm. Finalmente
  `npm install --prefer-offline --fetch-retries=0 --fetch-timeout=15000 --ignore-scripts --no-audit --no-fund`
  aprobó; dependencias Capacitor instaladas y lockfile generado.
- `ANDROID_POC_ORIGIN=https://qa.example.test npm run android:add` y
  `... npm run android:sync`: aprobados, solo generación/sync con origen de ejemplo;
  no se contactó un backend HTTPS ni se autenticó un usuario Android.
- `npm test` del experimento: 2 pruebas de política de configuración aprobadas.
- Reproducción final: `npm ci --prefer-offline --ignore-scripts --no-audit --no-fund`,
  sync y las 2 pruebas aprobaron desde el lockfile.
- `npm run lint`, `npm run typecheck`, `npm run build` de raíz: aprobados.
- Base independiente `file:/tmp/opencode/ss-android-cycle1-test.db`:
  `prisma migrate deploy` y `vitest run`: **159 pruebas / 15 archivos aprobados**.
  Se retiraron del entorno Turso/Blob para esta ejecución de tests, sin reiniciar
  bases de usuario. Las suites Prisma usan esa base local.
- Pasada final tras revisar los cambios nativos: linter, tipos, 159 pruebas,
  build web y `git diff --check` aprobados. En esa pasada se fijaron
  `TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN=` y la base temporal
  explícitamente, evitando que Next cargase proveedores remotos de los dotenv.
- `./gradlew :app:assembleDebug --no-daemon`: intento interrumpido por timeout de
  60 segundos descargando `gradle-8.14.3-all.zip`; no alcanzó compilación.
- `npm run doctor`: diagnóstico fallido esperado por JDK 21, adb y SDK API 36
  faltantes. Java presente es 25. Generación del proyecto y CLI sí detectadas.

**Resultado:** preparación verificable y regresión web aprobada; ciclo funcional
Android **bloqueado y no terminado**. Sin emulador ejecutado, sin dispositivo físico,
sin flujo móvil nuevo verificado, sin APK/AAB y sin medición de rendimiento Android.
Las pruebas Java de plantilla no acreditan navegación ni cámara.

**Riesgos o pendientes:** herramientas indicadas, servidor HTTPS de pruebas accesible,
sesión y selector reales, restricciones de navegación, Atrás, permisos, red y
compresión. Validación de permisos del manifest combinado y revisión Android nativa
pendientes. Turso/Blob/OpenAI remotos no comprobados. No hubo commit ni publicación.

**Siguiente acción:** seleccionar JDK 21, instalar SDK/API 36 y adb, terminar Gradle,
configurar origen de pruebas y ejecutar el recorrido definido antes de decidir
arquitectura de distribución o ampliar el MVP.

## Distribución y reversión

Fuentes oficiales consultadas durante este ciclo:

- [Capacitor: configuración](https://capacitorjs.com/docs/config): `server.url`
  es para desarrollo, restricciones y plugins; no usarlo como entrega release.
- [Capacitor: entorno](https://capacitorjs.com/docs/getting-started/environment-setup):
  Node 22+, Android Studio 2025.2.1+ y SDK.
- [Google Play: API objetivo](https://support.google.com/googleplay/android-developer/answer/11926878):
  desde el 31/08/2026 nuevas apps/actualizaciones móviles requieren API 36+.
- [Google Play: alta y firma](https://support.google.com/googleplay/android-developer/answer/9859152):
  AAB, firma, versionCode creciente y requisitos de prueba según cuenta.

Antes de distribución habrá que aprobar arquitectura soportada, generar AAB firmado
con claves externas a Git, revisar manifiesto/permisos y requisitos vigentes de Play,
privacidad y pruebas de cuenta. Release está deliberadamente deshabilitado hasta
esa decisión. No se ha generado ni subido un AAB ni se ha publicado nada.

Reversión local: retirar únicamente `mobile/android-poc/` y el enlace añadido en
README, después de revisar que no haya trabajo posterior allí. No requiere migración,
rollback de base ni cambio de despliegue web. Para retirar del teléfono de pruebas:
`adb uninstall com.segundasmart.poc` (borra su sesión local).
