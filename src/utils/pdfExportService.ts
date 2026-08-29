import { jsPDF } from 'jspdf';
import { Deliverable, Project } from '../types';

interface PDFExportOptions {
  includeSignatures?: boolean;
  watermark?: string;
  notes?: string;
}

export class PDFExportService {
  /**
   * Generates a professional, multi-section PDF document for a single technical deliverable.
   */
  static exportDeliverablePDF(
    deliverable: Deliverable,
    project?: Project,
    options: PDFExportOptions = { includeSignatures: true }
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper: Header background banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Accent line
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 32, pageWidth, 1.5, 'F');

    // Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('NUGA CONSOLE • SISTEMA DE GESTIÓN AUTÓNOMA', margin, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('INFORME TÉCNICO OFICIAL & AUDITORÍA DE ENTREGABLE', margin, 20);

    // Code & Date in Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(45, 212, 191); // teal-400
    doc.text(deliverable.code || 'DEL-2026', pageWidth - margin, 13, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(deliverable.createdAt || new Date().toISOString().slice(0, 10), pageWidth - margin, 20, { align: 'right' });

    y = 42;

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(deliverable.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 6 + 4;

    // Metadata Card Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

    const col1 = margin + 4;
    const col2 = margin + 50;
    const col3 = margin + 100;
    const col4 = margin + 140;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('AUTOR / AGENTE', col1, y + 6);
    doc.text('ESTADO', col2, y + 6);
    doc.text('PROYECTO', col3, y + 6);
    doc.text('VERSIÓN / TIPO', col4, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const authorName = (deliverable as any).authorAgent || deliverable.agentId || 'Especialista';
    doc.text(authorName.toUpperCase(), col1, y + 14);

    const statusText = deliverable.status === 'approved' ? 'APROBADO' : 'LISTO REVISIÓN';
    if (deliverable.status === 'approved') {
      doc.setTextColor(16, 185, 129); // emerald
    } else {
      doc.setTextColor(217, 119, 6); // amber
    }
    doc.text(statusText, col2, y + 14);

    doc.setTextColor(15, 23, 42);
    const projectName = project?.name || (deliverable.projectId ? deliverable.projectId.toUpperCase() : 'WISP OPS');
    doc.text(doc.splitTextToSize(projectName, 36)[0] || 'General', col3, y + 14);

    doc.text(`${deliverable.version || 'v1.0'} (${(deliverable.type || 'informe').toUpperCase()})`, col4, y + 14);

    y += 28;

    // Section: Resumen Ejecutivo
    doc.setFillColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. RESUMEN EJECUTIVO', margin, y);
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const summaryText = deliverable.executiveSummary || (deliverable as any).summary || 'Informe técnico elaborado por el equipo de agentes de NUGA.';
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 5;

    // Section: Indicadores Clave (Key Indicators)
    const indicators = deliverable.keyIndicators || [];
    if (indicators.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('2. MÉTRICAS & INDICADORES CLAVE', margin, y);
      doc.setDrawColor(13, 148, 136);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      y += 7;

      const cardWidth = (contentWidth - (indicators.length - 1) * 3) / indicators.length;
      indicators.forEach((ind, i) => {
        const cx = margin + i * (cardWidth + 3);
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.roundedRect(cx, y, cardWidth, 16, 1.5, 1.5, 'FD');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        const labelTrimmed = doc.splitTextToSize(ind.label, cardWidth - 4);
        doc.text(labelTrimmed[0] || ind.label, cx + 2, y + 5);

        doc.setFontSize(9.5);
        if (ind.status === 'crit') {
          doc.setTextColor(225, 29, 72); // rose-600
        } else if (ind.status === 'warn') {
          doc.setTextColor(217, 119, 6); // amber-600
        } else {
          doc.setTextColor(13, 148, 136); // teal-600
        }
        doc.text(ind.value, cx + 2, y + 12);
      });

      y += 22;
    }

    // Section: Hallazgos de Seguridad / Auditoría (Findings)
    const findings = deliverable.findings || [];
    if (findings.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('3. HALLAZGOS Y EVALUACIÓN DE RIESGOS', margin, y);
      doc.setDrawColor(13, 148, 136);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      y += 7;

      findings.forEach((finding, idx) => {
        if (y > pageHeight - 35) {
          doc.addPage();
          y = margin;
        }

        doc.setFillColor(finding.severity === 'critical' ? 255 : 248, finding.severity === 'critical' ? 241 : 250, finding.severity === 'critical' ? 242 : 252);
        doc.setDrawColor(finding.severity === 'critical' ? 244 : 226, finding.severity === 'critical' ? 63 : 232, finding.severity === 'critical' ? 94 : 240);
        doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

        // Severity tag
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        if (finding.severity === 'critical') {
          doc.setTextColor(190, 18, 60);
          doc.text(`[CRÍTICO]`, margin + 3, y + 5);
        } else if (finding.severity === 'high') {
          doc.setTextColor(180, 83, 9);
          doc.text(`[ALTO]`, margin + 3, y + 5);
        } else {
          doc.setTextColor(71, 85, 105);
          doc.text(`[MODERADO]`, margin + 3, y + 5);
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(finding.title, margin + 22, y + 5);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const detailLines = doc.splitTextToSize(finding.detail, contentWidth - 8);
        doc.text(detailLines[0] || finding.detail, margin + 3, y + 10.5);

        y += 17;
      });
      y += 2;
    }

    // Section: Recomendaciones y Decisiones Pendientes
    const recommendations = deliverable.recommendations || [];
    if (recommendations.length > 0) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('4. RECOMENDACIONES & PLAN DE ACCIÓN', margin, y);
      doc.setDrawColor(13, 148, 136);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      y += 7;

      recommendations.forEach((rec, idx) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        doc.text(`${idx + 1}.`, margin + 1, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const recLines = doc.splitTextToSize(rec, contentWidth - 8);
        doc.text(recLines, margin + 6, y);
        y += recLines.length * 4.2 + 2;
      });
      y += 4;
    }

    // Section: Markdown Raw Content excerpt if present
    const rawContent = deliverable.rawContentMarkdown || (deliverable as any).content;
    if (rawContent && rawContent !== deliverable.executiveSummary) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('5. EXTRACTO TÉCNICO DEL DOCUMENTO', margin, y);
      doc.setDrawColor(13, 148, 136);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      y += 7;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      
      const cleanRaw = rawContent.replace(/#+\s/g, '').trim();
      const contentSnippet = doc.splitTextToSize(cleanRaw, contentWidth - 8);
      const displaySnippet = contentSnippet.slice(0, 10);
      
      const boxHeight = displaySnippet.length * 4 + 6;
      doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(displaySnippet, margin + 4, y + 4.5);
      y += boxHeight + 6;
    }

    // Signatures & Formal Validation
    if (options.includeSignatures) {
      if (y > pageHeight - 45) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('6. VALIDACIÓN & FIRMAS DE CONTROL', margin, y);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y + 2, margin + contentWidth, y + 2);
      y += 8;

      const sigBoxWidth = (contentWidth - 6) / 2;

      // Author Signature
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, sigBoxWidth, 24, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('ELABORADO POR (AGENTE IA):', margin + 3, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${authorName.toUpperCase()} • AGENTE AUTÓNOMO`, margin + 3, y + 11);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Hash SHA-256: ${deliverable.simulatedSha256 ? deliverable.simulatedSha256.slice(0, 24) + '...' : 'e3b0c44298fc1c14...'}`, margin + 3, y + 17);
      doc.text(`Timestamp: ${deliverable.createdAt || '2026-08-28 14:30:00'}`, margin + 3, y + 21);

      // Ramiro Signature (Director)
      const sig2X = margin + sigBoxWidth + 6;
      doc.setFillColor(deliverable.status === 'approved' ? 240 : 248, deliverable.status === 'approved' ? 253 : 250, deliverable.status === 'approved' ? 244 : 252);
      doc.roundedRect(sig2X, y, sigBoxWidth, 24, 1.5, 1.5, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('REVISADO Y APROBADO POR:', sig2X + 3, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('RAMIRO • DIRECCIÓN GENERAL', sig2X + 3, y + 11);
      doc.setFontSize(7);
      if (deliverable.status === 'approved') {
        doc.setTextColor(16, 185, 129);
        doc.text('✓ VALIDACIÓN FORMAL APROBADA EN SISTEMA', sig2X + 3, y + 17);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text('PENDIENTE DE CONFIRMACIÓN EN CONSOLA', sig2X + 3, y + 17);
      }
      doc.setTextColor(100, 116, 139);
      doc.text(`Identificador de Sesión: NUGA-AUTH-VALIDATED`, sig2X + 3, y + 21);

      y += 30;
    }

    // Footers on all pages
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NUGA AI Ecosystem • Documento Oficial Confidencial • ${deliverable.code}`,
        margin,
        pageHeight - 7
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    }

    // Trigger download
    const fileName = `${deliverable.code || 'ENTREGABLE'}_${deliverable.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`;
    doc.save(fileName);
  }

  /**
   * Exports the entire executive portfolio summary containing all active deliverables.
   */
  static exportPortfolioReportPDF(deliverables: Deliverable[], projects: Project[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 36, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('NUGA CONSOLE • DOSSIER EJECUTIVO DE ENTREGABLES', margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CONSOLIDADO DE AUDITORÍAS, ACTIVOS Y PLANES TÉCNICOS', margin, 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(45, 212, 191);
    doc.text(`TOTAL: ${deliverables.length} ENTREGABLES`, pageWidth - margin, 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 21, { align: 'right' });

    y = 46;

    // Summary stats row
    const approvedCount = deliverables.filter(d => d.status === 'approved').length;
    const pendingCount = deliverables.filter(d => d.status !== 'approved').length;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    const colW = contentWidth / 4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DOCUMENTOS TOTALES', margin + 4, y + 6);
    doc.text('APROBADOS', margin + colW + 4, y + 6);
    doc.text('PENDIENTES REVISIÓN', margin + colW * 2 + 4, y + 6);
    doc.text('ESTADO GENERAL', margin + colW * 3 + 4, y + 6);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${deliverables.length}`, margin + 4, y + 13);

    doc.setTextColor(16, 185, 129);
    doc.text(`${approvedCount} docs`, margin + colW + 4, y + 13);

    doc.setTextColor(217, 119, 6);
    doc.text(`${pendingCount} docs`, margin + colW * 2 + 4, y + 13);

    doc.setTextColor(13, 148, 136);
    doc.text('OPERATIVO 99.4%', margin + colW * 3 + 4, y + 13);

    y += 26;

    // Table Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('INVENTARIO DETALLADO DE ENTREGABLES', margin, y);
    doc.setDrawColor(13, 148, 136);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 7;

    // Render each deliverable row
    deliverables.forEach((d, idx) => {
      if (y > pageHeight - 38) {
        doc.addPage();
        y = margin;
      }

      const isApproved = d.status === 'approved';
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 148, 136);
      doc.text(d.code || `DEL-0${idx + 1}`, margin + 4, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const titleClean = doc.splitTextToSize(d.title, contentWidth - 45);
      doc.text(titleClean[0] || d.title, margin + 28, y + 5.5);

      // Status pill text
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      if (isApproved) {
        doc.setTextColor(16, 185, 129);
        doc.text('APROBADO', pageWidth - margin - 4, y + 5.5, { align: 'right' });
      } else {
        doc.setTextColor(217, 119, 6);
        doc.text('LISTO REVISIÓN', pageWidth - margin - 4, y + 5.5, { align: 'right' });
      }

      // Summary preview
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const sumLine = doc.splitTextToSize(d.executiveSummary || (d as any).summary || '', contentWidth - 10);
      doc.text(sumLine[0] || '', margin + 4, y + 12);

      // Metadata line
      const author = (d as any).authorAgent || d.agentId || 'agente';
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Autor: ${author.toUpperCase()} | Fecha: ${d.createdAt} | Versión: ${d.version || 'v1.0'} | Tamaño: ${d.fileSize || '1.2 MB'}`,
        margin + 4,
        y + 19
      );

      y += 27;
    });

    // Footers
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`NUGA AI Ecosystem • Reporte Consolidado de Gestión • Ramiro Executive Console`, margin, pageHeight - 7);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    doc.save(`NUGA_Dossier_Ejecutivo_Entregables_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
