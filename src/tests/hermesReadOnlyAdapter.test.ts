import { describe, expect, it, vi } from 'vitest';
import {
  HermesCommandRunner,
  HermesReadOnlyAdapter,
  HermesReadOnlyError
} from '../../server/hermesReadOnlyAdapter';

function adapterWith(runner: HermesCommandRunner) {
  return new HermesReadOnlyAdapter({
    binary: '/home/ramiro/.local/bin/hermes',
    boards: ['default', 'nuga-team-lab', 'wisp-lab'],
    timeoutMs: 1000,
    maxTasks: 100
  }, runner);
}

describe('Hermes read-only JSON adapter', () => {
  it('uses only allowlisted JSON list commands across explicit boards', async () => {
    const runner = vi.fn<HermesCommandRunner>(async (_binary, args) => {
      const board = args[2];
      return JSON.stringify([{
        id: `task-${board}`,
        title: `Task ${board}`,
        body: null,
        assignee: board === 'wisp-lab' ? 'operaciones' : null,
        status: 'ready',
        priority: 1,
        project_id: null,
        created_at: 123,
        started_at: null,
        completed_at: null
      }]);
    });

    const tasks = await adapterWith(runner).listTasks();

    expect(tasks).toHaveLength(3);
    expect(tasks.every(task => task.source === 'hermes')).toBe(true);
    expect(runner).toHaveBeenCalledTimes(3);
    for (const call of runner.mock.calls) {
      expect(call[1]).toContain('--json');
      expect(call[1]).not.toEqual(expect.arrayContaining(['create', 'assign', 'dispatch', 'complete', 'comment']));
    }
  });

  it('drops unapproved assignees instead of inventing a NUGA profile', async () => {
    const runner: HermesCommandRunner = async () => JSON.stringify([{
      id: 'task-1',
      title: 'Safe task',
      assignee: 'unknown-agent',
      status: 'todo',
      priority: 2,
      created_at: 456
    }]);

    const [task] = await adapterWith(runner).listTasks();
    expect(task.assignee).toBeUndefined();
  });

  it('denies boards and task ids outside the configured scope before execution', async () => {
    const runner = vi.fn<HermesCommandRunner>();
    const adapter = adapterWith(runner);

    await expect(adapter.getTask('production', 'task-1')).rejects.toMatchObject({ code: 'DENIED' });
    await expect(adapter.getRuns('wisp-lab', '../secret')).rejects.toBeInstanceOf(HermesReadOnlyError);
    expect(runner).not.toHaveBeenCalled();
  });

  it('fails closed on malformed JSON without returning fixtures', async () => {
    const adapter = adapterWith(async () => 'not-json');
    await expect(adapter.listBoards()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('sanitizes comments and events in task detail without using write commands', async () => {
    const runner = vi.fn<HermesCommandRunner>(async () => JSON.stringify({
      task: { id: 'task-1', title: 'Detail', status: 'ready', priority: 1, created_at: 123 },
      parents: [], children: [], runs: [], latest_summary: 'Safe summary',
      comments: [{ author: 'ramiro', body: 'Read only', created_at: 124 }],
      events: [{ kind: 'created', created_at: 123, run_id: null }]
    }));

    const detail = await adapterWith(runner).getTask('nuga-team-lab', 'task-1');

    expect(detail).toMatchObject({
      latestSummary: 'Safe summary',
      comments: [{ author: 'ramiro', body: 'Read only', createdAt: 124 }],
      events: [{ kind: 'created', createdAt: 123 }]
    });
    expect(runner.mock.calls[0][1]).toEqual([
      'kanban', '--board', 'nuga-team-lab', 'show', 'task-1', '--json'
    ]);
  });
});
