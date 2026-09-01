import { Deliverable } from '../types';

const missingContentMessages = new Set([
  '',
  'sin datos disponibles.',
  'sin información disponible.',
  'sin informacion disponible.',
]);

export function getDeliverableExportIssues(deliverable: Deliverable): string[] {
  const issues: string[] = [];
  const summary = deliverable.executiveSummary.trim().toLocaleLowerCase('es-MX');
  const hasStructuredContent =
    deliverable.keyIndicators.length > 0 ||
    deliverable.findings.length > 0 ||
    deliverable.recommendations.length > 0 ||
    deliverable.pendingDecisions.length > 0 ||
    deliverable.limitations.length > 0 ||
    Boolean(deliverable.rawContentMarkdown?.trim());

  if (!deliverable.code.trim()) issues.push('Falta el código documental.');
  if (!deliverable.title.trim()) issues.push('Falta el título.');
  if (!deliverable.createdAt.trim()) issues.push('Falta la fecha de emisión.');
  if (missingContentMessages.has(summary) && !hasStructuredContent) {
    issues.push('El entregable no contiene información técnica para exportar.');
  }
  return issues;
}
