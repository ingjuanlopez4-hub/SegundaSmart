# Analisis competitivo UX

Fecha de corte: 29 de julio de 2026.

## Resumen ejecutivo

SegundaSmart ocupa un espacio entre el software de consignacion, el POS generalista y las herramientas de publicacion para revendedores. Su oportunidad no consiste en igualar la amplitud de Shopify o SimpleConsign, sino en reducir el recorrido completo de una pieza unica: fotografiar, describir, fijar precio, publicar, identificar con QR y registrar la venta sin desincronizar el inventario.

Hallazgos principales:

- ConsignCloud ofrece el mejor referente de alta manual y venta para reventa, pero depende de Shopify o Square para publicar.
- SimpleConsign es el referente directo en alta asistida por IA, aunque obliga a iniciar un lote en escritorio y continuar en el telefono mediante QR.
- Ricochet integra POS y tienda web, pero exige mas configuracion y pasos para publicar.
- Shopify cubre casi todo mediante un ecosistema amplio, con mayor coste y complejidad que la necesaria para una pieza unica.
- Loyverse es un buen referente de POS movil economico, pero no resuelve catalogo, IA ni QR individual.
- Vendoo entiende mejor la publicacion multicanal de unidades unicas, pero no procesa ventas y su retirada automatica no es inmediata.
- Ningun competidor evaluado combina de forma nativa y simple el alcance completo de SegundaSmart.

La posicion recomendada es: **la forma mas corta y segura de convertir una pieza fisica unica en inventario publicable y venta registrada desde el telefono**.

## Metodo y limites

El analisis usa documentacion oficial publica y paginas de producto. No se realizaron pruebas moderadas, mediciones de rendimiento ni una auditoria de las aplicaciones autenticadas.

- `Directo`: mismo problema y comercios de reventa o consignacion.
- `Indirecto`: resuelve parte del recorrido para comercios o revendedores.
- `Benchmark`: patron destacado de un dominio adyacente.
- Soporte: `Nativo`, `Integracion`, `Parcial` o `No`.
- UX: evaluacion heuristica de 1 a 5 basada en pasos, continuidad, claridad y ajuste al contexto movil. No es una puntuacion oficial.
- Pasos: aproximacion basada en flujos documentados; no incluye registro ni configuracion inicial salvo que sea parte esencial del recorrido.

## Panorama competitivo

| Tipo | Producto | Trabajo principal que resuelve | Encaje con SegundaSmart |
| --- | --- | --- | --- |
| Directo | SimpleConsign | Consignacion, POS, inventario, IA y reporting | Alto; mayor profundidad, mas complejidad |
| Directo | ConsignCloud | Operacion simple de tiendas de reventa y consignacion | Muy alto; cercano en alta y venta |
| Directo | Ricochet | Consignacion, POS y ecommerce especializado | Alto; fuerte en ecosistema, menos directo |
| Indirecto | Shopify POS | Comercio omnicanal, POS y ecommerce | Alto por cobertura; bajo por simplicidad |
| Indirecto | Loyverse | POS e inventario movil economico | Medio; no cubre publicacion |
| Indirecto | Vendoo | Publicacion multicanal para revendedores | Medio; no cubre venta presencial |
| Benchmark | Square for Retail | Inventario y venta como una sola operacion | Referente operativo |
| Benchmark | Depop y Vinted | Alta movil de una pieza unica | Referente de captura y confianza |
| Benchmark | WhatsApp Business | Compartir catalogo y abrir conversacion | Referente de distribucion |

## Matriz de tareas

### Alta de una pieza

| Producto | Soporte | Pasos aprox. | UX | Enfoque distintivo |
| --- | --- | ---: | ---: | --- |
| SegundaSmart | Nativo | 4 bloques | Objetivo 5 | Foto, identidad, valor y ficha publicable en un solo flujo movil |
| SimpleConsign | Nativo | 6 | 5 | Foto e IA sugieren atributos, descripcion y precio; revision editable [D1] |
| ConsignCloud | Nativo | 3 | 4 | Panel configurable con valores predeterminados y cantidad [D2] |
| Ricochet | Nativo | 5-6 | 3 | Alta ligada primero a la cuenta del consignador [D3] |
| Shopify POS | Nativo | 4 | 4 | Alta movil sincronizada con canales [I1] |
| Loyverse | Nativo | 5 | 4 | Alta rapida en POS, pero los datos completos viven en Back Office [I2] |
| Vendoo | Nativo | 5-7 | 4 | Ficha maestra para publicar una unidad en varios marketplaces [I3] |

Lectura UX: ConsignCloud reduce pasos manuales; SimpleConsign reduce trabajo intelectual, pero rompe la continuidad entre escritorio y telefono. SegundaSmart debe conservar un unico contexto movil y permitir terminar sin IA.

### Publicacion y catalogo

| Producto | Soporte | Pasos aprox. | UX | Enfoque distintivo |
| --- | --- | ---: | ---: | --- |
| SegundaSmart | Nativo | 1 al guardar | Objetivo 5 | Catalogo propio, enlace por pieza y exclusion automatica de vendidos |
| SimpleConsign | Integracion | 5 fases | 3 | Shopify requiere plan superior e intervencion de soporte [D4] |
| ConsignCloud | Integracion | 1 por pieza | 4 | Toggle `List on Shopify`; sincroniza una pieza de cantidad 1 [D5] |
| Ricochet | Nativo/integracion | 8 | 4 | Tienda web propia o Shopify como complemento [D6] |
| Shopify POS | Nativo | 4 | 5 | Tienda y canales sociales desde el mismo catalogo [I1] |
| Loyverse | Integracion | Variable | 2 | Depende de conectores de terceros [I4] |
| Vendoo | Nativo | 3-5 | 4 | Publicacion en marketplaces, no catalogo propio de marca [I5] |

Lectura UX: el catalogo incluido y compartible es una ventaja real frente a los competidores directos, que requieren ecommerce adicional. SegundaSmart no necesita checkout ni crosslisting para sostener esa ventaja dentro del MVP.

### Venta y sincronizacion

| Producto | Soporte | Pasos aprox. | UX | Enfoque distintivo |
| --- | --- | ---: | ---: | --- |
| SegundaSmart | Nativo | 3 | Objetivo 5 | Transaccion que reclama la pieza, registra venta y la retira del catalogo |
| SimpleConsign | Nativo | 3-4 | 4 | Pago, reparto y conciliacion integrados [D7] |
| ConsignCloud | Nativo | 5-6 | 5 | Venta directa, pagos divididos y alta sin salir del POS [D8] |
| Ricochet | Nativo | 4-5 | 4 | La venta entra en reportes al generar recibo [D9] |
| Shopify POS | Nativo | 6 | 5 | Checkout e inventario omnicanal conectados [I6] |
| Loyverse | Nativo | 6 | 5 | Flujo movil claro y modo offline con restricciones [I7] |
| Vendoo | Parcial | Variable | 1 | Detecta ventas externas y despublica despues; no es POS [I8] |

Lectura UX: la diferenciacion critica no es tener un checkout mas completo. Es impedir una segunda venta y actualizar la disponibilidad publica en la misma operacion. Las integraciones de ConsignCloud y el sondeo de Vendoo dejan ventanas residuales de desincronizacion.

## Comparacion funcional

| Capacidad MVP | SegundaSmart | SimpleConsign | ConsignCloud | Ricochet | Shopify POS | Loyverse | Vendoo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pieza unica por defecto | Si | Si | Si | Si | Configurable | Configurable | Si |
| Foto desde movil | Si | Si | Si | Si | Si | Si | Si |
| Descripcion IA editable | Si, con fallback | Si | No verificado | No verificado | Si | No verificado | Si |
| Precio sugerido | Si | Si | No verificado | No verificado | Parcial | No | No verificado |
| Catalogo propio incluido | Si | No | No | Complemento | Si | No | No |
| Compartir por WhatsApp/Facebook | Si | Via tienda | Via tienda | Via tienda | Canal/enlace | No nativo | Facebook Marketplace |
| QR por pieza | Si | QR para alta IA | No verificado | Parcial | App adicional | No | No |
| Venta presencial | Si | Si | Si | Si | Si | Si | No |
| Retiro inmediato al vender | Si | Segun integracion | No garantizado | En ecosistema | Requiere configurar visibilidad | Segun conector | Hasta 10 minutos |
| Costo, ingreso y ganancia | Si | Si | Si | Si | Si | Si | Si |

`No verificado` significa que no se encontro evidencia oficial suficiente; no prueba que la funcion no exista.

## Evaluacion UX transversal

| Producto | Arquitectura e interaccion | Contenido y visual | Movil | Accesibilidad y rendimiento |
| --- | --- | --- | --- | --- |
| SimpleConsign | Amplio back office; IA potente, continuidad interdispositivo debil | Denso y orientado a operacion | Flujo de foto y app de indicadores; no todo el sistema es mobile first | Sin evidencia suficiente de WCAG o metricas |
| ConsignCloud | Alta y POS directos; campos configurables reducen ruido | Lenguaje especializado y estructura pragmatica | Funciona en navegadores modernos; mobile first no demostrado | Sin evidencia suficiente de WCAG o metricas |
| Ricochet | Navegacion centrada en consignador; publicacion mas larga | Ecosistema coherente pero con mas configuracion | Evidencia solida de uso en iPad | Aviso publico de accesibilidad; no demuestra conformidad de la app |
| Shopify POS | IA amplia y omnicanalidad; mayor carga de configuracion | Sistema maduro y contenido localizado | Aplicaciones moviles completas | No auditado en este estudio |
| Loyverse | POS simple; la ficha se fragmenta con Back Office | Interfaz utilitaria y directa | Referente de venta movil y operacion offline | No auditado en este estudio |
| Vendoo | Buena ficha maestra; retirada depende de canales externos | Optimizado para volumen de marketplaces | App para crear y editar publicaciones | No auditado en este estudio |

No se asignan notas de accesibilidad o rendimiento sin pruebas comparables. Los sitios comerciales no son evidencia de la calidad de las aplicaciones autenticadas.

## Perfiles

### SimpleConsign

**Fortalezas:** IA basada en una o dos fotos, sugerencias editables, precio orientativo, reporting avanzado y operacion completa de consignacion.

**Debilidades:** la IA requiere plan Professional; el recorrido empieza en escritorio, salta al telefono por QR y expira; Shopify requiere configuracion y soporte.

**Leccion:** adoptar revision humana y amplitud suficiente de sugerencias, no la dependencia del escritorio ni la complejidad de consignadores, repartos y pagos.

### ConsignCloud

**Fortalezas:** alta manual breve, campos configurables, lotes, POS directo y modelo natural de cantidad 1.

**Debilidades:** sin IA o QR individual verificados, sin escaparate propio y con posible ventana de doble venta al sincronizar Shopify.

**Leccion:** mantener el alta manual rapida y los valores predeterminados; superar la dependencia de ecommerce externo.

### Ricochet

**Fortalezas:** POS en iPad, webstore especializado, QR y reportes de reventa.

**Debilidades:** alta ligada al consignador, mas pasos de publicacion y complementos de pago.

**Leccion:** conservar la cohesion inventario-web sin replicar configuracion avanzada fuera del MVP.

### Shopify POS

**Fortalezas:** mejor cobertura omnicanal, catalogo publico, IA, POS, costos, reportes y ecosistema.

**Debilidades:** coste y complejidad; una pieza es un producto con stock `1`, y quedar sin stock no garantiza que desaparezca del catalogo.

**Leccion:** competir por foco y velocidad, no por cantidad de funciones.

### Loyverse

**Fortalezas:** POS movil claro, bajo coste, inventario por unidad y beneficio bruto.

**Debilidades:** sin catalogo, IA, QR individual ni publicacion social nativos; parte de la ficha requiere Back Office.

**Leccion:** usar su venta movil como referencia de claridad, no su arquitectura fragmentada.

### Vendoo

**Fortalezas:** ficha unica para revendedores, publicacion multicanal, IA y analitica de beneficios.

**Debilidades:** no procesa ventas, no tiene catalogo propio y la deteccion puede tardar hasta diez minutos con un ordenador conectado.

**Leccion:** tratar la pieza como fuente de verdad unica, pero resolver la venta de forma transaccional y local al producto.

## Benchmarks transferibles

| Benchmark | Patron a adoptar | Adaptacion al MVP | Riesgo al copiar literalmente |
| --- | --- | --- | --- |
| Square for Retail | Producto, costo, inventario y venta conectados | Buscar o escanear una pieza y registrar una venta atomica [A1] | Carritos, ubicaciones y reposicion agregan complejidad innecesaria |
| Depop | Fotos primero, borrador editable y precio asistido | Captura movil en cuatro bloques y sugerencia no vinculante [A2] | Video, seguidores, hashtags y envios quedan fuera del MVP |
| Vinted | Condicion y defectos explicitos en foto y texto | Pedir verificacion de estado antes de publicar [A3] | `Marcar vendido` sin transaccion perderia el registro financiero |
| WhatsApp Business | Enlace a catalogo o producto y conversacion inmediata | Compartir ficha con mensaje prellenado y disponibilidad actual [A4] | Duplicar el catalogo en WhatsApp rompe la fuente unica de verdad |

## Mapa de oportunidades

### P0: defender el nucleo

| Oportunidad | Valor para el usuario | Evidencia competitiva | Decision |
| --- | --- | --- | --- |
| Alta enteramente movil | Evita volver al escritorio junto a la mercancia | SimpleConsign divide el flujo entre dispositivos | Mantener foto, datos, sugerencia y guardado en una vista continua |
| Estado de pieza inequivoco | Evita vender o mostrar una unidad inexistente | Shopify modela stock; Vendoo sincroniza con retraso | Usar estados explicitos y venta transaccional |
| Catalogo incluido | Elimina Shopify, dominio y conectores | Los tres competidores directos requieren tienda o complemento | Mantener catalogo publico ligero por negocio |
| Retiro automatico al vender | Evita consultas y dobles ventas | ConsignCloud reconoce una ventana residual de sincronizacion | Consultar solo disponibles y reclamar la pieza en backend |
| Compartir por enlace y QR | Convierte inventario en material vendible | WhatsApp reduce la distancia entre ficha y conversacion | URL estable por pieza, QR y enlaces sociales funcionales |

### P1: mejorar decision y confianza

| Oportunidad | Valor para el usuario | Regla de producto |
| --- | --- | --- |
| IA editable con fallback | Acelera sin bloquear el trabajo | Nunca publicar ni guardar afirmaciones no revisadas automaticamente |
| Rango de precio explicable | Reduce falsa precision | Mostrar precio editable y ganancia estimada; no prometer tasacion |
| Registro claro de defectos | Mejora confianza en catalogo | Pedir condicion y texto verificable; usar fotos reales |
| Busqueda por nombre, referencia o QR | Agiliza venta e inventario | El QR complementa, no sustituye, la busqueda |

### No perseguir en el MVP

- Ecommerce con pagos y envios.
- Crosslisting a marketplaces.
- Gestion avanzada de consignadores y repartos.
- Variantes, reposicion, multiples ubicaciones o proveedores.
- Fidelizacion, promociones, layaway o pagos divididos.
- Funciones sociales de marketplace.

### Estado de implementacion del MVP

Verificado en el repositorio el 29 de julio de 2026:

- **P0 implementado:** alta continua y mobile first con fotografia; estado explicito disponible/vendido; catalogo publico que consulta solo disponibles; venta transaccional con reclamo condicional; referencia persistente unica por negocio; busqueda por nombre, referencia o URL QR con escaneo progresivo; URL publica canonica y QR por pieza; compartir catalogo y pieza por WhatsApp y Facebook.
- **P1 implementado:** asistencia editable con fallback local; rango orientativo explicado como referencia y no como tasacion; ganancia estimada durante alta y venta; condicion y defectos verificables, siendo obligatorios los defectos cuando la pieza esta `Con detalles`.
- **Garantias cubiertas por pruebas:** normalizacion y aislamiento de busqueda, unicidad de referencia, validacion de defectos, doble venta concurrente y retirada de la consulta publica despues de vender.
- **Seguimiento pendiente de medicion con usuarios reales:** tiempos de alta y revision de IA, conteo observado de pasos en telefono y compatibilidad efectiva del escaneo segun navegador. La busqueda textual permanece disponible cuando `BarcodeDetector` o la camara no existen.

## Criterios de seguimiento

Para validar la ventaja de UX se deben medir estos recorridos en telefono:

| Metrica | Objetivo inicial |
| --- | --- |
| Tiempo desde `Agregar pieza` hasta guardar sin IA | Menos de 2 minutos |
| Tiempo adicional para generar y revisar sugerencia | Menos de 45 segundos, excluido proveedor |
| Pasos desde una pieza disponible hasta venta registrada | 3 o menos |
| Productos vendidos visibles en catalogo | 0 |
| Intentos de doble venta aceptados | 0 |
| Finalizacion del alta cuando falla IA | Igual que el flujo manual |

Los objetivos anteriores siguen siendo criterios de seguimiento, no resultados medidos. La implementacion automatizada verifica productos vendidos visibles y doble venta en pruebas de integracion; los tiempos y pasos requieren sesiones sobre telefonos reales.

## Referencias anotadas

Consultadas el 29 de julio de 2026. Cada nota indica el dato utilizado y su implicacion para SegundaSmart.

### Competidores directos

- [D1 - SimpleConsign: AI-Automated Item Entry](https://help.simpleconsign.com/hc/en-us/articles/30779287450253-AI-Automated-Item-Entry): documenta lote, QR, una o dos fotos, campos sugeridos, edicion y aprobacion. Referente de IA; evidencia la friccion del salto de dispositivo.
- [D2 - ConsignCloud: Adding an Item](https://help.consigncloud.com/en/articles/11880721-adding-an-item-next-gen): muestra panel lateral, diez campos iniciales y campos configurables. Referente de alta manual.
- [D3 - Ricochet: Adding Consigned Inventory](https://help.ricoconsign.com/en/articles/2508290-adding-consigned-inventory): vincula el alta a la cuenta de un consignador. Explica su mayor profundidad y navegacion.
- [D4 - SimpleConsign: Shopify Integration](https://help.simpleconsign.com/hc/en-us/articles/20920298759437-Shopify-Integration-Overview): registra requisitos de plan, instalacion y soporte. Sustenta la oportunidad de catalogo incluido.
- [D5 - ConsignCloud: Shopify Integration](https://help.consigncloud.com/en/articles/3212864-integrating-consigncloud-with-shopify): documenta publicacion, stock y riesgo residual de doble venta.
- [D6 - Ricochet: Webstore Addon](https://help.ricoconsign.com/en/articles/8568224-ricochet-webstore-addon): evidencia tienda propia como complemento, no como flujo base.
- [D7 - SimpleConsign: Consignment POS](https://www.simpleconsign.com/consignment-pos-software): evidencia pagos y conciliacion integrados.
- [D8 - ConsignCloud: Making a Sale](https://help.consigncloud.com/en/articles/11887750-making-a-sale-next-gen): documenta busqueda, pago, finalizacion y recibo.
- [D9 - Ricochet: Run a Simple Sale](https://help.ricoconsign.com/en/articles/2508319-run-a-simple-sale): documenta el flujo y la dependencia del recibo para reporting.

### Competidores indirectos

- [I1 - Shopify: alta y disponibilidad de productos](https://help.shopify.com/es/manual/products/add-update-products): evidencia alta movil, fotos, inventario y canales.
- [I2 - Loyverse: articulos y categorias](https://help.loyverse.com/es/help/items-categories): evidencia alta desde POS movil.
- [I3 - Vendoo: aplicacion movil](https://www.vendoo.co/mobile-app): evidencia captura y gestion movil para revendedores.
- [I4 - Loyverse Marketplace](https://loyverse.com/marketplace): confirma que ecommerce depende de integraciones.
- [I5 - Vendoo: marketplaces](https://www.vendoo.co/marketplaces): delimita los destinos de publicacion y la ausencia de catalogo propio.
- [I6 - Shopify POS](https://www.shopify.com/pos): conecta venta presencial e inventario omnicanal.
- [I7 - Loyverse: realizar ventas](https://help.loyverse.com/es/help/make-sales): documenta el flujo movil de cobro.
- [I8 - Vendoo: Sale Detection and Auto Delist](https://www.vendoo.co/sale-detection-and-auto-delist): documenta deteccion y retirada multicanal; la sincronizacion no equivale a una transaccion local.

### Benchmarks

- [A1 - Square: inventario desde Retail POS](https://squareup.com/help/us/en/article/6110-manage-inventory-with-the-retail-pos-app): busqueda, escaneo, revision y ajustes de stock.
- [A2 - Depop: publicar una pieza](https://depophelp.zendesk.com/hc/en-gb/articles/360032716413-How-to-list-an-item): patron de fotos, descripcion, categoria, precio y publicacion.
- [A3 - Vinted: describir una pieza](https://www.vinted.com/help/49-describing-an-item): exige comunicar defectos y condicion con precision.
- [A4 - Meta: catalogos para pequenos negocios](https://about.fb.com/news/2019/11/introducing-catalogs-for-small-businesses/): sustenta catalogo compartible y conversacion como canal de compra.

## Cadencia de actualizacion

Revisar trimestralmente o cuando un competidor cambie IA, integraciones, precios o sincronizacion de inventario. En cada revision se debe conservar la fecha de consulta, volver a ejecutar los tres recorridos criticos y separar evidencia observada de inferencias.
