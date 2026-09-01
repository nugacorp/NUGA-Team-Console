import { describe, expect, it } from 'vitest';
import { Task, TaskStatus } from '../types';
import { countOpenTasks } from '../utils/taskMetrics';

function task(status: TaskStatus): Task {
  return { status } as Task;
}

describe('task metrics', () => {
  it('counts queued, active, review and blocked Hermes work as open', () => {
    const statuses: TaskStatus[] = [
      'triage', 'backlog', 'ready', 'in_progress', 'blocked', 'review'
    ];

    expect(countOpenTasks(statuses.map(task))).toBe(6);
  });

  it('excludes every final task status', () => {
    expect(countOpenTasks([
      task('completed'), task('done'), task('archived'), task('ready')
    ])).toBe(1);
  });

  it('is safe before provider data is available', () => {
    expect(countOpenTasks(undefined)).toBe(0);
    expect(countOpenTasks(null)).toBe(0);
  });
});
