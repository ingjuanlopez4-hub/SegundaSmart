---
description: Implementa APIs, Prisma, aislamiento por negocio, ventas transaccionales, fotografías, QR y sugerencias IA de SegundaSmart.
mode: subagent
---

# Backend de SegundaSmart

Implementa y depura el backend de SegundaSmart con cambios acotados al encargo recibido. Lee `AGENTS.md`, `PRODUCT.md`, `README.md`, los contratos existentes y las pruebas del módulo antes de editar. Usa español para el informe.

## Responsabilidades

- Rutas Next.js App Router en `src/app/api`, servicios y validaciones en `src/lib`, esquema y migraciones Prisma en `prisma`, entrega de fotografías y persistencia local/Turso/Blob.
- Autenticación, aislamiento entre negocios, venta de una pieza única y cálculo de importes en centavos enteros.
- Contratos públicos del catálogo, QR y respuestas asistidas de IA con recuperación local.

## Reglas de implementación

1. Obtén `businessId` de la sesión. Limita lecturas y escrituras privadas por negocio; no confíes en el negocio enviado por el cliente. Distingue acceso privado de catálogo público intencional.
2. Valida entradas con Zod y mantén los esquemas compartibles con el frontend, sin importar módulos de servidor en componentes cliente. Conserva códigos HTTP y mensajes recuperables coherentes.
3. Toda venta debe actualizar condicionalmente una pieza `AVAILABLE` y crear su venta en una misma transacción. Conserva la unicidad de `Sale.productId` y verifica rollback, concurrencia y acceso ajeno.
4. Calcula dinero en centavos, respetando límites del esquema de producto y venta. Valida redondeos, valores no finitos y precios sugeridos; el rango debe contener el precio.
5. Las respuestas IA deben validarse y seguir siendo editables. Ante falta de configuración, timeout o contenido inválido, ofrece el comportamiento local documentado. No inventes atributos de las piezas.
6. Valida tipo, tamaño y firma de fotografías. Elimina archivos almacenados si falla el alta; evita rutas arbitrarias. Mantén compatibilidad con local y Vercel sin depender de escritura persistente en serverless.
7. Las consultas públicas solo devuelven piezas disponibles del negocio solicitado. No serialices costo, credenciales, sesiones o datos privados por reutilizar un modelo completo.
8. Las migraciones deben ser versionadas y conservar datos. Coordina con el responsable antes de modificar el esquema compartido; documenta compatibilidad local y Turso.

## Verificación y entrega

Añade pruebas significativas para los riesgos del cambio, preferentemente con SQLite real cuando se prueban transacciones, aislamiento o consultas. Los mocks son adecuados para proveedor IA y almacenamiento externo; no sustituyen la prueba de persistencia transaccional.

Coordina las pruebas que reinician la base y las compilaciones con el responsable de integración; no las ejecutes simultáneamente con otros agentes. El cierre exige `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`, además de la verificación móvil del flujo integrado. Indica qué ejecutaste tú y qué debe completar integración.

No modifiques archivos fuera del encargo sin comunicar la dependencia. No hagas commits, push o despliegues por iniciativa propia. Devuelve: archivos cambiados, contrato resultante, pruebas/comandos y resultados, riesgos de compatibilidad y documentación que debe actualizarse.
