# Matriz de propiedad de datos

**Estado:** contrato aprobado para diseño; Supabase y Hermes permanecen desconectados.

NUGA Team Console combina dominios distintos. Hermes no debe convertirse en una
base empresarial general y la base de la consola no debe duplicar el Kanban. Cada
registro tiene una sola autoridad canónica.

## Reglas invariantes

1. Las tareas, comentarios y ejecuciones operativas pertenecen a Hermes.
2. Supabase no almacenará copias editables de tareas Hermes.
3. Las decisiones, auditoría, campañas, incidentes, entregables, notificaciones y
   administración pertenecen a NUGA Console.
4. Una entidad de la consola puede referenciar un id Hermes, pero no reemplazarlo.
5. Los valores derivados se recalculan y se etiquetan; nunca se presentan como
   campos nativos de Hermes.
6. Los campos ausentes se reportan como no disponibles. No se fabrican valores.
7. DEMO continúa usando fixtures locales y cero llamadas de red.

## Autoridad por dominio

| Dominio | Autoridad | Persistencia prevista | Estado |
|---|---|---|---|
| Perfiles | Hermes | Perfiles locales | Adaptador pendiente |
| Tableros | Hermes | Kanban SQLite, consultado por CLI JSON | Adaptador pendiente |
| Tareas | Hermes | Kanban | Adaptador pendiente |
| Comentarios y runs | Hermes | Kanban | Adaptador pendiente |
| Proyectos de negocio | NUGA Console | Supabase propuesto | Esquema pendiente |
| Decisiones/aprobaciones | NUGA Console | Supabase propuesto | Esquema pendiente |
| Entregables | NUGA Console | Supabase; referencia Hermes opcional | Esquema pendiente |
| Incidentes WISP | NUGA Console | Supabase propuesto | MikroMCP desconectado |
| Campañas y medios | NUGA Console | Supabase/Storage futuros | Desconectado |
| Administración | NUGA Console | Supabase propuesto | Esquema pendiente |
| Notificaciones | NUGA Console | Supabase/Realtime futuro | Desconectado |
| Auditoría de consola | NUGA Console | Tabla append-only | Esquema pendiente |
| Métricas | Derivadas | No son una fuente canónica | Agregador pendiente |
| Telemetría RouterOS | Adaptador externo | Sistema original | Prohibida en esta fase |

## Cobertura del contrato visual de tareas

### Campos directos o mapeados desde Hermes

`id`, `code`, `title`, `description`, `projectId`, `assignedAgent`, `priority`,
`status`, `dependencies`, `attachments`, `comments`, `runs` y `createdAt`.

### Campos derivados por NUGA Console API

- `updatedAt`: último evento seguro.
- `progressPercent`: regla determinista basada en el estado.
- `loggedHours`: suma de duración de runs disponibles.
- `requiresHumanApproval`: estado review o decisión vinculada.

### Extensiones propias de NUGA Console

- `deadline`;
- `estimatedHours`;
- `plan`;
- referencias `deliverableIds`.

Estas extensiones se enlazan mediante `hermes_task_id`. No se escriben en Kanban
y no pueden cambiar el estado operativo de una tarea.

## Uso propuesto de Supabase

Supabase es necesario como persistencia de los dominios propios de la consola,
pero todavía no está creado ni conectado. Antes de provisionarlo se requiere una
migración revisada, RLS en toda tabla expuesta y pruebas negativas.

- La autenticación local de Ramiro se conserva inicialmente.
- El navegador nunca recibe `service_role`, secretos o conexión PostgreSQL.
- No se guardan credenciales MiniMax, prompts completos ni tokens Hermes.
- Las tablas internas deben mantenerse fuera del Data API cuando sea posible.
- Las referencias Hermes son identificadores externos, no copias editables.

## Política de respuesta incompleta

El adaptador debe devolver procedencia y disponibilidad. Si un campo no puede
resolverse, lo omite o lo marca como no disponible según el contrato del endpoint.
Nunca usa fixtures DEMO como fallback en staging o production.
