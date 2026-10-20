# Agentes de desarrollo de SegundaSmart

Agentes de proyecto para OpenCode. Se descubren automáticamente desde `.opencode/agents/`; no es necesario modificar la configuración global ni fijar un proveedor o modelo. Heredan el modelo de la sesión según la configuración de OpenCode.

## Equipo

| Agente | Modo | Responsabilidad |
| --- | --- | --- |
| `ss-coordinador` | Principal | Elegir incrementos del MVP, repartir tareas, integrar y cerrar con evidencia. |
| `ss-backend` | Subagente | APIs, sesiones, Prisma, aislamiento, transacciones, fotografías, QR e IA. |
| `ss-frontend` | Subagente | Flujos mobile first, validación, accesibilidad, estados y recuperación. |
| `ss-calidad` | Subagente | Regresiones, SQLite real, comprobaciones del proyecto y flujos móviles. |
| `ss-revisor` | Subagente de solo lectura | Revisión independiente de integridad, aislamiento y regresiones. |

Todos deben consultar `AGENTS.md` y la documentación del módulo antes de trabajar. El alcance sigue siendo el MVP documentado en `PRODUCT.md`; crear agentes no amplía el producto.

## Activación y uso

**Cierra y reinicia OpenCode** después de crear o modificar estos archivos: la sesión actual mantiene las definiciones cargadas al iniciar.

Desde la raíz del repositorio, comprueba el descubrimiento:

```bash
opencode agent list
```

Puedes inspeccionar la definición cargada de un agente sin plugins externos:

```bash
opencode debug agent ss-coordinador --pure
```

Las cinco definiciones se verificaron con `opencode debug agent <nombre> --pure`, incluidos sus modos y la denegación de edición/escritura del revisor. La carga normal del CLI excedió el tiempo de espera en este entorno; si ocurre al reiniciar, puedes iniciar la sesión con `opencode --pure --agent ss-coordinador` para trabajar sin plugins externos.

Inicia una sesión con el coordinador:

```bash
opencode --agent ss-coordinador
```

Ejemplo de petición:

> Continúa desarrollando SegundaSmart dentro del MVP. Selecciona un problema reproducible, coordina a los especialistas necesarios y entrega el cambio con pruebas, verificación móvil y documentación.

También puedes mencionar directamente a un especialista en una sesión:

```text
@ss-backend Revisa el contrato de ventas y corrige el fallo descrito con pruebas de integración.
@ss-frontend Corrige el formulario de alta conservando las ediciones cuando falla la sugerencia.
@ss-calidad Verifica el diff actual y el flujo de venta en dos pestañas con una base de prueba.
@ss-revisor Revisa el diff actual buscando fugas entre negocios y regresiones de doble venta.
```

## Protocolo de colaboración

1. El coordinador delimita objetivo, criterios de aceptación y archivos antes de delegar.
2. Los especialistas trabajan en archivos acordados. No se asignan escrituras simultáneas sobre el mismo archivo.
3. Contratos compartidos, migraciones y documentación general tienen un responsable único.
4. Calidad o el coordinador ejecuta secuencialmente `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Dos ejecuciones de `npm test` no deben competir por la base que reinician.
5. Se verifica el flujo afectado en navegador móvil y se informa cualquier bloqueo con precisión.
6. El revisor entrega hallazgos sin editar. El coordinador integra correcciones y confirma el resultado final.

Los agentes no hacen commits, push ni despliegues sin una petición explícita para esas operaciones. Los resultados simulados no se presentan como integraciones reales y no se registran secretos en archivos, logs o capturas.
