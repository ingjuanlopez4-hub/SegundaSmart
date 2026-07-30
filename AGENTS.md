# SegundaSmart

SegundaSmart es un SaaS web para negocios de artículos de segunda mano.

## Alcance del MVP

- Registrar productos con fotografías.
- Generar descripciones con IA.
- Sugerir precios.
- Crear códigos QR.
- Administrar inventario.
- Registrar ventas.
- Calcular ganancias.
- Crear un catálogo público para compartir en Facebook y WhatsApp.

## Reglas permanentes

1. La aplicación debe ser mobile first.
2. Cada producto es normalmente una pieza única.
3. Debe existir aislamiento de datos entre negocios.
4. Ningún usuario puede acceder a productos de otro negocio.
5. No agregues funciones fuera del MVP.
6. No dejes botones sin funcionamiento.
7. No uses datos simulados como implementación definitiva.
8. Todas las entradas deben validarse en frontend y backend.
9. Toda venta debe ejecutarse dentro de una transacción.
10. Un producto no puede venderse dos veces.
11. Los productos vendidos deben desaparecer del catálogo público.
12. Las respuestas de IA deben ser editables.
13. El sistema debe funcionar aunque la IA falle.
14. No desactives pruebas para aprobar una tarea.
15. No almacenes secretos en el repositorio.
16. Mantén TypeScript en modo estricto.
17. Actualiza la documentación después de cada módulo.
18. Antes de modificar código, inspecciona la implementación existente.
19. Después de cada cambio, ejecuta compilación, linter y pruebas.
20. No afirmes que algo funciona sin presentar evidencia.

## Definición de terminado

Cada tarea se considera terminada únicamente cuando cumple todos estos criterios:

- Código implementado.
- Pruebas aprobadas.
- Sin errores de tipos.
- Sin errores del linter.
- Flujo móvil verificado.
- Manejo de estados de carga, error, vacío y éxito.
- Documentación actualizada.
