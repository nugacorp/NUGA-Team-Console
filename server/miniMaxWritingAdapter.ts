import { spawn } from 'node:child_process';
import { join } from 'node:path';
export type WritingContext = 'project_objective' | 'campaign_objective' | 'admin_notes';
export interface WritingSuggestionRequest { context: WritingContext; draft: string; title?: string; category?: string; }
export interface WorkflowAnalysisRequest { operation: 'workflow_analysis'; resourceType: 'project' | 'campaign' | 'admin_item'; title: string; objective: string; category?: string; }
export interface WorkflowAnalysis { recommendedAgent: 'director' | 'nugacore' | 'operaciones' | 'marketing' | 'administracion'; objectiveSummary: string; questions: Array<{ id: string; question: string; required: boolean }>; proposedTasks: Array<{ id: string; title: string; description: string; assignedAgent: 'director' | 'nugacore' | 'operaciones' | 'marketing' | 'administracion'; requiresApproval: boolean }>; risks: string[]; }
export interface MiniMaxWritingAdapterOptions { pythonBinary: string; hermesSourceDirectory: string; model: string; timeoutMs: number; bridgeScript?: string; }
export class MiniMaxWritingError extends Error { constructor(public readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE', message: string) { super(message); this.name = 'MiniMaxWritingError'; } }
type Bridge = (input: WritingSuggestionRequest) => Promise<unknown>;
function cleanSuggestion(value: string): string { return value.trim().replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^```(?:text)?\s*/i, '').replace(/```\s*$/i, '').trim().slice(0, 1_500); }
export class MiniMaxWritingAdapter {
  constructor(private readonly options: MiniMaxWritingAdapterOptions, private readonly bridge?: Bridge) {}
  private invoke(input: WritingSuggestionRequest | WorkflowAnalysisRequest): Promise<unknown> {
    if (this.bridge) return this.bridge(input as WritingSuggestionRequest);
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.pythonBinary, [this.options.bridgeScript ?? join(process.cwd(), 'server/hermesMiniMaxBridge.py')], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONPATH: this.options.hermesSourceDirectory, NUGA_MINIMAX_MODEL: this.options.model } });
      let stdout = ''; let settled = false;
      const finish = (error?: Error, value?: unknown) => { if (settled) return; settled = true; clearTimeout(timer); if (error) reject(error); else resolve(value); };
      const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new MiniMaxWritingError('UNAVAILABLE', 'MiniMax agotó el tiempo de espera.')); }, this.options.timeoutMs);
      child.stdout.on('data', chunk => { if (stdout.length < 65_536) stdout += chunk; });
      child.on('error', () => finish(new MiniMaxWritingError('UNAVAILABLE', 'No se pudo iniciar el puente OAuth.')));
      child.on('close', code => { if (code !== 0) return finish(new MiniMaxWritingError('UNAVAILABLE', 'MiniMax OAuth no está disponible.')); try { const parsed = JSON.parse(stdout) as { suggestion?: unknown; analysis?: unknown }; finish(undefined, parsed.analysis ?? parsed.suggestion ?? ''); } catch { finish(new MiniMaxWritingError('INVALID_RESPONSE', 'El puente OAuth devolvió una respuesta inválida.')); } });
      child.stdin.end(JSON.stringify(input));
    });
  }
  async improve(input: WritingSuggestionRequest): Promise<string> { const suggestion = cleanSuggestion(String(await this.invoke(input))); if (suggestion.length < 3) throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax devolvió una sugerencia vacía.'); return suggestion; }
  async analyzeWorkflow(input: Omit<WorkflowAnalysisRequest, 'operation'>): Promise<WorkflowAnalysis> {
    const value = await this.invoke({ operation: 'workflow_analysis', ...input });
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax devolvió un plan inválido.');
    const plan = value as WorkflowAnalysis;
    const agents = ['director','nugacore','operaciones','marketing','administracion'];
    if (!agents.includes(plan.recommendedAgent) || typeof plan.objectiveSummary !== 'string' || !Array.isArray(plan.questions) || !Array.isArray(plan.proposedTasks) || !Array.isArray(plan.risks)) throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax devolvió un plan incompleto.');
    if (plan.questions.length > 8 || plan.proposedTasks.length > 12 || plan.risks.length > 8) throw new MiniMaxWritingError('INVALID_RESPONSE', 'MiniMax excedió los límites del plan.');
    return plan;
  }
}
