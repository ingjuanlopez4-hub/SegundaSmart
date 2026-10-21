# Traspaso frontend: formularios y escáner

## Alcance

- Alta: captura multipart antes de bloquear los tres fieldsets. El bloqueo no remonta ni limpia controles, archivos o vista previa. Un fallo libera el bloqueo para reintentar. El guardado invalida y aborta la sugerencia pendiente antes del envío.
- Errores: mensajes Zod por campo, `aria-invalid`, `aria-describedby` y foco en el primer control inválido en orden del formulario. Las ayudas de foto, defectos, precio orientativo y contraseña siguen asociadas. `noValidate` permite anunciar juntos los errores compartidos; se conservan restricciones HTML y se valida la foto explícitamente antes de enviar.
- Acceso/registro: esquema compartido correspondiente antes del envío; se envían sus datos normalizados. Bloqueo síncrono contra duplicados y conservación de controles al fallar, incluida la contraseña. No se endurece la longitud mínima de contraseñas existentes al iniciar sesión.
- Ventas: dos columnas solo con al menos 720 px útiles dentro de la página. El rail y los márgenes no cuentan como espacio disponible. Encabezados, filas y nombres largos pueden envolver; no se oculta el desbordamiento para disimularlo.
- Escáner: cada sesión posee su stream y temporizador. Cerrar/desmontar invalida continuaciones, para tracks y desconecta el vídeo. `getUserMedia`, `play` y `detect` no ofrecen cancelación nativa uniforme: se ignoran sus resultados/rechazos tardíos y se paran inmediatamente tracks recibidos tarde. Una sesión antigua no puede desconectar el vídeo de una nueva, informar errores ni navegar. Los errores activos cierran la cámara y permiten reintentar o buscar manualmente.

## Evidencia ejecutada

- `./node_modules/.bin/vitest run src/components/form-errors.test.ts src/components/qr-scanner-session.test.ts`: 2 archivos, 13 pruebas aprobadas, sin acceso a bases de datos.
- ESLint focalizado en los siete archivos TS/TSX modificados o nuevos: aprobado.
- `git diff --check`: aprobado en el momento de revisión.
- No se ejecutaron build, typecheck ni suites globales, por coordinación con calidad. No se instalaron dependencias.

## Resultado de integración

Calidad ejecutó sobre la compilación final 137 pruebas automatizadas y 23 comprobaciones en Chrome/CDP, todas aprobadas. Se comprobaron validación, foco y asociaciones ARIA, conservación de fotografía y datos, bloqueo de envíos y reintento real, foto servida en producción, ventas a 360/390/800/1024 px y cancelaciones con cámara/detector simulados. El resumen versionado está en README, sección «Verificación integrada de mejoras»; el informe local detallado, en `artifacts/qa-improvements.md`.

Quedan fuera de esa evidencia la cámara física, lector de pantalla, teclado virtual, zoom y los anchos adicionales. La lista siguiente conserva el plan completo de escenarios; no todos se verificaron en navegador.

## Plan de comprobación

Las pruebas unitarias no acreditan por sí solas el renderizado ni la carga de imágenes:

1. A 360 y 390 px: alta vacía, espacios en nombre/categoría/descripción y condición “Con detalles” sin defectos. Comprobar cada mensaje, foco, anuncio del resumen y asociaciones con ayudas existentes; sin petición de alta inválida.
2. Foto real válida: cargar efectivamente la vista previa. Provocar errores Zod en otros campos y comprobar que la foto y todos los valores siguen presentes. Probar foto vacía, tipo incorrecto y más de 5 MB, luego recuperar con foto válida.
3. Alta válida con sugerencia lenta: guardar sin esperar. Inspeccionar multipart para comprobar foto y todos los campos antes del bloqueo. Retrasar respuesta IA y comprobar que no altera el guardado. Forzar error HTTP/red/JSON de guardado: todos los datos y la foto permanecen, campos se desbloquean y el reintento conserva el archivo. Doble envío produce una sola petición mientras está pendiente.
4. Alta con éxito en producción aislada: fotografía creada después de arrancar el servidor; comprobar carga real en inventario y catálogo, no solo existencia del registro o etiqueta. Sin datos ni bases reales.
5. Acceso y registro: entradas vacías, espacios en nombres, email inválido y contraseña corta. Sin envío inválido; foco y mensajes por campo. Probar correo ocupado, credenciales incorrectas, error de red, envío lento y éxito; conservar entradas ante fallo y bloquear duplicados. Confirmar acceso con contraseña existente de menos de 8 caracteres si el fixture lo permite.
6. Ventas a 360, 390, 799, 800, 820, 1024 y 1280 px: disponible, vacío, búsqueda sin resultados, error y éxito. Incluir nombres/categorías largos, importes máximos e historial; comprobar `scrollWidth <= clientWidth`, en especial al aparecer el rail de 238 px. Verificar dos columnas solo con espacio útil suficiente.
7. Escáner: cerrar durante permiso, reproducción y detección; conceder permiso/resolver/rechazar después del cierre o desmontaje. Reabrir antes de resolver la sesión anterior: ningún track antiguo vivo, navegación o aviso tardío, ni interrupción de la cámara nueva. Probar detección válida, fallo activo, reintento, sin soporte y búsqueda manual. El vídeo cerrado no debe ser visible ni accesible.
8. Teclado, foco visible, zoom 200 %, movimiento reducido y consola sin errores JavaScript en los flujos anteriores.

La documentación raíz y el sistema visual no se modifican: quedan fuera de la propiedad de esta tarea. Calidad coordina los comandos globales y las bases de prueba con integración.
