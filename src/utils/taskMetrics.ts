import { Task } from '../types';

const FINAL_TASK_STATUSES = new Set<Task['status']>(['completed', 'done', 'archived']);

/** Work that still requires attention, including queued, ready and blocked tasks. */
export function countOpenTasks(tasks: readonly Task[] | null | undefined): number {
  return (tasks ?? []).filter(task => !FINAL_TASK_STATUSES.has(task.status)).length;
}
