# Esquema Supabase de NUGA Console

**Estado:** diseño declarativo aprobado para revisión; no aplicado a una base remota.

El archivo `supabase/schemas/nuga_console.sql` define la persistencia mínima de
los datos que pertenecen a NUGA Console. No duplica tableros, tareas,
comentarios ni ejecuciones de Hermes.

## Tablas iniciales

| Tabla | Propósito | Autoridad |
|---|---|---|
| `task_extensions` | Fecha límite, estimación y plan vinculados por board/task | NUGA Console |
| `decisions` | Aprobaciones y trazabilidad sin frases ni tokens de confirmación | NUGA Console |
| `deliverables` | Metadatos de entregables y referencia Hermes opcional | NUGA Console |
| `audit_events` | Eventos de auditoría append-only desde la API | NUGA Console |

Hermes conserva la autoridad sobre `board`, `task`, `comment` y `run`. Las
columnas `hermes_board_slug` y `hermes_task_id` son referencias externas; no son
claves foráneas ni copias editables del Kanban.

## Seguridad inicial

- El esquema `nuga_console` no es `public` y no debe añadirse a los esquemas
  expuestos del Data API.
- `PUBLIC`, `anon` y `authenticated` no reciben permisos.
- Todas las tablas tienen RLS habilitado y forzado como defensa adicional.
- No existen políticas permisivas en esta fase: el acceso falla de forma cerrada.
- El navegador no usa Supabase ni recibe `service_role`, claves secretas o una
  cadena PostgreSQL.
- La autenticación local y la sesión HttpOnly actuales siguen siendo la frontera
  de acceso. Solo NUGA Console API podrá obtener permisos mínimos posteriormente.
- No se almacenan frases de confirmación, contraseñas, tokens Hermes/MiniMax ni
  prompts completos. `confirmation_verified*` solo guarda el resultado de la
  verificación y su trazabilidad.

## Flujo de activación futuro

1. Crear un proyecto gratuito exclusivo de **staging**, previa confirmación del
   propietario y de la región.
2. Instalar la CLI oficial y ejecutar `supabase init` en una rama limpia.
3. Generar la migración desde el esquema declarativo con `supabase db diff`.
4. Revisar el SQL generado; no aplicar datos semilla ni secretos.
5. Aplicar la migración al proyecto staging y ejecutar asesores de seguridad y
   rendimiento.
6. Verificar mediante consultas que las cuatro tablas existen, RLS está activo y
   `anon`/`authenticated` no pueden acceder.
7. Crear en otra migración un rol de backend de privilegio mínimo. Hasta entonces
   NUGA Console API continúa respondiendo sin persistencia Supabase.

Production, Realtime, Storage y Supabase Auth permanecen fuera de alcance.

## Adaptador de backend

NUGA Console API usa el Data API únicamente desde el servidor y envía una clave
moderna `sb_secret_` en el encabezado `apikey`; no usa `Authorization: Bearer`
porque las claves modernas no son JWT. La integración permanece deshabilitada
salvo que existan simultáneamente `NUGA_SUPABASE_ENABLED=true`, una URL HTTPS y
la clave privada en el entorno del servicio.

`nuga_console_backend_access.sql` concede a `service_role` lectura, inserción y
actualización sobre extensiones, decisiones y entregables. Auditoría permite
solamente lectura e inserción. Ninguna tabla concede `DELETE` o `TRUNCATE`, y los
roles `anon` y `authenticated` continúan sin permisos.

Antes de habilitar el adaptador, `nuga_console` debe agregarse manualmente a
**Project Settings > Data API > Exposed schemas**. Exponer el esquema no concede
permisos por sí mismo; los GRANT y RLS continúan aplicando. No se modifica
`pgrst.db_schemas` mediante SQL para conservar la configuración administrada por
el Dashboard.
