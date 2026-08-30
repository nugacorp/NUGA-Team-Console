import { describe, expect, it } from 'vitest';
import {
  assertHermesOwnsOperationalTasks,
  DOMAIN_OWNERSHIP,
  getDomainAuthority,
  TASK_FIELD_OWNERSHIP
} from '../contracts/dataOwnership';

describe('Hybrid Hermes and NUGA Console data ownership', () => {
  it('keeps operational task state canonical in Hermes', () => {
    expect(assertHermesOwnsOperationalTasks()).toBe(true);
    expect(getDomainAuthority('tasks')).toBe('hermes');
    expect(getDomainAuthority('taskRuns')).toBe('hermes');
    expect(getDomainAuthority('taskComments')).toBe('hermes');
  });

  it('assigns console-only business domains to NUGA Console', () => {
    expect(getDomainAuthority('decisions')).toBe('nuga_console');
    expect(getDomainAuthority('consoleAudit')).toBe('nuga_console');
    expect(getDomainAuthority('campaigns')).toBe('nuga_console');
    expect(getDomainAuthority('incidents')).toBe('nuga_console');
    expect(getDomainAuthority('deliverables')).toBe('nuga_console');
  });

  it('forbids duplicate writes for every domain', () => {
    expect(Object.values(DOMAIN_OWNERSHIP).every(domain => domain.duplicateWritesAllowed === false)).toBe(true);
  });

  it('does not pretend that Hermes supplies console planning extensions', () => {
    expect(TASK_FIELD_OWNERSHIP.deadline.resolution).toBe('console_extension');
    expect(TASK_FIELD_OWNERSHIP.estimatedHours.resolution).toBe('console_extension');
    expect(TASK_FIELD_OWNERSHIP.deliverableIds.resolution).toBe('console_extension');
    expect(TASK_FIELD_OWNERSHIP.progressPercent.resolution).toBe('derived');
  });

  it('keeps RouterOS telemetry disconnected from this phase', () => {
    expect(DOMAIN_OWNERSHIP.routerTelemetry).toMatchObject({
      authority: 'external_adapter',
      integrationState: 'disconnected'
    });
  });
});
