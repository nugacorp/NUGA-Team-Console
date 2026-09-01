import { describe, expect, it } from 'vitest';
import { Deliverable } from '../types';
import { getDeliverableExportIssues } from '../utils/deliverableExportReadiness';

const deliverable = (overrides: Partial<Deliverable> = {}): Deliverable => ({
  id: 'deliverable-1',
  code: 'DEL-REAL-001',
  title: 'Auditoría técnica',
  type: 'report',
  projectId: 'nuga-team-lab',
  agentId: 'operaciones',
  createdAt: '2026-09-01T12:00:00.000Z',
  fileSize: 'No disponible',
  simulatedSha256: '',
  status: 'ready_for_review',
  version: '1.0',
  executiveSummary: 'Resultado real de la revisión técnica del entorno.',
  keyIndicators: [],
  findings: [],
  recommendations: [],
  pendingDecisions: [],
  limitations: [],
  isDemo: false,
  ...overrides,
});

describe('deliverable export readiness', () => {
  it('rejects the former fabricated empty deliverable', () => {
    expect(getDeliverableExportIssues(deliverable({
      code: 'DEL-2026-01',
      title: 'Informe Técnico',
      executiveSummary: 'Sin datos disponibles.',
    }))).toContain('El entregable no contiene información técnica para exportar.');
  });

  it('accepts a deliverable with a meaningful executive summary', () => {
    expect(getDeliverableExportIssues(deliverable())).toEqual([]);
  });

  it('accepts structured technical content when the summary is empty', () => {
    expect(getDeliverableExportIssues(deliverable({
      executiveSummary: '',
      findings: [{ title: 'Hallazgo', severity: 'medium', detail: 'Detalle comprobado.' }],
    }))).toEqual([]);
  });

  it('reports missing document identity fields', () => {
    expect(getDeliverableExportIssues(deliverable({ code: '', title: '', createdAt: '' }))).toEqual([
      'Falta el código documental.',
      'Falta el título.',
      'Falta la fecha de emisión.',
    ]);
  });
});
