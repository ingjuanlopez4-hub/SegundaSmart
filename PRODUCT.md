# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas dueñas de pequeños negocios de artículos de segunda mano que registran, fotografían, publican y venden piezas normalmente únicas. Trabajan con frecuencia desde el teléfono, cerca de la mercancía, y necesitan mantener inventario, catálogo y caja sincronizados sin procesos administrativos complejos.

## Product Purpose

SegundaSmart permite convertir una pieza física en inventario publicable, registrar su venta y conocer ingresos y ganancia. El éxito principal es que la persona pueda registrar una pieza con foto, descripción y precio de forma rápida y confiable, incluso si la asistencia de IA falla.

## Positioning

Una sola captura de la pieza alimenta el inventario privado, el catálogo público compartible y el control de venta de una unidad única. Al venderse, la pieza deja de estar disponible y desaparece del catálogo público.

## Operating Context

- Uso mobile first mientras la persona recibe, revisa o fotografía mercancía.
- Cada artículo se trata normalmente como una unidad irrepetible con condición, costo, precio y fotografía propios.
- El catálogo se comparte por WhatsApp y Facebook.
- Las ventas se registran contra piezas disponibles y alimentan el historial, los ingresos y la ganancia.

## Capabilities and Constraints

- Registro de productos con fotografía JPG, PNG o WebP de hasta 5 MB.
- Descripción y precio sugeridos con asistencia opcional; toda sugerencia debe poder editarse y debe existir una alternativa local si la IA falla.
- Inventario privado, códigos QR, ventas transaccionales, métricas e historial paginado.
- Catálogo público limitado a piezas disponibles.
- Aislamiento estricto de datos entre negocios y prevención de doble venta.
- Next.js App Router, React, TypeScript estricto, Prisma y almacenamiento local persistente para el MVP.
- No se añaden funciones fuera del alcance del MVP.

## Brand Commitments

- El nombre `SegundaSmart` es el único activo visual que debe conservarse en el rediseño.
- La voz usa español claro, verbos directos y términos que reconoce el negocio: pieza, inventario, venta, costo, precio, ganancia y catálogo.

## Evidence on Hand

- Funcionalidad y límites documentados en `README.md`.
- Flujos y contratos implementados en `src/app`, `src/components` y `src/lib`.
- No existen testimonios, clientes, benchmarks ni activos fotográficos de marca que deban presentarse como prueba comercial.

## Product Principles

1. Registrar una pieza debe ser la acción más rápida y visible.
2. El estado de cada pieza debe ser inequívoco en inventario, venta y catálogo.
3. La asistencia automatizada acelera el trabajo, pero nunca bloquea ni reemplaza el control humano.
4. Las cifras deben ayudar a operar el negocio, no competir con la tarea inmediata.
5. La interfaz debe conservar claridad y alcance táctil en pantallas pequeñas.

## Accessibility & Inclusion

La experiencia debe funcionar con teclado, foco visible, anuncios comprensibles de error y éxito, objetivos táctiles adecuados, zoom y preferencia de movimiento reducido.
