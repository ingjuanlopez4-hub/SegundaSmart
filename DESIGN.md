---
name: SegundaSmart
description: Mostrador de hallazgos para administrar piezas únicas, ventas y catálogo compartible.
colors:
  forest: "#20634c"
  forest-dark: "#154b39"
  mint: "#e7f1eb"
  canvas: "#f6f8f6"
  white: "#ffffff"
  ink: "#203b30"
  muted: "#5d6c63"
  line: "#dce4dd"
  field-border: "#a9b8ad"
  sold: "#635479"
  sold-soft: "#efe4ed"
  danger: "#a52620"
  success: "#176447"
  catalog-surface: "#e9f0df"
  catalog-sign: "#d9e7c8"
typography:
  display:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(1.9rem, 4vw, 2.7rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(1.35rem, 3vw, 1.7rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "1.05rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.55
rounded:
  badge: "0.35rem"
  field: "0.6rem"
  control: "0.65rem"
  brand: "0.7rem"
  surface: "0.9rem"
  auth: "1rem"
spacing:
  field-gap: "0.4rem"
  compact: "0.75rem"
  content: "1rem"
  section: "1.25rem"
  roomy: "1.5rem"
  workspace: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.1rem"
  button-primary-hover:
    backgroundColor: "{colors.forest-dark}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.1rem"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 0.85rem"
  status-available:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.badge}"
    padding: "0.2rem 0.55rem"
  surface:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
---

# Design System: SegundaSmart

## Overview

**Creative North Star: "Mostrador de hallazgos"**

Un mostrador digital de tienda de barrio conecta cada hallazgo con su próxima venta. Verde bosque, blanco y menta acompañan fotografías completas, controles suaves y texto cotidiano. La tarea precede al adorno: revisar piezas, registrar una nueva, vender y compartir el catálogo.

La fuente de los tokens es `src/app/globals.css`. Los nombres heredados de algunas variables CSS no definen la identidad actual: `--archive` y `--coral` resuelven ambos al verde bosque; sus variantes oscuras también coinciden. El sidecar `.impeccable/design.json` (schemaVersion 2) extiende este frontmatter con metadatos, sombras, movimiento, breakpoints y ejemplos de componentes.

**Key Characteristics:**
- Verde bosque para acciones y orientación; blanco y menta para trabajar.
- Tipografía local humanista, con cifras tabulares en precios y balance.
- Superficies redondeadas y delimitadas por líneas suaves.
- Fotografías completas de piezas únicas, sin recorte decorativo.
- Marca de ciclo de flechas y continuidad entre navegación móvil y lateral.

## Colors

La paleta combina un acento vegetal sobrio con fondos claros y estados escritos.

### Primary
- **Forest:** Verde bosque para botones principales, enlaces, marca y orientación activa.
- **Forest Dark:** Hover, foco visible y texto sobre menta.
- **Mint:** Selección discreta, disponibilidad, pozos de imagen y apoyos del formulario.

### Secondary
- **Catalog Surface / Catalog Sign:** Verdes claros más cálidos que distinguen la invitación al catálogo y su rótulo de escaparate.

### Tertiary
- **Sold / Sold Soft:** Estado vendido en violeta y fondo tenue.
- **Danger / Success:** Estados semánticos de error y éxito, acompañados por mensajes explícitos.

### Neutral
- **Canvas:** Fondo general ligeramente verdoso.
- **White:** Navegación, formularios, balance y fichas.
- **Ink / Muted:** Texto principal y contexto secundario.
- **Line / Field Border:** Separadores suaves y contorno más definido de campos.

**The Written State Rule.** Disponible, vendida, error y éxito siempre se expresan con texto; el color acompaña el estado.

## Typography

**Display / Body / Utility Font:** Segoe UI, Helvetica Neue, Arial, sans-serif. Las tres variables tipográficas usan esta misma pila local. El layout raíz importa el CSS y no carga Google Fonts.

La jerarquía usa tamaño, peso y espaciado, sin separar metadatos mediante una familia monoespaciada. Los fallbacks `monospace` que aún aparecen en algunas reglas utilitarias no reemplazan la pila local definida.

### Hierarchy
- **Display:** Título de página fluido del frontmatter. El resumen usa 1.75rem por debajo de 560px y 2.5rem desde 1200px; inventario usa 2.5rem. La ficha pública conserva un título mayor, `clamp(2.2rem, 7vw, 4.5rem)`.
- **Headline / Title:** Secciones y nombres de pieza; encabezados de sección operativa a 1.25rem y leyendas de alta a 1rem.
- **Body:** Lectura a interlineado 1.55, instrucciones y descripciones; los textos de encabezado se limitan a 62ch.
- **Label:** Kickers discretos, sin mayúsculas ni tracking de archivo obligatorios. Etiquetas de campo a 0.88rem y peso 700; badges a 0.7rem y peso 600.
- **Price / Balance:** Peso 650, cifras tabulares mediante `font-variant-numeric: tabular-nums`. Precio base a 1.28rem; variantes compactas en inventario y lista reciente. Balance fluido entre 1.4rem y 2rem, con ajuste móvil propio en ventas.

**The Tabular Figures Rule.** Precios y totales se alinean con cifras tabulares de la familia local, sin introducir una fuente remota o monoespaciada.

## Layout

Mobile first: contenedor centrado con máximo de 1160px, márgenes laterales de 1rem y ritmo principal de 1.25rem. Las páginas reservan 6.5rem inferiores para la navegación fija. El alta limita su ancho a 960px.

- **Desde 560px de viewport:** Grilla pública de dos columnas, campos de alta en dos columnas y acciones emparejadas. La lista reciente separa foto, información y acción en tres columnas; por debajo, precio y venta ocupan una fila completa bajo la información.
- **Desde 800px:** La cabecera móvil y la barra inferior dejan paso a una navegación lateral blanca de 224px. El contenido usa márgenes de 1.5rem y padding vertical de 2.5rem. Las secciones de alta mantienen encabezados horizontales; solo aumentan sus paddings. Las acciones del alta se vuelven sticky a 1rem del borde inferior.
- **Desde 1120px:** Rail de 244px, balance del resumen en cuatro columnas y grilla pública en tres. El balance del resumen usa dos columnas por debajo de este umbral, incluido móvil.
- **Desde 1200px:** Lista reciente y escaparate del catálogo se colocan lado a lado, con columna lateral de 290px y separación de 2rem. Por debajo, se apilan.
- **Inventario por ancho útil:** Container queries a 560px para dos columnas y a 960px para tres. Por debajo usa fichas horizontales con foto de 112px. El rail puede reducir el ancho útil y devolver la grilla a una columna.
- **Ventas por ancho útil:** Una columna hasta 720px de contenedor; desde allí, formulario e historial en dos columnas. Su balance compacto mantiene tres columnas, también en móvil y escritorio ancho.

## Elevation & Depth

Fondos blancos, campos de menta y líneas de un píxel separan superficies sin hacer flotar cada ficha. Las esquinas suaves aportan cercanía sin sustituir la estructura. La autenticación usa la sombra ambiental `0 18px 48px rgb(28 60 44 / 9%)`; la navegación móvil conserva `0 -10px 28px rgb(20 38 75 / 8%)` para separarse del contenido que desplaza.

Botones: transición de fondo, borde y posición a 180ms ease-out; campos: borde y halo a 160ms ease-out. El espacio de trabajo del resumen entra con un desplazamiento vertical de 8px a 0 en 350ms, `cubic-bezier(.16, 1, .3, 1)`. La preferencia de movimiento reducido acorta transiciones y animaciones a .01ms y elimina desplazamiento de scroll animado.

## Shapes

Controles suaves y superficies redondeadas según el frontmatter: campos y carga de foto, botones y navegación, luego fichas, balance, paneles y secciones. Los badges son pequeños rectángulos suavizados. Los números del alta viven en círculos de 2rem sobre menta.

La marca muestra un ciclo de dos flechas blancas dentro de un cuadrado verde redondeado de 2.2rem; `Segunda` usa tinta y `Smart` verde con menor peso. No usa las antiguas iniciales recortadas. La carga de foto y el vacío del resumen usan borde discontinuo; las superficies de trabajo usan borde sólido.

## Components

### Buttons
- Primario verde con texto blanco, borde del mismo acento, peso 600, altura mínima de 46px y padding del frontmatter.
- Hover verde oscuro; active desplaza 1px hacia abajo. Foco global con outline de 3px verde oscuro y offset de 3px.
- Secundario blanco, texto verde y borde suave; hover menta. La variante del escaparate es transparente con borde verde tenue.
- Peligro rojo; disabled a opacidad .55 y cursor de espera. Las etiquetas pendientes explican la acción en curso.

### Navigation

Cuatro rutas con iconos delineados y etiquetas persistentes. En móvil, barra blanca fija con targets de 54px y espacio para el safe area. Las rutas activas ordinarias reciben menta; `Agregar pieza` mantiene texto blanco sobre verde, incluso activo, cuando el fondo se oscurece. No hay pestaña coral ni muesca elevada.

En escritorio, rail blanco de altura de viewport con scroll propio. La fila activa usa menta; agregar sigue siendo blanco sobre verde y, activo, suma un contorno interior tenue. Nombre del negocio con salto de línea; catálogo y cierre de sesión permanecen disponibles en cabecera móvil o pie del rail. Los accesos auxiliares tienen altura mínima de 44px.

### Balance y resumen

El resumen presenta encabezado compacto con `Agregar pieza`, balance de cuatro datos reales y espacio de trabajo de mercancía/catálogo. El balance contiene piezas disponibles, piezas vendidas, ingresos acumulados y ganancia acumulada. No representa evolución por periodo, proyecciones ni porcentajes de crecimiento.

La lista consulta hasta cuatro piezas disponibles más recientes del negocio autenticado, ordenadas por fecha de alta descendente. Muestra foto completa, disponibilidad, nombre enlazado a ficha pública, categoría, condición, precio en MXN y `Registrar venta` con producto en la URL. El vacío ofrece registrar la primera pieza. El escaparate abre el catálogo real del negocio y permite compartirlo en WhatsApp y Facebook; las piezas vendidas se retiran del catálogo.

### Fichas y fotografías

Fichas blancas con borde suave, estado escrito, referencia cuando corresponde y precio. Fotografías con `object-fit: contain` en lista reciente, inventario, catálogo, ficha pública y vista previa del alta: mostrar la pieza completa tiene prioridad sobre llenar el marco. El componente de foto ofrece mensaje y reintento si falla la carga. El `cover` del vídeo del escáner no es una regla para fotografías de producto.

Inventario conserva búsqueda y filtros enlazables `Todas`, `Disponibles` y `Vendidas`, con conteos acotados a la búsqueda. Buscar y limpiar conservan el estado seleccionado. Las acciones privadas ocupan un pie separado, con venta primero y luego compartir/QR; las piezas vendidas omiten venta y acceso público. Sus botones tienen al menos 46px. La grilla pública general conserva botones compactos de 42px: no se presenta ese tamaño como mínimo universal de la aplicación.

### Alta por secciones

Tres fieldsets blancos con leyendas horizontales numeradas en todos los tamaños: `1 Conoce la pieza`, `2 Valor`, `3 Ficha publicable`. No hay bandas verticales de color en escritorio. Fotografía e identidad preceden costo/precio y descripción.

Campos con mínimo de 50px, borde definido, radio suave y halo de menta al foco; textareas de al menos 150px, redimensionables verticalmente. Los errores usan texto asociado y `aria-invalid`; la validación dirige al primer campo inválido. El guardado captura datos y archivo antes de bloquear controles y conserva valores ante error recuperable.

La asistencia de texto/precio sigue siendo opcional, editable y cancelable. Informa si la sugerencia es de IA o local, conserva descripción y precio propios, descarta respuestas desactualizadas y permite guardar sin esperar. El rango orientativo no es una tasación; la ganancia estimada del alta es precio menos costo, sin otros gastos.

### Ventas y estados

Con `producto` en la URL, el formulario y el historial preceden al balance y a la búsqueda; sin selección por URL, balance compacto de tres columnas y búsqueda aparecen antes. No se elimina el balance cuando se llega desde una pieza: se reordena para priorizar la tarea.

La venta mantiene validación, confirmación previa, bloqueo de duplicados, tratamiento explícito de pieza no disponible, recuperación de errores y conflictos concurrentes. El éxito anuncia la venta y la retirada pública. Vacíos distinguen ausencia de piezas, ausencia de coincidencias e historial aún vacío. Inventario conserva placeholder estático anunciado durante carga y error con reintento.

## Do's and Don'ts

### Do:
- **Do** usar verde bosque, blanco y menta con controles suaves y superficies redondeadas.
- **Do** conservar fotografías completas, estados escritos y cifras tabulares.
- **Do** mantener `Agregar pieza` accesible y legible en blanco sobre verde, incluso activo.
- **Do** documentar cifras del negocio como acumuladas y piezas recientes como disponibles.
- **Do** mantener encabezados numerados horizontales en el alta y sugerencias editables.

### Don't:
- **Don't** recuperar la identidad azul/coral, las bandas verticales, la tipografía de archivo ni las iniciales recortadas.
- **Don't** cargar Google Fonts o introducir una familia monoespaciada para los importes.
- **Don't** recortar fotografías de piezas para llenar una composición.
- **Don't** inventar tendencias, comparativas, métricas comerciales o garantías de IA.
