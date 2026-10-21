# Inventario y navegación — incremento UI/UX

## Diagnóstico de implementación

- La cabecera heredaba un título de hasta 5.5rem y un margen de hasta 4rem antes de la búsqueda, además del gap de página.
- Disponibles y vendidas se presentaban siempre en secciones consecutivas, sin filtro de estado.
- La cuadrícula elegía dos columnas desde 560px de ventana incluso tras restar el rail de 238px a 800px. No consideraba el espacio realmente disponible.
- Las acciones estaban anidadas en el cuerpo de la ficha: su `grid-column` móvil no podía extenderlas al ancho del artículo. Los botones tenían 42px de alto.
- La navegación usaba abreviaturas de dos letras y solo color para la selección móvil; el nombre del negocio quedaba truncado. Las fotos no tenían recuperación visible ante fallo.

Estas son observaciones del código. No se atribuyen tasas de abandono ni resultados de investigación a usuarios reales.

## Contratos y decisiones

- `q` sigue normalizado con `normalizeProductQuery` y consultado mediante `productSearchWhere`, siempre dentro del negocio autenticado. No se amplían APIs ni se exponen costos.
- `estado=disponibles|vendidas`; ausencia/valor desconocido equivale a `todas`. Repetidos: se usa el primero. `inventoryHref` codifica la consulta y conserva solo los parámetros reconocidos.
- Los conteos corresponden a la consulta actual, no a supuestas métricas globales. Se mantiene la cantidad total registrada en la cabecera.
- Búsqueda manual y escáner conservan estado; limpiar quita solo `q`. El campo se sincroniza al cambiar la URL mediante navegación cliente. Se evita precargar destinos operativos para no anticipar instantáneas de inventario que puede cambiar.
- Contenedor útil de 560/960px para dos/tres columnas; una columna en 800px de ventana. No se oculta overflow para disimular problemas.
- Venta primero en un footer separado; vendidas sin venta ni enlace público. QR mantiene el endpoint autenticado existente. La venta conserva confirmación y garantías transaccionales.
- `ProductPhoto` usa Next Image con carga nativa, nombre alternativo y reintento ante error. Inventario privado encuadra la pieza completa; catálogo mantiene el recorte anterior. Solo se pasan URL y nombre al cliente, nunca el registro privado completo.
- Navegación: iconos SVG locales y texto, selección textual/estructural, foco visible, contexto del negocio con reflujo y rail desplazable. No hay dependencias nuevas.

## Criterios de aceptación

1. Inventario y rutas afectadas sin desbordamiento a 360, 390, 800 y 1024px; límites de breakpoint revisados.
2. Búsqueda por nombre/referencia/QR, filtros y limpieza funcionales; vacíos con siguiente paso real.
3. Registro persistido, foto decodificada, descarga QR y venta correctos; aislamiento y retirada pública conservados.
4. Objetivos principales ≥44px, foco de teclado visible y movimiento reducido respetado.
5. Carga, error recuperable y éxito implementados sin perder contexto de navegación.

## Verificación

Ejecución final contra producción local, con Chrome headless mediante CDP:

- `npm run lint`: aprobado.
- `npm run typecheck`: aprobado.
- `npm test`: **140 pruebas en 13 archivos**, aprobadas. Tres regresiones nuevas para normalización, codificación y conservación del estado en enlaces de inventario.
- `npm run build`: aprobado; después se ejecutó `node /tmp/opencode/qa-inventory.mjs`: **16 escenarios aprobados, 0 fallos y 0 excepciones JavaScript no capturadas**. `git diff --check`: aprobado.
- Emulación móvil: **360×800 y 390×800**. Escritorio: **800×900, 1024×900 y 1440×900**. También se midieron 559, 560, 591, 592, 799, 1119 y 1120px, con altura de 800px por debajo de 800px de ancho, y 900px en escritorio. En todos `scrollWidth <= clientWidth`. La barra de desplazamiento de escritorio resta 15px al área útil: a 800px queda una columna de 499px; a 1024px, dos de 353.5px.
- Registro real, inventario vacío, alta desde formulario y confirmación persistida. Segunda alta HTTP con foto horizontal y precio máximo de 1,000,000 MXN. Ambas fotos nuevas se decodifican en inventario y catálogo, sin reiniciar producción.
- Búsqueda por nombre, referencia y URL de QR; negocio ajeno no accesible; filtro vendido sin venta/enlace público; sin coincidencias y limpieza conservando estado. La recuperación vacía usa navegación nativa, igual que el formulario GET, evitando depender de una respuesta RSC anterior.
- QR: respuesta real `200 image/png` con contenido. Venta real desde enlace, conflicto en segunda pestaña, exactamente una venta persistida y retirada pública.
- Error fotográfico **simulado** mediante evento `error`, seguido de reintento y decodificación real. Error de consulta **inducido** renombrando temporalmente la tabla Product solo en la base desechable; restauración y botón de recarga recuperan las tres fichas. La recuperación vuelve a pedir el documento completo, conserva la URL y descarta respuestas RSC fallidas. El log de servidor contiene el error Prisma esperado de esta simulación.
- Objetivos principales medidos a 360px: ninguno por debajo de 44×44px; pie de acciones de 326px de ancho. Tab entre filtros y foco visible de 3px comprobados. Movimiento reducido aplicado: transición computada de 0.00001s.
- Contraste calculado de los pares usados: texto secundario sobre blanco **5.98:1** y papel **5.57:1**; azul oscuro sobre azul suave **9.71:1**; blanco sobre azul archivo **8.69:1**; grafito sobre coral **6.12:1**; sello vendido **6.94:1**. Esto no constituye una auditoría completa WCAG.
- El detector Impeccable emitió avisos consultivos de tamaños/tonos en CSS compartido, muchos preexistentes. Los tamaños operativos nuevos y el hover coral reutilizado están explicados en DESIGN.md; no se intentó rediseñar el resto de pantallas para silenciar avisos.

### Evidencia y límites

Directorio final: `/tmp/opencode/ss-inventory-1792556677632/`. Incluye `results.json`, `server.log` y capturas `inventario-360.png`, `inventario-390.png`, `inventario-800.png`, `inventario-1024.png`, `inventario-1440.png`, `inventario-vacio-360.png`, `inventario-sin-resultados-360.png`, `foto-error-360.png`, `inventario-error-360.png` y `catalogo-1024.png`. Se inspeccionaron visualmente las capturas móvil y escritorio. No se capturó una línea base antes/después con los mismos datos.

Los recursos de navegador se crearon sin dotenv, con SQLite y fotos temporales. Las fotografías son fixtures geométricos generados, no mercancía real ni contenido definitivo del producto. Los procesos de prueba se detuvieron. El script de navegador y sus artefactos son temporales y pueden desaparecer al limpiar `/tmp`; las pruebas unitarias nuevas sí están versionadas.

**Pendientes reales:** dispositivo/cámara física, Safari/iOS, lector de pantalla y teclado virtual. El reflujo se comprobó a 512px CSS (equivalente de ancho a 1024px con zoom 200%), no mediante zoom nativo del navegador. El esqueleto `loading.tsx` está implementado, pero su aparición transitoria no se capturó de forma controlada; tampoco se capturó el botón pendiente en la ejecución final (`pendingCaptured: false`), aunque la recuperación sí se completó. No se verificaron Blob/Turso remotos ni carga con inventarios masivos; se conserva la consulta existente sin paginación.
