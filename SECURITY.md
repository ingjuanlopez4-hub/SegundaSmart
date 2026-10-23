# Reportar vulnerabilidades

Usa el canal privado habilitado de GitHub:

**https://github.com/ingjuanlopez4-hub/SegundaSmart/security/advisories/new**

La API `private-vulnerability-reporting` devolvió `enabled: true` después de
habilitarlo en este ciclo. No publiques vulnerabilidades sensibles en issues o PR.
No hay un plazo de respuesta garantizado ni otro contacto privado anunciado.

Incluye versión/SHA, pasos mínimos con datos sintéticos, impacto y evidencia
saneada. No adjuntes contraseñas, cookies, tokens, bases, respaldos ni datos de
clientes. El propietario recibe y gestiona el reporte privado.

Si se expone un secreto, indicar tipo y ubicación **sin copiar el valor** y
coordinar revocación/rotación con el propietario del proveedor. Borrarlo del último
commit no lo revoca ni elimina el historial. La limpieza del historial compartido
es una operación separada y coordinada, no una limpieza rutinaria.

Se valida el código actual de `main` mediante CI una vez integrado su workflow.
No se anuncia soporte para versiones históricas ni auditoría completa. El
escaneo de secretos y la protección de push ya estaban activos; cero alertas
visibles no demuestra ausencia de secretos en todo el historial.
