# Controles de GitHub

## Aplicado y leído de vuelta por API

Repositorio público `ingjuanlopez4-hub/SegundaSmart`; acceso ADMIN y un solo
colaborador verificados. Estos controles se aplicaron usando el acceso existente
y sin activar funciones de pago. No se hizo merge ni despliegue manual.

Después de que `quality-checks` pasara en el HEAD final del PR #3
(`12b946ee301efe156766364770fcac5333256d2a`, ejecución `39905585747`), se aplicó
`main-protection.json` y se volvió a consultar el endpoint de protección:

| Control | Estado remoto observado |
| --- | --- |
| PR obligatorio | Activo, también para administradores |
| Check requerido | `quality-checks`, proveedor GitHub Actions (app ID `15368` comprobado en check-runs) |
| Rama actualizada | `strict: true` |
| Resolución de conversaciones | Obligatoria |
| Force push / borrado de main | Ambos deshabilitados |
| Aprobaciones externas | 0; solo hay un colaborador, no hay aprobación independiente disponible |
| Squash | Ya permitido; preferencia documentada, otros métodos existentes conservados |
| Merge queue | Sin configurar; no se requiere `merge_group` actualmente |
| Secret scanning / push protection | Ya habilitados; cero alertas visibles, no auditoría completa |
| Reporte privado de vulnerabilidades | Habilitado y comprobado: `enabled: true` |

El workflow aún se propone en un PR borrador. Debe integrarse #3 antes de abrir
otros cambios independientes basados en `main`: hasta entonces `main` no contiene
el workflow que informa el check requerido. El PR de documentación se apoya
explícitamente en la rama CI para evitar ese vacío. No se configuró aprobación
imposible ni un check omitido por filtros de rutas.

## Consultar estado real

```bash
gh api repos/ingjuanlopez4-hub/SegundaSmart/branches/main/protection
gh api repos/ingjuanlopez4-hub/SegundaSmart/private-vulnerability-reporting
gh api repos/ingjuanlopez4-hub/SegundaSmart/rulesets
gh pr checks 3
```

`main-protection.json` registra el payload aplicado, no es automatización. No
reaplicarlo sin volver a inspeccionar reglas existentes: PUT reemplaza esa
configuración y podría sobrescribir ajustes posteriores. Mantener cambios remotos
coordinados y registrados. No borrar protecciones como recuperación rutinaria.

Dependabot para GitHub Actions queda **preparado en archivo**; empezará a operar
cuando el archivo alcance la rama predeterminada. Revisar sus PR y SHA completos
como cualquier cambio. No se actualizaron dependencias de la aplicación.

Referencias oficiales:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/pull-requests/reference/status-checks
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/actions/reference/security/secure-use
