# Rendimiento: inventario paginado — octubre de 2026

## Resultado y alcance

Una optimización de la capa de listado, conservada tras mediciones repetidas: limitar a **24 fichas por página** en el inventario privado, incluida su búsqueda y filtro por estado. No se modificaron autenticación, validaciones, transacciones, restricciones de venta ni esquema de base de datos. No se añadió caché ni dependencias.

**Todos los resultados son locales con `next start`; no son resultados de producción remota.**

## Método reproducible

- Linux, AMD Ryzen 5 5625U, 12 CPU lógicas, aproximadamente 15 GiB de RAM; Node 22.22.2, Next 15.5.22, Chrome headless 156.0.8078.47.
- Cada ejecución crea una SQLite nueva en `/tmp/opencode/ss-perf-*` y aplica migraciones con `prisma migrate deploy`. No reinicia ni migra las bases existentes. Turso, Blob y OpenAI se desactivan explícitamente en el proceso de pruebas.
- Dos negocios ficticios: 600 piezas propias (60 vendidas inicialmente) y 80 ajenas. Referencias únicas, nombres Mesa/Silla/Lámpara, descripciones sintéticas de varios cientos de caracteres, costos e importes constantes. Fechas reproducibles. Un JPEG sintético compartido de 1200×900 y 519.662 bytes; no son fotografías reales ni una prueba de diversidad fotográfica.
- Siete repeticiones HTTP secuenciales por flujo, precedidas por un calentamiento completo descartado. Se mide desde `fetch` hasta consumir el cuerpo completo. Bytes HTTP = cuerpo **descomprimido**, no transferencia de red. Una solicitud por operación; la selección del negocio original entre creación y venta queda fuera del tiempo medido.
- En cada vuelta: `/login` sin sesión, inicio de sesión real, inventario, búsqueda `q=Mesa`, creación de negocio real, vuelta al negocio original y venta de otra pieza. Las mutaciones y el crecimiento de sesiones/negocios son idénticos entre escenarios.
- Cinco repeticiones de navegador por pantalla (`/login`, inventario y búsqueda), más un calentamiento descartado. Viewport 390×844, CPU ×4, red de loopback sin limitación, caché del navegador desactivada y servidor caliente. Lectura de Performance API 1.500 ms después de `load`.
- Bytes navegador = suma de `transferSize` del documento y recursos registrados, con compresión/cabeceras. Solicitudes navegador = documento + entradas de recursos **completadas** dentro de esa ventana; no es un contador de todas las precargas iniciadas o canceladas. No se debe comparar directamente con bytes HTTP.
- Trazas Prisma reales mediante `scripts/performance-prisma.mjs`, precargado únicamente en el servidor del benchmark. SQL con placeholders, sin valores de sesión/contraseñas. La duración de Prisma tiene resolución de milisegundos: `0` no significa costo nulo. La comprobación posterior de funcionalidad móvil se hace sin CPU ralentizada.
- Se hicieron una línea base válida, una comparación inicial y dos lotes finales independientes. Las pruebas funcionales y la compilación no se ejecutaron simultáneamente con las mediciones finales.

## Línea base, localización e hipótesis

El inventario recuperaba todas las filas del negocio, separaba estados en JavaScript y renderizaba todas las fichas. La búsqueda hacía lo mismo para las coincidencias. Las trazas muestran cinco sentencias por solicitud: sesión, usuario, negocio, conteo y listado; no muestran una consulta por ficha. Prisma agrupa la lectura de autenticación del layout/página: no se justificó introducir caché para ella.

Inventario: 600 fichas, 2.820.897 bytes de HTML, mediana HTTP de 271,2 ms y DOMContentLoaded de 578,2 ms. La mediana de la suma de duraciones SQL fue 2 ms. Búsqueda: 200 fichas, 950.807 bytes, 94,4 ms HTTP y 255,9 ms DOMContentLoaded; SQL 1 ms.

Esto sitúa el costo principal en materializar, renderizar, serializar y procesar un listado sin límite, no en una consulta lenta. **Hipótesis:** acotar las filas/fichas reducirá el cuerpo y el tiempo completo de respuesta y DOM, preservando conteos globales y acceso a todo el inventario. Criterio de conservación: mejora repetida de esas medidas, con rangos separados de la línea base y regresiones funcionales aprobadas.

El plan original usa `Product_businessId_createdAt_idx`. El plan final real (`ORDER BY createdAt DESC, id DESC LIMIT 24 OFFSET 0`) también usa ese índice y añade `USE TEMP B-TREE FOR LAST TERM OF ORDER BY` para desempatar. Se conserva el desempate estable para no repetir/perder filas con fechas iguales. La duración SQL final está por debajo de la resolución de 1 ms en la mediana local: no se justifica un índice nuevo por este resultado. No se extrapola a páginas profundas ni a latencia de Turso.

## Comparación HTTP

Medianas, milisegundos; rangos mínimo–máximo entre paréntesis. Los lotes finales usan el mismo código y fixtures reiniciados.

| Flujo | Antes | Después A | Después B | Bytes antes → después | SQL antes → después |
| --- | ---: | ---: | ---: | ---: | ---: |
| Carga inicial `/login` | 8,4 (8,0–13,1) | 10,2 (9,0–13,0) | 10,7 (9,5–13,6) | 8.622 → 8.622 | 0 → 0 |
| Inicio de sesión, API | 37,4 (35,1–47,5) | 39,4 (35,1–48,3) | 37,8 (33,9–45,4) | 11 → 11 | 2 → 2 |
| Inventario | 271,2 (256,3–310,2) | 27,4 (25,9–30,6) | 28,4 (23,6–33,1) | 2.820.897 → 135.893 | 5 → 5 |
| Búsqueda `Mesa` | 94,4 (88,1–113,7) | 28,5 (22,5–35,2) | 27,3 (26,8–32,3) | 950.807 → 135.738 | 5 → 6 |
| Creación de negocio, API | 8,6 (7,8–10,4) | 8,2 (7,4–9,5) | 8,5 (8,3–10,6) | 34 → 34 | 10 → 10 |
| Registro de venta, API | 6,8 (6,2–8,0) | 7,2 (6,8–8,7) | 7,4 (6,8–7,8) | 34 → 34 | 7 → 7 |

Inventario: aproximadamente **90% menos tiempo HTTP y 95% menos HTML**. Búsqueda: aproximadamente **70% menos tiempo HTTP y 86% menos HTML**. Los rangos de ambos listados no se solapan con la línea base en ninguno de los dos lotes finales. Las pequeñas diferencias de los flujos no intervenidos tienen rangos solapados; no se les atribuye mejora. La consulta adicional de búsqueda conserva el total registrado del negocio sin confundirlo con el total de coincidencias.

## Comparación en navegador móvil emulado

Medianas; el tiempo DOM es DOMContentLoaded, no una medición de hidratación de React ni un Core Web Vital.

| Pantalla / medida | Antes | Después A | Después B |
| --- | ---: | ---: | ---: |
| Inicial: DOM / FCP (ms) | 43,8 / 44 | 44,2 / 44 | 43,4 / 44 |
| Inicial: bytes / solicitudes completadas | 134.836 / 11 | 134.836 / 11 | 134.836 / 11 |
| Inventario: DOM (ms) | 578,2 | 86,8 | 94,2 |
| Inventario: rango DOM (ms) | 561,0–592,9 | 64,5–94,0 | 77,3–94,8 |
| Inventario: FCP / load (ms) | 212 / 584,3 | 76 / 99,9 | 60 / 96,4 |
| Inventario: bytes / solicitudes completadas | 529.659 / 19 | 159.165 / 19 | 159.165 / 19 |
| Inventario: fichas renderizadas | 600 | 24 | 24 |
| Búsqueda: DOM (ms) | 255,9 | 98,7 | 65,4 |
| Búsqueda: rango DOM (ms) | 238,0–269,9 | 83,0–103,7 | 60,6–74,3 |
| Búsqueda: FCP / load (ms) | 84 / 259,6 | 84 / 103,5 | 104 / 127,9 |
| Búsqueda: bytes / solicitudes completadas | 270.960 / 19 | 159.123 / 19 | 159.123 / 19 |
| Búsqueda: fichas renderizadas | 200 | 24 | 24 |

TTFB de las tres pantallas: aproximadamente 6–7 ms antes y después. Next envía HTML en streaming: TTFB no representa el tiempo completo de consulta/renderizado. El número de recursos completados no mejora: las imágenes lazy y la foto compartida evitan descargar una foto distinta por ficha. El FCP de búsqueda no mejora de forma reproducible y en B sube 20 ms; no se declara una mejora de esa métrica. La reducción de DOM, carga completa y bytes sí se repite y justifica el cambio.

## Implementación y controles

- `src/lib/inventory-page.ts`: agrega conteos por estado en SQL, limita el listado y aplica estado antes de `take/skip`. El total de cabecera se deriva de los grupos si no hay búsqueda. Consulta por negocio y reutiliza `productSearchWhere` para nombre, referencia y QR.
- `src/lib/inventory-filters.ts`: incorpora `pagina` a enlaces de paginación. Cambiar búsqueda/estado o limpiar regresa a página 1. Páginas inválidas se normalizan y páginas obsoletas se limitan a la última existente.
- `src/app/app/inventario/page.tsx`: muestra total de coincidencias, página actual y controles Anterior/Siguiente; no elimina piezas ni acciones. Los enlaces de filtro y página son GET nativos, igual que el formulario de búsqueda y su limpieza. En el ensayo con navegación cliente se reprodujo una respuesta RSC cancelada que dejaba la URL anterior al cambiar de estado; no se cuenta como una latencia de consulta. La navegación nativa completó repetidamente la secuencia página 2 → vendidas. No se atribuye una causa interna al framework sin una reproducción adicional aislada.
- Sin caché de disponibilidad: cada navegación consulta el negocio activo. Las mutaciones de ventas conservan exactamente su implementación transaccional y su restricción única.
- `src/lib/inventory-page.test.ts`: cuatro regresiones con SQLite: recorrido completo de 65 piezas propias con fechas idénticas, aislamiento ante cinco piezas ajenas, búsqueda/estado y conteos, entradas/páginas vacías/obsoletas y nueva lectura tras cambio de disponibilidad.

Verificaciones finales:

- 159 pruebas en 15 archivos aprobadas; incluyen autenticación/propiedad, aislamiento, doble venta concurrente, rollback, retiro público, validaciones y migraciones. Base exclusiva `/tmp/opencode/ss-perf-regression-20261022.db`; no se usó el script de reset de `npm test`.
- `npm run lint`, `npm run typecheck`, `npm run build` y `git diff --check` aprobados.
- Cada lote final: diez comprobaciones de integración/navegador aprobadas. `409` ante doble venta y pieza ajena, una sola fila de venta, retirada del catálogo, ausencia de excepciones JavaScript, página siguiente con búsqueda/conteo conservados, filtro vendido que reinicia página y muestra las 23 coincidencias, búsqueda vacía recuperable, sin desbordamiento a 360, 390, 768 y 1440 px.
- Se mantienen los componentes y rutas de carga/error/éxito existentes. No se provocó un fallo de base de datos ni se midió la aparición del esqueleto en este benchmark; no se afirma haber revalidado visualmente esos estados transitorios.

## Reproducción y evidencia

Desde la raíz, con dependencias instaladas y `/usr/bin/google-chrome` disponible. Verificar que `/tmp/opencode` y `public/uploads` existen. El script rechaza puertos ocupados 3197/9397, usa solo loopback y detiene sus procesos al terminar. Conserva las bases y fotos sintéticas como evidencia, no borra archivos existentes.

```bash
env TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= DATABASE_URL=file:/tmp/opencode/ss-perf-build.db NEXT_TELEMETRY_DISABLED=1 npm run build
node scripts/performance-local.mjs nueva-medicion
node scripts/performance-summary.mjs nueva-medicion
```

El nombre del lote es una etiqueta, **no selecciona una versión de código**. Para repetir antes/después hay que compilar cada versión correspondiente por separado. La línea base de este trabajo se tomó antes de modificar el listado.

Evidencia local ignorada por Git: `artifacts/performance-baseline.json`, `artifacts/performance-final.json`, `artifacts/performance-final-repeat.json`. Incluye muestras individuales, SQL, planes, condiciones y verificaciones; puede desaparecer al limpiar el entorno. Este informe y los scripts están versionados para conservar el método y resultados resumidos. Los artefactos `*-debug*` y `*-timings*` de diagnósticos fallidos no son lotes finales aprobados.

Comprobaciones sobre una base de regresión **nueva y dedicada**:

```bash
env DATABASE_URL=file:/tmp/opencode/ss-perf-regression-nueva.db node_modules/.bin/prisma migrate deploy
env DATABASE_URL=file:/tmp/opencode/ss-perf-regression-nueva.db TURSO_DATABASE_URL= TURSO_AUTH_TOKEN= BLOB_READ_WRITE_TOKEN= OPENAI_API_KEY= node_modules/.bin/vitest run
npm run lint
npm run typecheck
git diff --check
```

## Decisión y siguiente medición prioritaria

Se conserva esta iteración: ganancias amplias y repetidas con una consulta acotada, un helper y navegación convencional. No se identifica otro cuello de botella comparable entre los seis escenarios medidos; login cuesta aproximadamente 38 ms e incluye `scrypt`, que no se reduce ni se elimina. Los tiempos locales de escrituras son pequeños y no justifican optimizar sus garantías.

La siguiente prioridad de **investigación** es medir el catálogo público y las precargas de navegación con muchas fotografías sintéticas distintas y red limitada: el catálogo sigue materializando todos los disponibles y se observaron solicitudes RSC de precarga canceladas durante el diagnóstico. Todavía no hay una comparación repetida que justifique modificarlo. También quedan fuera el arranque frío, páginas profundas, concurrencia sostenida y p95 de producción. La regla de tres iteraciones fallidas no se activó: hubo una optimización retenida con mejora reproducible; los ajustes del instrumento de navegador no son optimizaciones de rendimiento.

No se llamaron servicios remotos ni se necesitaron credenciales reales. Turso, Blob, OpenAI, Vercel, dispositivos físicos, Safari/iOS y fotografías reales no fueron verificados. No hubo despliegue ni pruebas de carga contra producción.
