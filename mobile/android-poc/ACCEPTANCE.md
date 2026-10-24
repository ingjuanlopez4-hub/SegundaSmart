# Aceptación Android — ciclo 2

Estado de cierre: **PARCIAL/BLOQUEADO**. Registro iniciado el 23/10/2026,
comandos con timestamps UTC del 24/10. Evidencias locales (ignoradas por Git):
`artifacts/android-cycle2/`. Cada `.log` tiene un `.json` con comando, inicio,
fin y código de salida; no se usa `tee` para determinar éxito.

## Precondiciones comunes

**H**: origen HTTPS de pruebas autorizado, certificado confiable, sirviendo este
checkout y con datos/almacén de pruebas; cuenta generada de pruebas autorizada.
No proporcionado. El origen `qa.example.test` heredado es solo un ejemplo y
**no acredita H**. No se ha publicado ni abierto ningún túnel.

**D**: observado en emulador AOSP x86_64 Android 16/API 36, perfil Pixel 5,
serial `emulator-5556`, WebView 133.0.6943.137. APK instalado y actividad abierta.
Los resultados de navegador web no sustituyen D. Hardware físico se exige por
separado para acreditar captura real; cámara de emulador solo acredita emulación.

## Matriz obligatoria

| Caso | Precondiciones | Pasos a ejecutar | Resultado esperado | Observado / evidencia actual | Estado Android |
| --- | --- | --- | --- | --- | --- |
| 01 Inicio | H, D | Lanzar actividad y comprobar entorno, pantalla y logs | Sin crash; entorno correcto accesible | Instalación Success, lanzamiento Status ok, proceso vivo y página local «No se pudo conectar»; falta entorno real. `android-smoke-host.log`, `android-launch.png` | BLOCKED |
| 02 Sesión | H, D, cuenta de pruebas | Login incorrecto/correcto, reiniciar, logout, abrir ruta privada y caducar sesión | Cookie persiste según contrato de 30 días; logout/caducidad impiden acceso | Sin sesión Android observada; pruebas backend no sustituyen cookie WebView | BLOCKED |
| 03 Producto | H, D, sesión | Completar, guardar, doble pulsación, recargar inventario | Una pieza persistida; no éxito falso ni doble envío simultáneo | Web aislada PASS (4 guardados en pasada final); sin Android. `photo-web-qa.json` | BLOCKED |
| 04 Selector | H, D, fotografía de pruebas | Elegir archivo con selector del sistema, ver preview, guardar y recargar | Foto preparada y servida | Web por CDP PASS; selector nativo pendiente | BLOCKED |
| 05 Cámara | H, D y cámara | Capturar, confirmar, guardar, ver foto | Captura y carga sin error | Cámara emulada y física pendientes por separado; ninguna captura física acreditada | BLOCKED |
| 06 Cancelación | H, D, formulario con texto/foto | Abrir selector/cámara y cancelar con botón y Atrás | Datos/foto previos intactos; cero altas vacías | Evento DOM cancel PASS en web, no interacción nativa | BLOCKED |
| 07 Atrás | H, D, edición y navegación | Atrás en teclado, selector, modal, rutas y raíz | Cierre/navegación coherentes; sin pérdida silenciosa | No observado en Android | BLOCKED |
| 08 Teclado | H, D | Enfocar campos iniciales/finales, decimal, errores y CTA; desplazar y cerrar | Campos/errores/guardar accesibles | `adjustResize` en manifest; responsive 390px PASS web, teclado Android pendiente | BLOCKED |
| 09 Permisos | H, D, selector/cámara del sistema | Permitir/denegar/denegar persistente donde se soliciten; recuperación | Sin crash; recuperación útil; no pedir permisos globales innecesarios | APK solo INTERNET + permiso signature interno AndroidX; no CAMERA/READ_MEDIA/almacenamiento/micrófono. El comportamiento de las apps externas no se presupone | BLOCKED |
| 10 Segundo plano | H, D | Background durante edición/captura/carga y regresar; aparte recrear actividad/proceso | Formulario/operación recuperable; no confundir background con muerte de proceso | No observado; no se promete persistencia de borrador tras muerte de proceso | BLOCKED |
| 11 Red | H, D, sesión | Cortar/restaurar antes de guardar y durante carga/respuesta | Conserva datos, reconcilia inventario, reintento explícito sin falso éxito | Web offline antes de guardar + recuperación PASS. Alta SIN clave idempotente backend: respuesta perdida exige consultar inventario; bloqueo de doble clic no garantiza deduplicar reintentos posteriores | BLOCKED |
| 12 Imagen grande | H, D, foto real >5.242.880 bytes | Elegir/capturar, procesar, comprobar orientación y calidad, guardar | Salida JPEG <=4.194.304 bytes, lado <=2048, carga válida | Web PASS: real 14.679.474 bytes →395.900, 10109×4542→2048×921; EXIF 6→vertical 539×1200; `photo-web-qa.json`. Falta Android y revisión visual en destino | BLOCKED |
| 13 Errores | H, D, sesión | Archivo inválido, validación 422, fallo servidor recuperable, reintentar | Datos/foto conservados; error accionable; sin alta vacía | Web PASS con corrupto y 422 inyectado solo en navegador; reintento real persistido | BLOCKED |
| 14 Origen | H, D | Enlaces y redirects mismo origen, HTTPS externo, HTTP, puerto distinto, esquemas intent/data/javascript | Solo origen permitido en contenedor; externos según política; TLS estándar | Política estática/config tests PASS; sin navegación Android observada. No se certifica con inspección de fuente | BLOCKED |

Ningún caso completo se marca N/A. No se elevan subpruebas web o inspecciones
estáticas a PASS Android. El cierre exige reemplazar cada bloqueo por observación.

## Comprobaciones independientes ya observadas

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Java y javac 21.0.12.1; Gradle launcher/daemon seleccionados en 21 | PASS | `java-sdk-proof.log`, `gradle-version.log` |
| SDK platform 36 rev 2, Build Tools 35.0.0, platform-tools 37.0.1, adb 1.0.41 | PASS | `sdk-install.json` exit 0, `java-sdk-proof.log` |
| SDK licenses por prompts oficiales, sin fabricar hashes | PASS | `sdk-install.log` |
| Dependencias desde ambos package-lock con npm ci | PASS | Ejecución de sesión; lockfiles sin cambios |
| Linter web, tipos estrictos, 165 tests/16 archivos, build web | PASS | `final-checks.log/.json` (incluye exclusión de outputs Gradle generados) |
| Compresión/carga real y recuperación web (22 comprobaciones) | PASS | `photo-browser-visual.log/.json`, `photo-web-qa.json`, capturas `photo-*-390.png` |
| Configuración Capacitor (2 tests) y doctor | PASS | `poc-checks.log/.json` exit 0; no acreditan origen ni recorrido |
| lintDebug, testDebugUnitTest, assembleDebug | PASS | `android-build.log/.json`, 128 tareas ejecutadas |
| Firma debug y metadatos del APK | PASS | `apk-inspect.log/.json`; firma v2 válida |
| HTTPS real desde host/Android/app | BLOCKED | Falta H; no se usa producción |
| Emulador arrancado y adb operativo | PASS | `emulator-host-gpu.log`, `sdk-destination-final.log`; GPU host/KVM, boot_completed 1 |
| Instalación/apertura Android | PASS | `android-smoke-host.json` exit 0, `android-smoke-results.json`, `android-launch.png`; únicamente página local de error |
| Recorrido autenticado y HTTPS dentro de la app | BLOCKED | H ausente; instalación/apertura no acreditan recorrido funcional |
| Captura y recorrido en dispositivo físico | NOT_RUN | Ningún dispositivo físico conectado/autorizado |

Las pruebas Java son las de plantilla; no prueban sesión, cámara o navegación.
Lint Android aprobó sin errores y con advertencias de plantilla/dependencias,
incluido orden de manifest y backup moderno; no se desactivaron reglas ni se
actualizaron masivamente dependencias. La advertencia XML SDK v4 no impidió el build.

### Recuperación observada del emulador

- `sdkmanager` falló descargando emulator (exit 1). Se recuperaron los archivos
  oficiales con peticiones HTTPS Range acotadas y checksum del repositorio:
  emulator 37.2.12 (`cd7362ea55dfb86a418958138dc396e74165dd01`) e imagen AOSP
  x86_64 API 36 rev 2 (`829c076e8ff448a336097ae25a355b495ba36e2c`).
- La extracción manual del emulador necesitó registrar su `package.xml` local
  usando la metadata oficial y el esquema local emitido por sdkmanager para
  paquetes genéricos. No se escribieron archivos de aceptación de licencias.
  Helpers y trazas en `install-emulator.py`, `register-emulator.py`,
  `emulator-recovery.log`, `emulator-register-local-schema.log` y `avd-create-local-schema.log`.
- Los intentos SwiftShader/KVM, software sin Vulkan, TCG sin KVM y rseq desactivado
  terminaron **FAIL (SIGSEGV -11 del emulador host)**, antes de instalar la app.
  Stack saneado: `emulator-crash-stack.txt`, frames de `libGLESv2.so` SwiftShader.
  No se atribuye esto a la app ni se afirma que KVM fuese la causa.
- Cambiar únicamente a `-gpu host -feature -Vulkan -accel on` permitió boot
  completo (19.590 ms en log), adb operativo e instalación/apertura observadas.
  Host AMD Radeon/Mesa 25.3.6. **PASS** para ese arranque concreto; no mide un
  teléfono real ni demuestra rendimiento del recorrido de negocio.
- El APK instaló con `adb -s emulator-5556 install -r ...` → `Success` y abrió
  `.MainActivity` con `Status: ok`. Tras ocho segundos, PID vivo y captura de
  la página local de error. Sin sesión, sin acceso al entorno real.
- Logs de emulador se filtran para quitar identidad del host/clave pública ADB.
  No se incluyen cores binarios en las evidencias compartibles.

## APK de este ciclo

- Ruta: `mobile/android-poc/android/app/build/outputs/apk/debug/app-debug.apk`.
- Build: `./gradlew :app:lintDebug :app:testDebugUnitTest :app:assembleDebug --no-daemon -Dorg.gradle.java.home=/usr/lib/jvm/java-21-openjdk` desde `android/`.
- 4.120.159 bytes; modificado 2026-10-24T06:40:21Z; `com.segundasmart.poc`,
  versionCode 1, versionName 1.0, debug, min 24/target 36.
- SHA-256: `5e8d2de4de55d64db265b81055f5f568c519584fc3c32e15f569fd0c931e71ca`.
- Solo diagnóstico: conserva el origen de ejemplo heredado. La compresión vive
  en el servidor web de este checkout; no se ha desplegado al origen remoto.
  Cambiar el origen exige nuevo sync, build, hash, instalación y aceptación.

## Recuperación y privacidad

No se ejecutaron comandos de migración ni operaciones de producción. La suite
existente incluye pruebas aisladas de migraciones. Se copió por backup SQLite
el esquema de la base temporal del ciclo anterior a `/tmp/opencode/ss-android-cycle2.db`;
se usa únicamente esa copia para tests/servidor local. Proveedores Turso/Blob/OpenAI
se fijaron vacíos, sin imprimir dotenv. Credenciales web se generan en memoria y
no se incluyen en fuentes ni logs. La foto es pública, no personal; enlace de
procedencia en `src/lib/photo-client.md`. APK, fotos y logs no se versionan.

Al cerrar se detuvieron el servidor web local y el emulador de esta prueba,
conservando su AVD y datos. `shutdown.log/.json`: salida 0, `adb devices -l` vacío
y sin listeners en 3102/5556/9334. JDK global e IDE permanecen sin cambios.
