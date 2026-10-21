# SegundaSmart

MVP local para que negocios de artículos de segunda mano administren piezas únicas, ventas, ganancias y un catálogo compartible.

## Funcionalidad

- Registro y acceso con contraseña protegida mediante `scrypt`, sesiones persistentes en cookie `HttpOnly` y cierre de sesión real.
- Cada cuenta crea un negocio. Todas las consultas privadas y mutaciones se limitan por `businessId` obtenido de la sesión, nunca por datos enviados por el cliente.
- Inventario de piezas únicas con foto, costo, precio, condición, descripción y estado disponible/vendido.
- Sugerencia editable de descripción y precio. Usa OpenAI si se configura; ante ausencia, timeout o respuesta inválida usa una sugerencia local determinista.
- QR descargable que abre la pieza dentro del catálogo público.
- Venta atómica: una transacción reclama el producto solo si sigue disponible y después crea la venta. `Sale.productId` también es único.
- Resumen global de ingresos y ganancias (`importe de venta - costo`) e historial de ventas paginado.
- Catálogo público por negocio, limitado en la consulta a productos disponibles, con enlaces reales de WhatsApp y Facebook.

## Experiencia de interfaz

- Sistema visual "Registro de procedencia": cada producto se presenta como una ficha de una pieza única, con estado, referencia y acciones operativas visibles.
- El panel autenticado prioriza `Agregar pieza` en navegación móvil y escritorio; el alta se divide en fotografía e identidad, valor y ficha publicable.
- Navegación con ruta activa, acceso móvil permanente al catálogo y cierre de sesión, confirmación visible después de registrar una pieza y confirmación previa al cerrar una venta.
- Diseño mobile first con foco visible, objetivos táctiles, movimiento reducido y estados de carga, error, vacío y éxito.
- Alta y acceso con validación compartida entre navegador y servidor, errores asociados a cada campo y foco en el primero inválido. El alta captura todos los datos y la fotografía antes de bloquear los campos durante el guardado; un fallo conserva los valores y permite reintentar. La sugerencia puede cancelarse, vence a los 15 segundos y permite guardar sin esperar; conserva el texto y precio propios y descarta respuestas si cambian los datos de la pieza durante la consulta.
- Ventas con validación compartida, bloqueo de envíos duplicados y campos bloqueados durante el registro. Un enlace a una pieza no disponible exige elegir otra explícitamente; cambiar el enlace actualiza la selección. Los conflictos por venta concurrente retiran inmediatamente la pieza del selector, vacían la selección y refrescan los datos. Los errores recuperables conservan el importe para reintentar.
- Inventario con búsqueda y filtros enlazables `Todas`, `Disponibles` y `Vendidas`; los conteos corresponden a la búsqueda actual y limpiar conserva el estado. Fichas adaptadas al ancho útil después del rail, fotografías completas con reintento, precios explícitos en MXN y acciones de venta/compartir/QR fuera de la columna de texto. Navegación con iconos y etiquetas, estado activo visible y nombre del negocio sin truncar. Contrato y evidencia del incremento en [`src/components/INVENTORY-UX.md`](src/components/INVENTORY-UX.md).

## Documentación de producto

- [`PRODUCT.md`](PRODUCT.md): usuarios, posicionamiento, principios y límites del producto.
- [`DESIGN.md`](DESIGN.md): sistema visual y reglas de interacción responsive.
- [`COMPETITIVE_ANALYSIS.md`](COMPETITIVE_ANALYSIS.md): competidores, benchmarks UX y mapa de oportunidades con fuentes oficiales.
- [`.opencode/README.md`](.opencode/README.md): equipo de agentes de desarrollo, activación y protocolo de colaboración para continuar el MVP.

## Requisitos y arranque

- Node.js 20.9 o posterior.

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), crea una cuenta y registra el primer producto. No hay usuarios ni productos precargados.

## Configuración

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | SQLite local; el valor recomendado es `file:./dev.db`. |
| `APP_URL` | Sí en producción | URL absoluta incluida en los códigos QR. |
| `TURSO_DATABASE_URL` | En Vercel | Activa Prisma sobre la base SQLite persistente de Turso. |
| `TURSO_AUTH_TOKEN` | En Vercel | Credencial privada de Turso. |
| `BLOB_READ_WRITE_TOKEN` | En Vercel | Guarda fotografías en Vercel Blob. |
| `OPENAI_API_KEY` | No | Activa sugerencias con OpenAI. Nunca se envía al navegador. |
| `OPENAI_MODEL` | No | Modelo de chat; por defecto `gpt-4o-mini`. |

`.env.example` no contiene secretos. `.env` y las bases SQLite están ignoradas por Git.

## Persistencia local y serverless

Las fotos se validan en backend con decodificación completa mediante Sharp: JPEG, PNG o WebP estático, MIME coincidente, máximo 5 MB, 8192 píxeles por lado y 16.777.216 píxeles totales. Se rechazan imágenes truncadas, corruptas y animaciones, incluido APNG. En desarrollo se guardan en `public/uploads/<businessId>`; cuando existe `BLOB_READ_WRITE_TOKEN`, se guardan en Vercel Blob y `photoPath` conserva la URL pública.

La ruta `/uploads/[businessId]/[filename]` sirve las fotos locales creadas después de iniciar el servidor de producción (`next start`), sin requerir reinicios. Solo admite identificadores de negocio y nombres UUID con extensión JPG, PNG o WebP generados por la aplicación; las fotos conservan su acceso público para el catálogo.

Prisma usa SQLite local cuando no existe `TURSO_DATABASE_URL` y cambia al adaptador libSQL de Turso en Vercel. El esquema remoto inicial se aplica una vez con `npm run db:init:turso` después de ejecutar `vercel env pull .env.local`.

## Seguridad e integridad

- Las rutas privadas requieren una sesión vigente y derivan el negocio desde ella.
- No existe una API pública para consultar productos arbitrarios. El catálogo solo selecciona `AVAILABLE` por el `slug` del negocio.
- Registro y venta usan transacciones. La venta usa una actualización condicional y una restricción única para evitar doble venta.
- Formularios aplican restricciones HTML y todas las entradas vuelven a validarse con Zod en el servidor.
- Cookies con `SameSite=Lax`, `HttpOnly` y `Secure` en producción.
- Las respuestas externas de IA se validan y, si son inválidas, se ignoran.
- Las sugerencias locales y sus rangos respetan el máximo de 1,000,000 MXN. El rango siempre contiene el precio sugerido, incluso para importes de centavos. Respuestas IA con descripción vacía, precio no finito o que se redondea a cero activan la alternativa local.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Las pruebas crean `prisma/test.db` y limpian únicamente esa base. Cubren importes/validaciones, defectos obligatorios, referencias y búsqueda aislada, venta transaccional y concurrente, retirada pública, métricas globales y paginación. La API de alta también verifica MIME, firmas completas de PNG/WebP, límite de tamaño y sesión antes de almacenar; las pruebas comprueban que una persistencia fallida elimina la fotografía y admite un reintento.

Las pruebas de sugerencias comprueban que el precio puede usarse en el esquema real de alta y que su rango lo contiene sin exceder los límites. Cubren costo cero y máximo, todas las condiciones físicas, precios IA de centavos, normalización de descripciones, autenticación, entradas inválidas y alternativa local ante errores HTTP, red, timeout o contenido externo inválido.

Las pruebas HTTP de ventas usan SQLite real y comprueban autenticación, importes inválidos, conversión a centavos, negocio derivado de la sesión y conflictos por pieza ajena o ya vendida. Una prueba transaccional fuerza un fallo de persistencia después de reclamar la pieza y verifica el rollback y un reintento posterior válido.

### Verificación del alta de piezas

La revisión del flujo se ejecutó contra la compilación de producción con una base SQLite de prueba independiente:

- `lint`, `typecheck`, 88 pruebas automatizadas y `build` aprobados.
- Chromium móvil a 360, 390 y 768 px: campos dentro del viewport y sin desbordamiento horizontal.
- Fotografía con tipo inválido o vacía: error junto al campo; una foto válida recupera la vista previa.
- Texto formado solo por espacios: bloqueo antes de enviar y foco en el campo correspondiente.
- Sugerencia local real, cancelación, respuesta desactualizada, error de red y timeout de 15 segundos comprobados; los textos y precios propios se conservan.
- Costo máximo de 1,000,000 MXN: sugerencia local real aceptada por la validación del formulario, rango dentro del límite y sin desbordamiento móvil.
- Error de guardado: conserva datos y fotografía para reintentar. Guardado real con sugerencia pendiente: llega al inventario, muestra la pieza creada y carga su fotografía local sin reiniciar el servidor.
- 12 comprobaciones de navegador aprobadas, sin errores de ejecución JavaScript.

### Verificación de ventas

En Chromium contra la compilación de producción y SQLite de prueba independiente se aprobaron 8 comprobaciones:

- Enlace de venta con la pieza correcta y diseño sin desbordamiento a 360, 390 y 768 px.
- Cancelar la confirmación no envía ninguna venta.
- Un enlace a una pieza ya vendida deja la selección vacía y no registra otra pieza automáticamente.
- Durante el envío, los campos quedan bloqueados y los envíos repetidos se ignoran. Un error recuperable conserva la pieza y el importe.
- Una venta en otra pestaña provoca `409` en la pestaña antigua; la pieza se retira y se recarga la consulta para descartar la caché de navegación, exigiendo una selección nueva.
- El reintento con otra pieza termina en éxito. Tres ventas de prueba produjeron exactamente tres filas, ingresos de 535.50 MXN y ganancia de 235.50 MXN, seguidos del estado sin piezas disponibles.
- El catálogo consultado sin sesión deja de mostrar las tres piezas vendidas.
- Sin errores de ejecución JavaScript en el navegador.

### Verificación integrada de mejoras — 20 de octubre de 2026

- `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` aprobados secuencialmente: **137 pruebas en 12 archivos** y compilación de producción correcta.
- Nuevas regresiones: migraciones atómicas con conservación de datos, rollback e índices; fotografías realmente decodificables, límites y rechazo de APNG; errores de formulario y sesiones cancelables del escáner.
- **23 comprobaciones aprobadas en Chrome headless mediante CDP**, contra producción con SQLite y fotografías temporales independientes. Ventas sin desbordamiento a 360, 390, 800 y 1024 px; validación y foco; captura multipart antes de bloquear; conservación de foto y datos tras un error y reintento real; fotografía nueva cargada en inventario y catálogo sin reiniciar.
- Dos pestañas: conflicto de venta real, una sola fila por pieza y retirada pública. Dos ventas produjeron ingresos de 550.75 MXN y ganancia de 450.75 MXN, contrastados con SQLite.
- IA local real; errores de red, respuestas demoradas y cámara/detector se simularon para verificar recuperación y cancelación. Cero excepciones JavaScript en la ejecución final.
- La revisión independiente detectó y verificó el cierre del caso APNG con corrupción posterior al primer fotograma. No se verificaron Turso, Blob u OpenAI remotos, cámara física ni accesibilidad asistiva completa.

El informe local detallado está en `artifacts/qa-improvements.md` (directorio ignorado por Git). La evidencia temporal final está en `/tmp/opencode/ss-integral-1792553280786/`; no se garantiza su conservación tras limpiar el entorno. Las herramientas globales cargan dotenv automáticamente, con la base de pruebas y los proveedores explícitamente sobreescritos; el runtime del navegador se ejecutó sin dotenv. Los servidores de prueba quedaron detenidos.

## Estructura

- `src/app/(auth)`: registro e inicio de sesión.
- `src/app/app`: resumen, inventario, alta de productos y ventas autenticadas.
- `src/app/catalogo/[slug]`: catálogo público.
- `src/app/api`: contratos de autenticación, productos, sugerencias, QR y ventas.
- `src/lib`: Prisma, sesiones, validaciones, dinero y dominio de ventas.
- `prisma/schema.prisma`: modelo y restricciones persistentes.

## Operación

`npm run db:push` crea o actualiza de forma idempotente la base SQLite local usando las migraciones versionadas. `npm run db:init:turso` aplica el mismo flujo a Turso. La migración de referencias reconstruye `Product`, conserva filas existentes y las rellena con una referencia derivada de su ID; las altas nuevas reciben referencias aleatorias desde el backend.

El ejecutor aplica los cambios dentro de una transacción, comprueba las definiciones de tablas e índices y verifica las claves foráneas antes de confirmar. Los índices ausentes se reconstruyen; esquemas parciales o incompatibles se rechazan sin borrar sus datos. La atomicidad, rollback y reintento se prueban con SQLite local; la secuencia contra Turso remoto requiere comprobación independiente. Antes de migrar datos reales, conserva respaldos de la base y del almacén Blob y usa una ventana de mantenimiento sin escrituras concurrentes. Contrato y límites en [`scripts/database-migration.md`](scripts/database-migration.md).

El despliegue Vercel requiere enlazar un recurso Turso y un almacén Blob públicos. Los recursos pueden crearse con Vercel CLI:

```bash
vercel integration add tursocloud/database --name segunda-smart-db
vercel blob create-store segunda-smart-photos --access public --region iad1 --yes
vercel env pull .env.local
npm run db:init:turso
vercel --prod
```
