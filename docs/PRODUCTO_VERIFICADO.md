# Producto verificado

Evidencia de este ciclo sobre base `e7b9cef` y pipeline del PR #3. Las afirmaciones
históricas del README no se convierten automáticamente en evidencia de producción.

| Funcionalidad | Cómo se comprobó | Resultado y límite |
| --- | --- | --- |
| Cuenta, sesión y negocios propios | 12 tests de `src/app/api/negocios/route.test.ts`: registro, creación, nueva sesión, selección, ajenos, 401/422, doble envío y rollback | Aprobados con SQLite y cookies de Next sustituidas en tests; hash/sesiones persistentes reales |
| Formulario de negocios | 14 checks Chrome headless contra `next start`, SQLite nueva: 360/390/768/1440 px, validación/foco, doble clic, error temporal inyectado, reintento real, recarga y regreso | Aprobados; sin excepciones JS. Emulación local, no teléfono físico ni Turso. Reporte del entorno afectado sigue en issue #2 |
| Productos con foto | 42 tests de API de productos y 10 de ruta uploads | Validación, decodificación, límites y recuperación local aprobados; no se probó carga remota Blob |
| Inventario y búsqueda | Tests de búsqueda, filtros y paginación SQLite | Consultas aisladas, conteos y paginación aprobados; no se repitió auditoría visual de inventario en este ciclo |
| Venta única y ganancias | Tests de dominio y API de ventas, historial y catálogo | Transacción, conflictos, aislamiento, rollback, métricas y retirada de vendidos aprobados en SQLite |
| Sugerencia de descripción/precio | 26 tests de `api/ai/sugerir` | Validación y alternativa local aprobadas; respuestas externas simuladas para fallos. OpenAI en producción no verificado |
| QR | Tests del buscador/escáner y rechazo de QR ajeno en negocios; implementación de ruta inspeccionable | No se ensayó escaneo con cámara física ni lector externo en este ciclo |
| Catálogo compartible | Tests de productos públicos y enlaces descritos en README | Retirada de vendidos verificada por consulta. No hay prueba de integración con Meta ni publicación automática; compartir usa enlaces |
| Migraciones | 18 tests con bases SQLite temporales | Conservación, rollback, índices e idempotencia aprobados; sin prueba remota Turso ni restauración de respaldo real |

Total actual: **159 pruebas, 15 archivos**, lint, tipos y build aprobados localmente
y en GitHub. No existe comprobación de formato dedicada. Para repetir controles,
ver [BASELINE.md](engineering/BASELINE.md); `npm test` reinicia una base local y
debe ejecutarse en checkout desechable sin configuración operativa.

Evidencia móvil temporal en `/tmp/opencode/ss-engineering-business-browser.json` y
`/tmp/opencode/ss-engineering-business-mobile.png`; no es un artefacto permanente
ni parte del pipeline. Pendiente: SHA/HTTP/esquema del entorno donde se reportó la
falla, proveedores remotos, producción, dispositivo físico y accesibilidad asistiva.
