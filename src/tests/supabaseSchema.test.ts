import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(process.cwd(), 'supabase/schemas/nuga_console.sql'), 'utf8');
const backendAccess = readFileSync(
  resolve(process.cwd(), 'supabase/schemas/nuga_console_backend_access.sql'),
  'utf8'
);
const productionSchema = readFileSync(
  resolve(process.cwd(), 'supabase/schemas/nuga_console_production.sql'),
  'utf8'
);
const productionBackendAccess = readFileSync(
  resolve(process.cwd(), 'supabase/schemas/nuga_console_production_backend_access.sql'),
  'utf8'
);

const tables = ['task_extensions', 'decisions', 'deliverables', 'audit_events'] as const;

describe('Supabase console-owned schema baseline', () => {
  it('defines a separate fail-closed production schema', () => {
    for (const table of tables) {
      expect(productionSchema).toContain(`create table nuga_console_production.${table}`);
      expect(productionSchema).toContain(
        `alter table nuga_console_production.${table} force row level security`
      );
    }
    expect(productionSchema).toContain(
      'revoke all on schema nuga_console_production from public, anon, authenticated'
    );
    expect(productionBackendAccess).toContain('revoke delete, truncate');
    expect(productionBackendAccess).toContain('from service_role');
  });
  it('keeps all console tables in the private nuga_console schema', () => {
    for (const table of tables) {
      expect(schema).toContain(`create table nuga_console.${table}`);
      expect(schema).not.toContain(`create table public.${table}`);
    }
  });

  it('enables and forces RLS on every table', () => {
    for (const table of tables) {
      expect(schema).toContain(`alter table nuga_console.${table} enable row level security`);
      expect(schema).toContain(`alter table nuga_console.${table} force row level security`);
    }
  });

  it('denies browser roles and defines no permissive policy', () => {
    expect(schema).toContain('revoke all on schema nuga_console from public, anon, authenticated');
    expect(schema).toContain('revoke all on all tables in schema nuga_console from public, anon, authenticated');
    expect(schema).not.toMatch(/create\s+policy/i);
    expect(schema).not.toMatch(/grant\s+.+\s+to\s+(anon|authenticated)/i);
  });

  it('does not introduce secrets, browser configuration, or privileged functions', () => {
    expect(schema).not.toMatch(/service_role|VITE_|security\s+definer|password|confirmation_(token|phrase)/i);
  });

  it('links extensions to Hermes identifiers without duplicating Hermes tasks', () => {
    expect(schema).toContain('unique (hermes_board_slug, hermes_task_id)');
    expect(schema).not.toMatch(/create table nuga_console\.(tasks|boards|comments|runs)\b/i);
  });

  it('grants the backend no destructive access and keeps browser roles denied', () => {
    expect(backendAccess).toContain('grant select, insert\n  on nuga_console.audit_events');
    expect(backendAccess).toContain('revoke delete, truncate');
    expect(backendAccess).toContain('from service_role');
    expect(backendAccess).not.toMatch(/grant\s+.+\s+to\s+(anon|authenticated)/i);
  });
});
