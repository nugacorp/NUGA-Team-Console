import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const APPROVED_PROFILES = new Set([
  'director',
  'nugacore',
  'operaciones',
  'marketing',
  'administracion'
]);

export interface HermesBoardDto {
  slug: string;
  name: string;
  archived: boolean;
  current: boolean;
  total: number;
  counts: Record<string, number>;
}

export interface HermesTaskDto {
  id: string;
  board: string;
  title: string;
  body?: string;
  assignee?: string;
  status: string;
  priority: number;
  projectId?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  source: 'hermes';
}

export interface HermesTaskDetailDto {
  task: HermesTaskDto;
  parents: string[];
  children: string[];
  comments: Array<{ author: string; body: string; createdAt: number }>;
  runs: unknown[];
  latestSummary?: string;
}

export interface HermesReadOnlyConfig {
  binary: string;
  boards: string[];
  timeoutMs: number;
  maxTasks: number;
}

export type HermesCommandRunner = (
  binary: string,
  args: readonly string[],
  timeoutMs: number
) => Promise<string>;

const defaultRunner: HermesCommandRunner = async (binary, args, timeoutMs) => {
  const result = await execFileAsync(binary, [...args], {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: 'C.UTF-8'
    }
  });
  return result.stdout;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, maxLength = 10_000): string | undefined {
  return typeof value === 'string' ? value.slice(0, maxLength) : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sanitizeCounts(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, count]) => SAFE_ID.test(key) && Number.isInteger(count) && (count as number) >= 0)
      .map(([key, count]) => [key, count as number])
  );
}

function sanitizeTask(value: unknown, board: string): HermesTaskDto | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 128);
  const title = stringValue(value.title, 500);
  const status = stringValue(value.status, 40);
  const priority = numberValue(value.priority);
  const createdAt = numberValue(value.created_at);
  if (!id || !SAFE_ID.test(id) || !title || !status || priority === undefined || createdAt === undefined) return null;

  const assignee = stringValue(value.assignee, 64);
  return {
    id,
    board,
    title,
    ...(stringValue(value.body) ? { body: stringValue(value.body) } : {}),
    ...(assignee && APPROVED_PROFILES.has(assignee) ? { assignee } : {}),
    status,
    priority,
    ...(stringValue(value.project_id, 128) ? { projectId: stringValue(value.project_id, 128) } : {}),
    createdAt,
    ...(numberValue(value.started_at) !== undefined ? { startedAt: numberValue(value.started_at) } : {}),
    ...(numberValue(value.completed_at) !== undefined ? { completedAt: numberValue(value.completed_at) } : {}),
    source: 'hermes'
  };
}

export class HermesReadOnlyError extends Error {
  constructor(message: string, public readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE' | 'DENIED') {
    super(message);
    this.name = 'HermesReadOnlyError';
  }
}

export class HermesReadOnlyAdapter {
  constructor(
    private readonly config: HermesReadOnlyConfig,
    private readonly runner: HermesCommandRunner = defaultRunner
  ) {
    if (!config.boards.length || config.boards.some(board => !SAFE_ID.test(board))) {
      throw new HermesReadOnlyError('La lista permitida de tableros Hermes es inválida.', 'DENIED');
    }
  }

  private async json(args: readonly string[]): Promise<unknown> {
    const permitted = args[0] === 'kanban'
      && args.includes('--json')
      && !args.some(argument => ['create', 'assign', 'dispatch', 'complete', 'comment', 'edit', 'block'].includes(argument));
    if (!permitted) throw new HermesReadOnlyError('Comando Hermes no permitido por el adaptador.', 'DENIED');

    try {
      return JSON.parse(await this.runner(this.config.binary, args, this.config.timeoutMs));
    } catch (error) {
      if (error instanceof HermesReadOnlyError) throw error;
      if (error instanceof SyntaxError) throw new HermesReadOnlyError('Hermes devolvió JSON inválido.', 'INVALID_RESPONSE');
      throw new HermesReadOnlyError('Hermes no está disponible para lectura.', 'UNAVAILABLE');
    }
  }

  async listBoards(): Promise<HermesBoardDto[]> {
    const value = await this.json(['kanban', 'boards', 'list', '--json', '--all']);
    if (!Array.isArray(value)) throw new HermesReadOnlyError('Contrato de tableros inválido.', 'INVALID_RESPONSE');

    return value.flatMap(item => {
      if (!isRecord(item)) return [];
      const slug = stringValue(item.slug, 128);
      if (!slug || !this.config.boards.includes(slug)) return [];
      return [{
        slug,
        name: stringValue(item.name, 200) ?? slug,
        archived: item.archived === true,
        current: item.is_current === true,
        total: numberValue(item.total) ?? 0,
        counts: sanitizeCounts(item.counts)
      }];
    });
  }

  async listTasks(): Promise<HermesTaskDto[]> {
    const result: HermesTaskDto[] = [];
    for (const board of this.config.boards) {
      const value = await this.json(['kanban', '--board', board, 'list', '--json', '--archived']);
      if (!Array.isArray(value)) throw new HermesReadOnlyError('Contrato de tareas inválido.', 'INVALID_RESPONSE');
      for (const item of value) {
        const task = sanitizeTask(item, board);
        if (task) result.push(task);
        if (result.length >= this.config.maxTasks) return result;
      }
    }
    return result;
  }

  async getTask(board: string, taskId: string): Promise<HermesTaskDetailDto | null> {
    if (!this.config.boards.includes(board) || !SAFE_ID.test(taskId)) {
      throw new HermesReadOnlyError('Tablero o tarea fuera del alcance permitido.', 'DENIED');
    }
    const value = await this.json(['kanban', '--board', board, 'show', taskId, '--json']);
    if (!isRecord(value)) throw new HermesReadOnlyError('Contrato de detalle inválido.', 'INVALID_RESPONSE');
    const task = sanitizeTask(value.task, board);
    if (!task) return null;

    const ids = (input: unknown) => Array.isArray(input)
      ? input.flatMap(item => typeof item === 'string' && SAFE_ID.test(item) ? [item] : [])
      : [];
    const comments = Array.isArray(value.comments) ? value.comments.flatMap(item => {
      if (!isRecord(item)) return [];
      const author = stringValue(item.author, 100);
      const body = stringValue(item.body, 10_000);
      const createdAt = numberValue(item.created_at);
      return author && body && createdAt !== undefined ? [{ author, body, createdAt }] : [];
    }) : [];

    return {
      task,
      parents: ids(value.parents),
      children: ids(value.children),
      comments,
      runs: Array.isArray(value.runs) ? value.runs.slice(0, 100) : [],
      ...(stringValue(value.latest_summary, 10_000) ? { latestSummary: stringValue(value.latest_summary, 10_000) } : {})
    };
  }

  async getRuns(board: string, taskId: string): Promise<unknown[]> {
    if (!this.config.boards.includes(board) || !SAFE_ID.test(taskId)) {
      throw new HermesReadOnlyError('Tablero o tarea fuera del alcance permitido.', 'DENIED');
    }
    const value = await this.json(['kanban', '--board', board, 'runs', taskId, '--json']);
    if (!Array.isArray(value)) throw new HermesReadOnlyError('Contrato de runs inválido.', 'INVALID_RESPONSE');
    return value.slice(0, 100);
  }
}
