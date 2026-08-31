-- Server-only Data API privileges. The custom schema must also be explicitly
-- added to the project's Data API exposed schemas before the adapter is enabled.
-- Browser roles remain denied and service_role receives no DELETE/TRUNCATE.

grant usage on schema nuga_console to service_role;

grant select, insert, update
  on nuga_console.task_extensions,
     nuga_console.decisions,
     nuga_console.deliverables
  to service_role;

grant select, insert
  on nuga_console.audit_events
  to service_role;

revoke delete, truncate
  on all tables in schema nuga_console
  from service_role;

revoke all on schema nuga_console from public, anon, authenticated;
revoke all on all tables in schema nuga_console from public, anon, authenticated;
