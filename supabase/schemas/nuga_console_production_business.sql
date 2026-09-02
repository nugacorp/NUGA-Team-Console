-- Real business records for NUGA Team Console production.
-- Browser roles are denied; only the hardened backend may access these tables.

create table if not exists nuga_console_production.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 64),
  name text not null check (length(name) between 1 and 160),
  category text not null check (category in ('wisp','nugacore','marketing','admin')),
  objective text not null default '', owner text not null,
  team jsonb not null default '[]'::jsonb check (jsonb_typeof(team) = 'array'),
  status text not null check (status in ('active','planning','paused','completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  start_date date not null, target_end_date date not null,
  risks jsonb not null default '[]'::jsonb check (jsonb_typeof(risks) = 'array'),
  milestones jsonb not null default '[]'::jsonb check (jsonb_typeof(milestones) = 'array'),
  budget_estimate_usd numeric(14,2) not null default 0 check (budget_estimate_usd >= 0),
  summary_executive text not null default '', deliverables_count integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists nuga_console_production.campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 64),
  name text not null check (length(name) between 1 and 160),
  objective text not null, target_audience text not null, value_proposition text not null default '',
  channels jsonb not null default '[]'::jsonb check (jsonb_typeof(channels) = 'array'),
  budget_usd numeric(14,2) not null default 0 check (budget_usd >= 0),
  spent_budget_usd numeric(14,2) not null default 0 check (spent_budget_usd >= 0),
  schedule_date_range text not null,
  status text not null check (status in ('draft','in_creative','awaiting_approval','active','completed')),
  creative_stage text not null, variants_count integer not null default 0,
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object'),
  requires_approval boolean not null default true,
  assigned_agent text not null check (assigned_agent in ('director','nugacore','operaciones','marketing','administracion')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists nuga_console_production.admin_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 240),
  category text not null check (category in ('acuerdo','minuta','cotizacion','pago_reportado','documento','pendiente')),
  responsible text not null, agent_assigned text,
  deadline date not null,
  status text not null check (status in ('pending','in_progress','completed','overdue')),
  priority text, amount_usd numeric(14,2), evidence_ref text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists nuga_console_production.workflow_plans (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in ('project','campaign','admin_item')),
  resource_id uuid not null,
  resource_title text not null check (length(resource_title) between 1 and 240),
  status text not null default 'draft' check (status in ('draft','needs_info','pending_approval','approved','rejected')),
  recommended_agent text not null check (recommended_agent in ('director','nugacore','operaciones','marketing','administracion')),
  objective_summary text not null check (length(objective_summary) between 1 and 2000),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  proposed_tasks jsonb not null default '[]'::jsonb check (jsonb_typeof(proposed_tasks) = 'array'),
  risks jsonb not null default '[]'::jsonb check (jsonb_typeof(risks) = 'array'),
  approval_note text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resource_type, resource_id)
);

alter table nuga_console_production.projects enable row level security;
alter table nuga_console_production.projects force row level security;
alter table nuga_console_production.campaigns enable row level security;
alter table nuga_console_production.campaigns force row level security;
alter table nuga_console_production.admin_items enable row level security;
alter table nuga_console_production.admin_items force row level security;
alter table nuga_console_production.workflow_plans enable row level security;
alter table nuga_console_production.workflow_plans force row level security;

grant select, insert, update on nuga_console_production.projects,
  nuga_console_production.campaigns, nuga_console_production.admin_items to service_role;
grant select, insert, update on nuga_console_production.workflow_plans to service_role;
revoke all on nuga_console_production.projects,
  nuga_console_production.campaigns, nuga_console_production.admin_items from public, anon, authenticated;
revoke all on nuga_console_production.workflow_plans from public, anon, authenticated;
revoke delete, truncate on nuga_console_production.projects,
  nuga_console_production.campaigns, nuga_console_production.admin_items from service_role;
revoke delete, truncate on nuga_console_production.workflow_plans from service_role;

create or replace function nuga_console_production.audit_business_insert()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into nuga_console_production.audit_events
    (actor, action, resource_type, resource_id, outcome, risk, correlation_id, details)
  values
    ('owner:ramiro', 'created', TG_TABLE_NAME, NEW.id::text, 'success', 'low',
     gen_random_uuid()::text, jsonb_build_object('code', to_jsonb(NEW)->>'code', 'title', coalesce(to_jsonb(NEW)->>'name', to_jsonb(NEW)->>'title')));
  return NEW;
end;
$$;
revoke all on function nuga_console_production.audit_business_insert() from public, anon, authenticated;

drop trigger if exists projects_audit_insert on nuga_console_production.projects;
create trigger projects_audit_insert after insert on nuga_console_production.projects
for each row execute function nuga_console_production.audit_business_insert();
drop trigger if exists campaigns_audit_insert on nuga_console_production.campaigns;
create trigger campaigns_audit_insert after insert on nuga_console_production.campaigns
for each row execute function nuga_console_production.audit_business_insert();
drop trigger if exists admin_items_audit_insert on nuga_console_production.admin_items;
create trigger admin_items_audit_insert after insert on nuga_console_production.admin_items
for each row execute function nuga_console_production.audit_business_insert();

notify pgrst, 'reload schema';
