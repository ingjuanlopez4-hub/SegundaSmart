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

Las fotos se validan en backend (tipo permitido, firma binaria y máximo 5 MB). En desarrollo se guardan en `public/uploads/<businessId>`; cuando existe `BLOB_READ_WRITE_TOKEN`, se guardan en Vercel Blob y `photoPath` conserva la URL pública.

Prisma usa SQLite local cuando no existe `TURSO_DATABASE_URL` y cambia al adaptador libSQL de Turso en Vercel. El esquema remoto inicial se aplica una vez con `npm run db:init:turso` después de ejecutar `vercel env pull .env.local`.

## Seguridad e integridad

- Las rutas privadas requieren una sesión vigente y derivan el negocio desde ella.
- No existe una API pública para consultar productos arbitrarios. El catálogo solo selecciona `AVAILABLE` por el `slug` del negocio.
- Registro y venta usan transacciones. La venta usa una actualización condicional y una restricción única para evitar doble venta.
- Formularios aplican restricciones HTML y todas las entradas vuelven a validarse con Zod en el servidor.
- Cookies con `SameSite=Lax`, `HttpOnly` y `Secure` en producción.
- Las respuestas externas de IA se validan y, si son inválidas, se ignoran.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Las pruebas crean `prisma/test.db` y limpian únicamente esa base. Cubren importes/validaciones, venta transaccional, doble venta, métricas globales, paginación y aislamiento entre negocios.

## Estructura

- `src/app/(auth)`: registro e inicio de sesión.
- `src/app/app`: resumen, inventario, alta de productos y ventas autenticadas.
- `src/app/catalogo/[slug]`: catálogo público.
- `src/app/api`: contratos de autenticación, productos, sugerencias, QR y ventas.
- `src/lib`: Prisma, sesiones, validaciones, dinero y dominio de ventas.
- `prisma/schema.prisma`: modelo y restricciones persistentes.

## Operación

`npm run db:push` crea o actualiza la base SQLite local. La migración inicial versionada en `prisma/migrations` permite inicializar Turso con `npm run db:init:turso`. Antes de cambiar un esquema con datos reales, genera y revisa una nueva migración y conserva respaldos de la base y del almacén Blob.

El despliegue Vercel requiere enlazar un recurso Turso y un almacén Blob públicos. Los recursos pueden crearse con Vercel CLI:

```bash
vercel integration add tursocloud/database --name segunda-smart-db
vercel blob create-store segunda-smart-photos --access public --region iad1 --yes
vercel env pull .env.local
npm run db:init:turso
vercel --prod
```
