-- NUGA Console production-owned data only. Hermes remains canonical for boards, tasks,
-- comments, and runs. This schema is intentionally private and inaccessible
-- to browser roles until a separate backend authorization migration exists.

create schema if not exists nuga_console_production;

revoke all on schema nuga_console_production from public, anon, authenticated;

create table nuga_console_production.task_extensions (
  id uuid primary key default gen_random_uuid(),
  hermes_board_slug text not null check (hermes_board_slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  hermes_task_id text not null check (length(hermes_task_id) between 1 and 128),
  deadline timestamptz,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  plan jsonb not null default '[]'::jsonb check (jsonb_typeof(plan) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hermes_board_slug, hermes_task_id)
);

create table nuga_console_production.decisions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 64),
  title text not null check (length(title) between 1 and 240),
  specialist text not null check (specialist in ('director', 'nugacore', 'operaciones', 'marketing', 'administracion')),
  project_id text,
  hermes_board_slug text,
  hermes_task_id text,
  priority text not null check (priority in ('baja', 'media', 'alta', 'urgente')),
  risk text not null check (risk in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('pending', 'approved', 'rejected', 'needs_info', 'postponed')),
  impact text not null default '',
  risk_of_action text not null default '',
  risk_of_inaction text not null default '',
  situation text not null default '',
  evidence text not null default '',
  proposal text not null default '',
  exact_change_diff text not null default '',
  expected_validation text not null default '',
  rollback_plan text not null default '',
  affected_scope text not null default '',
  recommendation text not null default '',
  deadline timestamptz,
  rejection_reason text,
  confirmation_verified boolean not null default false,
  confirmation_verified_at timestamptz,
  confirmation_verified_by text,
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((hermes_board_slug is null) = (hermes_task_id is null)),
  check (
    (confirmation_verified = false and confirmation_verified_at is null and confirmation_verified_by is null)
    or
    (confirmation_verified = true and confirmation_verified_at is not null and confirmation_verified_by is not null)
  )
);

create table nuga_console_production.deliverables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 64),
  title text not null check (length(title) between 1 and 240),
  kind text not null check (kind in ('markdown', 'pdf', 'image', 'video', 'json', 'report', 'checklist', 'tech_evidence')),
  project_id text not null,
  agent_id text not null check (agent_id in ('director', 'nugacore', 'operaciones', 'marketing', 'administracion')),
  hermes_board_slug text,
  hermes_task_id text,
  status text not null check (status in ('draft', 'ready_for_review', 'approved', 'rejected')),
  version text not null default '1',
  executive_summary text not null default '',
  storage_path text,
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((hermes_board_slug is null) = (hermes_task_id is null))
);

create table nuga_console_production.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor text not null check (length(actor) between 1 and 160),
  action text not null check (length(action) between 1 and 160),
  resource_type text not null check (length(resource_type) between 1 and 80),
  resource_id text,
  outcome text not null check (outcome in ('success', 'denied', 'failed')),
  risk text not null check (risk in ('low', 'medium', 'high', 'critical')),
  correlation_id text not null check (length(correlation_id) between 1 and 128),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object')
);

create index task_extensions_deadline_idx on nuga_console_production.task_extensions (deadline) where deadline is not null;
create index decisions_status_deadline_idx on nuga_console_production.decisions (status, deadline);
create index decisions_hermes_task_idx on nuga_console_production.decisions (hermes_board_slug, hermes_task_id) where hermes_task_id is not null;
create index deliverables_hermes_task_idx on nuga_console_production.deliverables (hermes_board_slug, hermes_task_id) where hermes_task_id is not null;
create index audit_events_occurred_at_idx on nuga_console_production.audit_events (occurred_at desc);
create index audit_events_correlation_id_idx on nuga_console_production.audit_events (correlation_id);

alter table nuga_console_production.task_extensions enable row level security;
alter table nuga_console_production.task_extensions force row level security;
alter table nuga_console_production.decisions enable row level security;
alter table nuga_console_production.decisions force row level security;
alter table nuga_console_production.deliverables enable row level security;
alter table nuga_console_production.deliverables force row level security;
alter table nuga_console_production.audit_events enable row level security;
alter table nuga_console_production.audit_events force row level security;

revoke all on all tables in schema nuga_console_production from public, anon, authenticated;
revoke all on all sequences in schema nuga_console_production from public, anon, authenticated;

-- No policies are created in this baseline. Access is fail-closed until the
-- backend database role and its least-privilege policies are reviewed.
