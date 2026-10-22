---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/app/page.tsx"
related_targets: ["src/app/app/layout.tsx","src/app/app/inventario/page.tsx","src/app/app/productos/nuevo/page.tsx","src/app/app/ventas/page.tsx"]
---

# Panel autenticado

- **Modo:** Operar.
- **Audiencia:** Personas dueñas de pequeños negocios de segunda mano que trabajan principalmente desde el teléfono.
- **Trabajo principal:** Revisar el estado real del negocio y sus piezas disponibles, registrar un hallazgo, venderlo o compartir el catálogo sin perder contexto.
- **Acción dominante:** `Agregar pieza` permanece visible en navegación móvil y escritorio.
- **Contenido y prueba:** Datos limitados al negocio autenticado: piezas disponibles y vendidas, ingresos y ganancia acumulados. Hasta cuatro piezas disponibles recientes, por fecha de alta descendente, con foto, nombre, categoría, condición, precio MXN y venta directa mediante `?producto=`. No se inventan tendencias ni métricas comerciales.
- **Dirección:** Mostrador de hallazgos: verde bosque (#20634c), fondo #f6f8f6, blanco y menta; tipografía local Segoe UI / Helvetica Neue / Arial, controles suaves y superficies redondeadas. Marca de ciclo de flechas y fotos completas con `contain`.
- **Composición:** Encabezado compacto con `Agregar pieza`, balance integrado y lista operativa de piezas disponibles junto a una invitación al catálogo real con enlaces de WhatsApp y Facebook. El vacío permite registrar la primera pieza.
- **Responsive:** Balance de dos columnas en móvil y cuatro desde 1120px. Lista y escaparate se apilan hasta 1200px; desde allí, escaparate lateral de 290px. Navegación inferior fija hasta 800px; después, rail blanco de 224px, ampliado a 244px desde 1120px. Agregar mantiene texto blanco sobre verde también activo.
- **Momento memorable:** Las fotografías de hallazgos reales se acompañan de venta directa; el rótulo verde claro «Segunda oportunidad.» conecta la operación privada con el escaparate compartible.
- **Continuidad del alta:** Tres secciones numeradas con encabezados horizontales en móvil y escritorio: Conoce la pieza, Valor y Ficha publicable. Fotos completas, validación existente y asistencia opcional, editable, cancelable y con alternativa local.
- **Continuidad de ventas:** Con producto en URL, formulario e historial antes de balance/búsqueda; sin producto en URL, balance compacto de tres columnas y búsqueda primero. Se mantienen confirmación, validación y recuperación de conflictos existentes.
- **Restricciones:** Mobile first, piezas únicas, IA opcional y editable, venta irreversible confirmada, catálogo y cierre de sesión accesibles desde todas las rutas.
- **Estado documental:** Derivado de CSS, páginas y componentes implementados. El detector previo reportó solo advisories al comparar el nuevo mundo con el DESIGN anterior; no se repite. Pruebas y verificación visual final corresponden al agente principal.
