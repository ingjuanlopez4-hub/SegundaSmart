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
| `OPENAI_API_KEY` | No | Activa sugerencias con OpenAI. Nunca se envía al navegador. |
| `OPENAI_MODEL` | No | Modelo de chat; por defecto `gpt-4o-mini`. |

`.env.example` no contiene secretos. `.env` y las bases SQLite están ignoradas por Git.

## Fotos y limitación de despliegue

Las fotos se validan en backend (tipo permitido, firma binaria y máximo 5 MB) y se guardan realmente en `public/uploads/<businessId>`. Esto permite operar sin servicios externos en una máquina local o servidor con disco persistente.

**Limitación real:** el almacenamiento local no es adecuado para despliegues serverless, réplicas múltiples ni archivos que deban sobrevivir una imagen de contenedor efímera. Para esos entornos debe sustituirse por almacenamiento de objetos persistente, conservando en `photoPath` la URL resultante. Las copias de seguridad deben incluir tanto `prisma/dev.db` como `public/uploads`.

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

No se incluye una migración inicial porque este MVP parte de una base nueva; `npm run db:push` crea el esquema local. Antes de desplegar una evolución con datos reales, genera y revisa migraciones Prisma. Configura HTTPS, una política de respaldo para base/fotos y un volumen persistente.
