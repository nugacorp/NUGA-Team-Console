import { describe, expect, it } from 'vitest';
import { MiniMaxWritingAdapter, MiniMaxWritingError } from '../../server/miniMaxWritingAdapter';
const options = { pythonBinary: '/usr/bin/python3', hermesSourceDirectory: '/hermes', model: 'MiniMax-M3', timeoutMs: 1_000 };
describe('MiniMaxWritingAdapter', () => {
  it('returns sanitized text from the OAuth bridge', async () => {
    const adapter = new MiniMaxWritingAdapter(options, async input => {
      expect(input.draft).toBe('mejorar cobertura en lomas');
      return 'Mejorar la cobertura en Lomas mediante acciones verificables.\n```  ';
    });
    await expect(adapter.improve({ context: 'project_objective', draft: 'mejorar cobertura en lomas' })).resolves.toBe('Mejorar la cobertura en Lomas mediante acciones verificables.');
  });
  it('fails closed on empty bridge output', async () => {
    const adapter = new MiniMaxWritingAdapter(options, async () => '');
    await expect(adapter.improve({ context: 'admin_notes', draft: 'registrar acuerdo real' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' } satisfies Partial<MiniMaxWritingError>);
  });
  it('validates a bounded workflow plan without executing it', async () => {
    const adapter = new MiniMaxWritingAdapter(options, async () => ({
      recommendedAgent: 'marketing',
      objectiveSummary: 'Preparar una campaña para revisión humana.',
      questions: [{ id: 'budget', question: '¿Cuál es el presupuesto aprobado?', required: true }],
      proposedTasks: [{ id: 'brief', title: 'Preparar brief', description: 'Redactar una propuesta verificable.', assignedAgent: 'marketing', requiresApproval: false }],
      risks: ['Falta confirmar el presupuesto.']
    }));
    await expect(adapter.analyzeWorkflow({ resourceType: 'campaign', title: 'Campaña', objective: 'Preparar una campaña real.' })).resolves.toMatchObject({ recommendedAgent: 'marketing' });
  });
});
