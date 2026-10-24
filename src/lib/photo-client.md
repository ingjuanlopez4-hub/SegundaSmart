# Preparación de fotografías

Implementación compartida web/WebView: `photo-client.ts`, `photo-worker.ts`,
`photo-dimensions.ts`, `photo-limits.ts`, integrada en `ProductForm.tsx`.
No requiere dependencias nuevas ni cambia la API o el esquema de datos.

## Contrato

- Entrada: JPEG, PNG o WebP estáticos, no vacíos, hasta 33.554.432 bytes (32 MiB).
  HEIC y otros formatos exigen exportar a JPG; no se solicitan nuevos permisos.
- Antes de decodificar se inspeccionan las cabeceras y se rechazan animaciones,
  dimensiones ilegibles, lados mayores de 16384 o más de 67.108.864 píxeles.
  No pretende sustituir una validación completa del archivo original.
- Worker dedicado con `createImageBitmap` y `OffscreenCanvas`; orientación EXIF
  `from-image` aplicada por el decodificador. No se amplían imágenes pequeñas.
- Salida: lado máximo 2048, JPEG `image/jpeg`, nombre `pieza.jpg`, hasta
  4.194.304 bytes. Canvas elimina los metadatos EXIF/GPS originales; transparencia
  se compone sobre blanco. Calidad 0.88/0.76/0.64; como máximo tres tamaños y
  nueve codificaciones. Límite de tiempo de 30 segundos.
- Los límites del servidor permanecen intactos: <=5.242.880 bytes, <=8192 por
  lado y <=16.777.216 píxeles, Sharp decodifica completamente el resultado.
- APIs de worker/canvas no disponibles, error de lectura/memoria o timeout:
  error recuperable; no se sube el original como alternativa insegura.

## Estado del formulario

El archivo preparado vive en una referencia separada del input nativo: cancelar
el selector no lo borra. Seleccionar otra foto cancela el worker anterior y
descarta sus respuestas. Un fallo conserva foto previa y texto con aviso explícito.
Mientras se prepara, se puede editar pero no guardar. Al guardar se sustituye
`FormData.photo` por el JPEG preparado antes de bloquear los controles. Los
errores HTTP conservan ese archivo para un reintento explícito; no hay reintentos
automáticos. Desmontar termina el worker; cambiar preview revoca el object URL.

La creación de productos todavía no tiene idempotencia backend. Tras una respuesta
perdida se debe comprobar inventario antes de repetir; el bloqueo de doble pulsación
no garantiza deduplicación entre peticiones posteriores o después de recrear el proceso.

## Evidencia y límites

Pruebas de cabeceras con imágenes Sharp reales, entradas inválidas, límites y APNG
en `photo-dimensions.test.ts`. Evidencia local ignorada por Git:
`artifacts/android-cycle2/photo-web-qa.json` y `photo-web-qa.mjs` (regresión web,
Chrome móvil emulado y backend SQLite aislado). Fotografía pública de prueba:
[Fronalpstock_big.jpg](https://commons.wikimedia.org/wiki/File:Fronalpstock_big.jpg),
14.679.474 bytes, 10109×4542; no se incluye en Git. La variante vertical de prueba
se deriva de esa fotografía con EXIF 6. Las pruebas web no acreditan selector,
cámara física, permisos ni ciclo de vida Android. Esos estados se registran en la
matriz del experimento Android.
