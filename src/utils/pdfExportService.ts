import { jsPDF } from 'jspdf';
import { Deliverable, Project } from '../types';
import { getDeliverableExportIssues } from './deliverableExportReadiness';

interface PDFExportOptions {
  includeSignatures?: boolean;
  watermark?: string;
  notes?: string;
}

type PdfDocument = InstanceType<typeof jsPDF>;
type RGB = readonly [number, number, number];

const BRAND = {
  navy: [5, 18, 32] as const,
  blue: [0, 153, 255] as const,
  cyan: [42, 207, 255] as const,
  ink: [15, 23, 42] as const,
  slate: [71, 85, 105] as const,
  muted: [100, 116, 139] as const,
  line: [226, 232, 240] as const,
  paper: [248, 250, 252] as const,
  green: [5, 150, 105] as const,
  amber: [217, 119, 6] as const,
  red: [225, 29, 72] as const,
};

const PAGE = { margin: 16, footerY: 285, contentBottom: 276 };

const printableDate = (value?: string): string => {
  if (!value) return 'Sin fecha registrada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: 'long', day: '2-digit',
  }).format(parsed);
};

const statusLabel = (status: Deliverable['status']): string => ({
  approved: 'APROBADO',
  ready_for_review: 'LISTO PARA REVISION',
  rejected: 'RECHAZADO',
  draft: 'BORRADOR',
})[status];

const statusColor = (status: Deliverable['status']): RGB => {
  if (status === 'approved') return BRAND.green;
  if (status === 'rejected') return BRAND.red;
  return BRAND.amber;
};

const cleanMarkdown = (value: string): string => value
  .replace(/```[\s\S]*?```/g, match => match.replace(/```\w*/g, '').replace(/```/g, ''))
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/\*\*|__|`/g, '')
  .replace(/^[-*]\s+/gm, '• ')
  .trim();

class BrandedPdf {
  readonly doc: PdfDocument;
  readonly width: number;
  readonly height: number;
  readonly contentWidth: number;
  y = PAGE.margin;

  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.width = this.doc.internal.pageSize.getWidth();
    this.height = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.width - PAGE.margin * 2;
  }

  private color(value: readonly [number, number, number], target: 'text' | 'fill' | 'draw'): void {
    if (target === 'text') this.doc.setTextColor(...value);
    if (target === 'fill') this.doc.setFillColor(...value);
    if (target === 'draw') this.doc.setDrawColor(...value);
  }

  brandMark(x: number, y: number, size = 11): void {
    this.color(BRAND.blue, 'fill');
    this.doc.roundedRect(x, y, size, size, 2, 2, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(size * 0.62);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('N', x + size / 2, y + size * 0.72, { align: 'center' });
  }

  cover(title: string, eyebrow: string, code: string, subtitle: string, date: string): void {
    this.color(BRAND.navy, 'fill');
    this.doc.rect(0, 0, this.width, this.height, 'F');
    this.color(BRAND.blue, 'fill');
    this.doc.rect(0, 0, 6, this.height, 'F');

    this.brandMark(PAGE.margin + 2, 22, 14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('NUGA TEAM CONSOLE', PAGE.margin + 21, 28);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.color(BRAND.cyan, 'text');
    this.doc.text('INTELIGENCIA OPERATIVA Y CONTROL', PAGE.margin + 21, 33);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.color(BRAND.cyan, 'text');
    this.doc.text(eyebrow.toUpperCase(), PAGE.margin + 2, 78);
    this.doc.setFontSize(25);
    this.doc.setTextColor(255, 255, 255);
    const titleLines = this.doc.splitTextToSize(title, this.contentWidth - 12) as string[];
    this.doc.text(titleLines, PAGE.margin + 2, 91);
    const titleBottom = 91 + titleLines.length * 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(190, 205, 221);
    const subtitleLines = this.doc.splitTextToSize(subtitle, this.contentWidth - 20) as string[];
    this.doc.text(subtitleLines, PAGE.margin + 2, titleBottom + 8);

    this.color(BRAND.blue, 'fill');
    this.doc.roundedRect(PAGE.margin + 2, 220, this.contentWidth - 4, 38, 2, 2, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(210, 235, 255);
    this.doc.text('DOCUMENTO', PAGE.margin + 8, 231);
    this.doc.text('FECHA DE EMISION', PAGE.margin + 78, 231);
    this.doc.text('CLASIFICACION', PAGE.margin + 133, 231);
    this.doc.setFontSize(9);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(code, PAGE.margin + 8, 241);
    this.doc.text(date, PAGE.margin + 78, 241);
    this.doc.text('USO INTERNO', PAGE.margin + 133, 241);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(148, 163, 184);
    this.doc.text('Generado por NUGA Team Console • Control documental privado', PAGE.margin + 2, 280);
  }

  addContentPage(): void {
    this.doc.addPage();
    this.y = 28;
    this.color(BRAND.navy, 'fill');
    this.doc.rect(0, 0, this.width, 17, 'F');
    this.brandMark(PAGE.margin, 3.5, 10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('NUGA TEAM CONSOLE', PAGE.margin + 14, 10);
    this.color(BRAND.blue, 'fill');
    this.doc.rect(0, 17, this.width, 1.2, 'F');
  }

  ensure(space: number): void {
    if (this.y + space > PAGE.contentBottom) this.addContentPage();
  }

  section(number: string, title: string): void {
    this.ensure(15);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.color(BRAND.blue, 'text');
    this.doc.text(number, PAGE.margin, this.y);
    this.doc.setFontSize(11);
    this.color(BRAND.ink, 'text');
    this.doc.text(title.toUpperCase(), PAGE.margin + 10, this.y);
    this.color(BRAND.blue, 'draw');
    this.doc.setLineWidth(0.7);
    this.doc.line(PAGE.margin, this.y + 3, this.width - PAGE.margin, this.y + 3);
    this.y += 10;
  }

  paragraph(value: string): void {
    const lines = this.doc.splitTextToSize(value || 'Sin información registrada.', this.contentWidth) as string[];
    lines.forEach(line => {
      this.ensure(6.5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.color(BRAND.slate, 'text');
      this.doc.text(line, PAGE.margin, this.y);
      this.y += 4.6;
    });
    this.y += 3;
  }

  list(items: string[], emptyText: string): void {
    if (items.length === 0) {
      this.paragraph(emptyText);
      return;
    }
    items.forEach((item, index) => {
      const lines = this.doc.splitTextToSize(item, this.contentWidth - 12) as string[];
      this.ensure(lines.length * 4.4 + 5);
      this.color(BRAND.blue, 'fill');
      this.doc.circle(PAGE.margin + 3, this.y - 1.1, 2.5, 'F');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(String(index + 1), PAGE.margin + 3, this.y, { align: 'center' });
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.3);
      this.color(BRAND.slate, 'text');
      this.doc.text(lines, PAGE.margin + 9, this.y);
      this.y += lines.length * 4.4 + 4;
    });
  }

  footer(label: string): void {
    const pages = this.doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      this.doc.setPage(page);
      this.color(BRAND.line, 'draw');
      this.doc.setLineWidth(0.35);
      this.doc.line(PAGE.margin, PAGE.footerY - 3, this.width - PAGE.margin, PAGE.footerY - 3);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6.8);
      this.color(BRAND.muted, 'text');
      this.doc.text(`NUGA Team Console • ${label} • Uso interno`, PAGE.margin, PAGE.footerY + 2);
      this.doc.text(`Pagina ${page} de ${pages}`, this.width - PAGE.margin, PAGE.footerY + 2, { align: 'right' });
    }
  }
}

export class PDFExportService {
  static exportDeliverablePDF(deliverable: Deliverable, project?: Project, options: PDFExportOptions = { includeSignatures: true }): void {
    const issues = getDeliverableExportIssues(deliverable);
    if (issues.length > 0) {
      throw new Error(`El entregable no está listo para exportar: ${issues.join(' ')}`);
    }
    const pdf = new BrandedPdf();
    const { doc } = pdf;
    const projectName = project?.name || deliverable.projectId || 'Operación general';
    pdf.cover(deliverable.title, 'Informe técnico y evidencia de gestión', deliverable.code || deliverable.id,
      deliverable.executiveSummary || `Entregable asociado a ${projectName}.`, printableDate(deliverable.createdAt));
    pdf.addContentPage();

    pdf.section('01', 'Ficha de control');
    const metadata = [
      ['PROYECTO', projectName], ['RESPONSABLE', deliverable.agentId],
      ['ESTADO', statusLabel(deliverable.status)], ['VERSION', deliverable.version || 'Sin versión'],
      ['TIPO', deliverable.type], ['TAMANO', deliverable.fileSize || 'No registrado'],
    ];
    const cardWidth = (pdf.contentWidth - 4) / 2;
    metadata.forEach(([label, value], index) => {
      const column = index % 2;
      if (column === 0) pdf.ensure(18);
      const x = PAGE.margin + column * (cardWidth + 4);
      const rowY = pdf.y;
      doc.setFillColor(...BRAND.paper);
      doc.setDrawColor(...BRAND.line);
      doc.roundedRect(x, rowY, cardWidth, 14, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...BRAND.muted);
      doc.text(label, x + 4, rowY + 5);
      doc.setFontSize(8.3);
      doc.setTextColor(...(label === 'ESTADO' ? statusColor(deliverable.status) : BRAND.ink));
      const displayValue = doc.splitTextToSize(String(value), cardWidth - 8) as string[];
      doc.text(displayValue[0] || '—', x + 4, rowY + 10.5);
      if (column === 1) pdf.y += 18;
    });

    pdf.section('02', 'Resumen ejecutivo');
    pdf.paragraph(deliverable.executiveSummary || 'Sin resumen ejecutivo registrado.');
    if (deliverable.keyIndicators.length > 0) {
      pdf.section('03', 'Indicadores clave');
      deliverable.keyIndicators.forEach(indicator => {
        pdf.ensure(15);
        const color: RGB = indicator.status === 'crit' ? BRAND.red : indicator.status === 'warn' ? BRAND.amber : BRAND.green;
        doc.setFillColor(...BRAND.paper);
        doc.setDrawColor(...BRAND.line);
        doc.roundedRect(PAGE.margin, pdf.y, pdf.contentWidth, 11, 1.5, 1.5, 'FD');
        doc.setFillColor(...color);
        doc.rect(PAGE.margin, pdf.y, 2, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...BRAND.slate);
        doc.text(indicator.label, PAGE.margin + 6, pdf.y + 7);
        doc.setTextColor(...color);
        doc.text(indicator.value, pdf.width - PAGE.margin - 5, pdf.y + 7, { align: 'right' });
        pdf.y += 14;
      });
    }

    if (deliverable.findings.length > 0) {
      pdf.section('04', 'Hallazgos y riesgos');
      deliverable.findings.forEach(finding => {
        const detail = doc.splitTextToSize(finding.detail, pdf.contentWidth - 10) as string[];
        pdf.ensure(12 + detail.length * 4.2);
        const color: RGB = finding.severity === 'critical' ? BRAND.red : finding.severity === 'high' ? BRAND.amber : BRAND.blue;
        doc.setFillColor(...BRAND.paper);
        doc.setDrawColor(...color);
        doc.roundedRect(PAGE.margin, pdf.y, pdf.contentWidth, 10 + detail.length * 4.2, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...color);
        doc.text(finding.severity.toUpperCase(), PAGE.margin + 4, pdf.y + 5.5);
        doc.setTextColor(...BRAND.ink);
        doc.text(finding.title, PAGE.margin + 28, pdf.y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(...BRAND.slate);
        doc.text(detail, PAGE.margin + 4, pdf.y + 10.5);
        pdf.y += 14 + detail.length * 4.2;
      });
    }

    pdf.section('05', 'Recomendaciones y plan de acción');
    pdf.list(deliverable.recommendations, 'No se registraron recomendaciones para este entregable.');
    pdf.section('06', 'Decisiones pendientes');
    pdf.list(deliverable.pendingDecisions, 'No hay decisiones pendientes registradas.');
    pdf.section('07', 'Limitaciones y alcance');
    pdf.list(deliverable.limitations, 'No se registraron limitaciones adicionales.');
    if (deliverable.rawContentMarkdown) {
      pdf.section('08', 'Contenido técnico');
      pdf.paragraph(cleanMarkdown(deliverable.rawContentMarkdown));
    }
    if (options.notes) {
      pdf.section('09', 'Notas de emisión');
      pdf.paragraph(options.notes);
    }

    if (options.includeSignatures !== false) {
      pdf.section('10', 'Control de revisión');
      pdf.ensure(32);
      const boxWidth = (pdf.contentWidth - 6) / 2;
      const reviewers = [
        { label: 'ELABORADO POR', value: deliverable.agentId, detail: `Emitido ${printableDate(deliverable.createdAt)}` },
        { label: 'CONTROL DE DIRECCION', value: 'Ramiro • Dirección General', detail: statusLabel(deliverable.status) },
      ];
      reviewers.forEach((reviewer, index) => {
        const x = PAGE.margin + index * (boxWidth + 6);
        doc.setFillColor(...BRAND.paper);
        doc.setDrawColor(...BRAND.line);
        doc.roundedRect(x, pdf.y, boxWidth, 25, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...BRAND.muted);
        doc.text(reviewer.label, x + 4, pdf.y + 6);
        doc.setFontSize(8.3);
        doc.setTextColor(...BRAND.ink);
        doc.text(reviewer.value, x + 4, pdf.y + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...BRAND.slate);
        doc.text(reviewer.detail, x + 4, pdf.y + 20);
      });
    }

    if (options.watermark) {
      for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
        doc.setPage(page);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(34);
        doc.setTextColor(230, 236, 243);
        doc.text(options.watermark.toUpperCase(), pdf.width / 2, 155, { align: 'center', angle: 45 });
      }
    }
    pdf.footer(deliverable.code || deliverable.id);
    const safeTitle = deliverable.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, '_').slice(0, 36);
    doc.save(`${deliverable.code || 'ENTREGABLE'}_${safeTitle}.pdf`);
  }

  static exportPortfolioReportPDF(deliverables: Deliverable[], projects: Project[]): void {
    if (deliverables.length === 0) {
      throw new Error('No existen entregables reales para generar el dossier.');
    }
    const invalid = deliverables.filter(item => getDeliverableExportIssues(item).length > 0);
    if (invalid.length > 0) {
      throw new Error(`El dossier contiene ${invalid.length} entregable(s) incompleto(s).`);
    }
    const pdf = new BrandedPdf();
    const { doc } = pdf;
    const approved = deliverables.filter(item => item.status === 'approved').length;
    const pending = deliverables.length - approved;
    pdf.cover('Dossier ejecutivo de entregables', 'Portafolio consolidado',
      `DOSSIER-${new Date().toISOString().slice(0, 10)}`,
      `${deliverables.length} documentos vinculados a ${projects.length} proyectos.`, printableDate(new Date().toISOString()));
    pdf.addContentPage();
    pdf.section('01', 'Resumen del portafolio');

    const metrics: ReadonlyArray<readonly [string, string, RGB]> = [
      ['DOCUMENTOS', String(deliverables.length), BRAND.blue],
      ['APROBADOS', String(approved), BRAND.green],
      ['EN REVISION', String(pending), BRAND.amber],
      ['PROYECTOS', String(projects.length), BRAND.ink],
    ];
    const cardWidth = (pdf.contentWidth - 9) / 4;
    metrics.forEach(([label, value, color], index) => {
      const x = PAGE.margin + index * (cardWidth + 3);
      doc.setFillColor(...BRAND.paper);
      doc.setDrawColor(...BRAND.line);
      doc.roundedRect(x, pdf.y, cardWidth, 22, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(...BRAND.muted);
      doc.text(label, x + 4, pdf.y + 7);
      doc.setFontSize(15);
      doc.setTextColor(...color);
      doc.text(value, x + 4, pdf.y + 17);
    });
    pdf.y += 30;
    pdf.section('02', 'Inventario documental');
    if (deliverables.length === 0) pdf.paragraph('No existen entregables registrados en el portafolio.');

    deliverables.forEach((item, index) => {
      const project = projects.find(candidate => candidate.id === item.projectId);
      const summary = doc.splitTextToSize(item.executiveSummary || 'Sin resumen ejecutivo.', pdf.contentWidth - 8) as string[];
      const height = 24 + Math.min(summary.length, 2) * 4;
      pdf.ensure(height + 4);
      const rowColor: RGB = index % 2 === 0 ? [255, 255, 255] : BRAND.paper;
      doc.setFillColor(...rowColor);
      doc.setDrawColor(...BRAND.line);
      doc.roundedRect(PAGE.margin, pdf.y, pdf.contentWidth, height, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(...BRAND.blue);
      doc.text(item.code || item.id, PAGE.margin + 4, pdf.y + 6);
      doc.setFontSize(8.6);
      doc.setTextColor(...BRAND.ink);
      const title = doc.splitTextToSize(item.title, pdf.contentWidth - 65) as string[];
      doc.text(title[0] || item.title, PAGE.margin + 32, pdf.y + 6);
      doc.setFontSize(7);
      doc.setTextColor(...statusColor(item.status));
      doc.text(statusLabel(item.status), pdf.width - PAGE.margin - 4, pdf.y + 6, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(...BRAND.slate);
      doc.text(summary.slice(0, 2), PAGE.margin + 4, pdf.y + 13);
      doc.setFontSize(6.6);
      doc.setTextColor(...BRAND.muted);
      doc.text(`${project?.name || item.projectId} • ${item.agentId} • ${printableDate(item.createdAt)} • ${item.version || 'Sin versión'}`,
        PAGE.margin + 4, pdf.y + height - 4);
      pdf.y += height + 4;
    });
    pdf.footer('Dossier ejecutivo');
    doc.save(`NUGA_Dossier_Ejecutivo_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
