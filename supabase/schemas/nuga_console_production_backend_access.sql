-- Server-only Data API privileges. The custom schema must also be explicitly
-- added to the project's Data API exposed schemas before the adapter is enabled.
-- Browser roles remain denied and service_role receives no DELETE/TRUNCATE.

grant usage on schema nuga_console_production to service_role;

grant select, insert, update
  on nuga_console_production.agent_profiles,
     nuga_console_production.task_extensions,
     nuga_console_production.decisions,
     nuga_console_production.deliverables
  to service_role;

grant select, insert
  on nuga_console_production.audit_events
  to service_role;

revoke delete, truncate
  on all tables in schema nuga_console_production
  from service_role;

revoke all on schema nuga_console_production from public, anon, authenticated;
revoke all on all tables in schema nuga_console_production from public, anon, authenticated;
