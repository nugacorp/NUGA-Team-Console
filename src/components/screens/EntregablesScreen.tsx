import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  FileCode,
  ExternalLink,
  BookOpen,
  Check,
  Edit3,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Sparkles,
  Award,
  Hash,
  Clock,
  User,
  Share2,
  Copy,
  ChevronRight,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Deliverable } from '../../types';
import { PDFExportService } from '../../utils/pdfExportService';

export const EntregablesScreen: React.FC = () => {
  const {
    deliverables,
    projects,
    selectedDeliverableId,
    setSelectedDeliverableId,
    updateDeliverableStatus,
    addToast
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'ready_for_review'>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'markdown'>('visual');

  // Active deliverable
  const activeDeliverable: Deliverable =
    deliverables.find(d => d.id === selectedDeliverableId) || deliverables[0] || {
      id: 'deliv-default',
      code: 'DEL-2026-01',
      title: 'Informe Técnico',
      type: 'report',
      projectId: 'proj-wisp-ops',
      agentId: 'operaciones',
      createdAt: '2026-08-28',
      fileSize: '1.2 MB',
      simulatedSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'ready_for_review',
      version: 'v1.0',
      executiveSummary: 'Sin datos disponibles.',
      keyIndicators: [],
      findings: [],
      recommendations: [],
      pendingDecisions: [],
      limitations: []
    };

  const filteredDeliverables = deliverables.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (filterAgent !== 'all' && ((d as any).authorAgent || d.agentId) !== filterAgent) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const author = ((d as any).authorAgent || d.agentId || '').toLowerCase();
      const title = (d.title || '').toLowerCase();
      const code = (d.code || '').toLowerCase();
      const sum = (d.executiveSummary || (d as any).summary || '').toLowerCase();
      return title.includes(q) || code.includes(q) || sum.includes(q) || author.includes(q);
    }
    return true;
  });

  const activeProject = projects.find(p => p.id === activeDeliverable.projectId);

  // Status handlers
  const handleApprove = () => {
    updateDeliverableStatus(activeDeliverable.id, 'approved');
  };

  const handleRequestChanges = () => {
    updateDeliverableStatus(activeDeliverable.id, 'ready_for_review');
    addToast({
      type: 'warning',
      title: 'Ajuste Solicitado',
      message: `Se ha devuelto el documento ${activeDeliverable.code} al agente para revisiones técnicas.`
    });
  };

  // PDF Export Handlers
  const handleExportSinglePDF = () => {
    try {
      setIsExporting(true);
      PDFExportService.exportDeliverablePDF(activeDeliverable, activeProject);
      addToast({
        type: 'success',
        title: 'PDF Generado Exitosamente',
        message: `El archivo ${activeDeliverable.code}.pdf ha sido descargado.`
      });
    } catch (err) {
      console.error('Error exportando PDF:', err);
      addToast({
        type: 'error',
        title: 'Error al Exportar PDF',
        message: 'Ocurrió un problema al procesar el documento PDF.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDossierPDF = () => {
    try {
      setIsExporting(true);
      PDFExportService.exportPortfolioReportPDF(deliverables, projects);
      addToast({
        type: 'success',
        title: 'Dossier PDF Descargado',
        message: `Reporte consolidado de ${deliverables.length} entregables guardado con éxito.`
      });
    } catch (err) {
      console.error('Error exportando Dossier PDF:', err);
      addToast({
        type: 'error',
        title: 'Error al Generar Dossier',
        message: 'No se pudo compilar el reporte consolidado en PDF.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    const content =
      activeDeliverable.rawContentMarkdown ||
      `# ${activeDeliverable.title} (${activeDeliverable.code})
**Fecha:** ${activeDeliverable.createdAt}
**Autor:** ${(activeDeliverable as any).authorAgent || activeDeliverable.agentId}
**Versión:** ${activeDeliverable.version}
**Hash SHA-256:** ${activeDeliverable.simulatedSha256}

## Resumen Ejecutivo
${activeDeliverable.executiveSummary || ''}

## Recomendaciones
${(activeDeliverable.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDeliverable.code || 'ENTREGABLE'}.md`;
    link.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'info',
      title: 'Archivo Markdown Descargado',
      message: `${activeDeliverable.code}.md guardado localmente.`
    });
  };

  const handleCopyHash = () => {
    if (activeDeliverable.simulatedSha256) {
      navigator.clipboard.writeText(activeDeliverable.simulatedSha256);
      addToast({
        type: 'success',
        title: 'Hash Copiado',
        message: 'Firma SHA-256 copiada al portapapeles.'
      });
    }
  };

  const approvedCount = deliverables.filter(d => d.status === 'approved').length;
  const pendingCount = deliverables.filter(d => d.status !== 'approved').length;
  const criticalFindingsCount = deliverables.reduce(
    (acc, d) => acc + (d.findings ? d.findings.filter(f => f.severity === 'critical').length : 0),
    0
  );

  return (
    <div id="screen-entregables" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/10">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Entregables Técnicos & Dossier</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                DEMO
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                PDF Export Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditorías de seguridad RouterOS, activos de marketing y planes ejecutivos listos para exportación formal
            </p>
          </div>
        </div>

        {/* Global Export Options */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-dossier-pdf"
            onClick={handleExportDossierPDF}
            disabled={isExporting}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
            title="Exportar resumen consolidado de todos los entregables en un único PDF"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Exportar Dossier Global PDF</span>
          </button>

          <button
            id="btn-export-single-pdf"
            onClick={handleExportSinglePDF}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-teal-500/25"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Informe en PDF</span>
          </button>

          <button
            id="btn-export-markdown"
            onClick={handleExportMarkdown}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Descargar versión Markdown (.md)"
          >
            <FileCode className="w-4 h-4 text-teal-400" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Total Entregables</span>
            <span className="text-lg font-mono font-bold text-slate-100">{deliverables.length}</span>
          </div>
          <Layers className="w-5 h-5 text-slate-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 block">Aprobados por Ramiro</span>
            <span className="text-lg font-mono font-bold text-emerald-300">{approvedCount}</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 block">Pendientes Revisión</span>
            <span className="text-lg font-mono font-bold text-amber-300">{pendingCount}</span>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-400 block">Hallazgos Críticos</span>
            <span className="text-lg font-mono font-bold text-rose-300">{criticalFindingsCount}</span>
          </div>
          <ShieldAlert className="w-5 h-5 text-rose-400" />
        </div>
      </div>

      {/* Split View: List on Left, Document Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deliverables Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filters Card */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar entregable..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500/50"
              >
                <option value="all">Todos ({deliverables.length})</option>
                <option value="approved">Aprobados ({approvedCount})</option>
                <option value="ready_for_review">Revisión ({pendingCount})</option>
              </select>

              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500/50"
              >
                <option value="all">Todos los agentes</option>
                <option value="director">Director</option>
                <option value="nugacore">NugaCore</option>
                <option value="operaciones">Operaciones</option>
                <option value="marketing">Marketing</option>
                <option value="administracion">Administración</option>
              </select>
            </div>
          </div>

          {/* List of items */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDeliverables.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500">
                No se encontraron entregables con los filtros actuales.
              </div>
            ) : (
              filteredDeliverables.map(del => {
                const isSelected = activeDeliverable.id === del.id;
                const author = (del as any).authorAgent || del.agentId || 'agente';

                return (
                  <div
                    key={del.id}
                    id={`deliv-card-${del.id}`}
                    onClick={() => {
                      setSelectedDeliverableId(del.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-teal-500 shadow-xl ring-1 ring-teal-500/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {del.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          del.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {del.status === 'approved' ? 'Aprobado' : 'Listo para Revisión'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{del.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {del.executiveSummary || (del as any).summary}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="capitalize">
                        Autor: <strong className="text-slate-200">{author}</strong>
                      </span>
                      <span className="font-mono text-[10px]">{del.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Full Document Viewer & Executive Report (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                    {activeDeliverable.code}
                  </span>
                  <span className="text-xs text-slate-400">
                    Versión: <strong className="text-slate-200">{activeDeliverable.version || 'v1.0'}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Tipo: <strong className="text-slate-200 uppercase">{activeDeliverable.type || 'Informe'}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Tamaño: <strong className="text-slate-200">{activeDeliverable.fileSize || '1.2 MB'}</strong>
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-100 pt-1 leading-snug">
                  {activeDeliverable.title}
                </h3>

                <p className="text-xs text-slate-400">
                  Elaborado por:{' '}
                  <strong className="text-slate-200 capitalize">
                    {(activeDeliverable as any).authorAgent || activeDeliverable.agentId}
                  </strong>{' '}
                  • Proyecto:{' '}
                  <strong className="text-slate-200">
                    {activeProject?.name || activeDeliverable.projectId?.toUpperCase() || 'WISP Operations'}
                  </strong>{' '}
                  • Fecha:{' '}
                  <strong className="text-slate-200">{activeDeliverable.createdAt}</strong>
                </p>
              </div>

              {/* Ramiro Action Controls & PDF trigger */}
              <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {activeDeliverable.status !== 'approved' ? (
                    <button
                      id="btn-approve-deliverable"
                      onClick={handleApprove}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar Formalmente</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Validado por Ramiro</span>
                    </div>
                  )}

                  <button
                    onClick={handleRequestChanges}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reabrir Ajustes</span>
                  </button>
                </div>

                <button
                  onClick={handleExportSinglePDF}
                  disabled={isExporting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* View Switcher: Dashboard Visual vs Markdown Code */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'visual'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Panel Visual & Resumen Ejecutivo</span>
                </button>

                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'markdown'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Documento Completo Markdown</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                Formato: PDF/A-1b Compatible
              </div>
            </div>

            {/* TAB 1: Visual Interactive Dashboard Report */}
            {activeTab === 'visual' && (
              <div className="space-y-5">
                {/* 1. Resumen Ejecutivo */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Resumen Ejecutivo</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeDeliverable.executiveSummary || (activeDeliverable as any).summary}
                  </p>
                </div>

                {/* 2. Key Indicators Grid */}
                {activeDeliverable.keyIndicators && activeDeliverable.keyIndicators.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Métricas & Indicadores Clave
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {activeDeliverable.keyIndicators.map((ind, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                        >
                          <span className="text-[11px] text-slate-400 block line-clamp-1">
                            {ind.label}
                          </span>
                          <span
                            className={`text-sm font-bold font-mono ${
                              ind.status === 'crit'
                                ? 'text-rose-400'
                                : ind.status === 'warn'
                                ? 'text-amber-400'
                                : 'text-teal-300'
                            }`}
                          >
                            {ind.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Findings / Hallazgos */}
                {activeDeliverable.findings && activeDeliverable.findings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Hallazgos Técnicos & Evaluación de Riesgos</span>
                    </h4>
                    <div className="space-y-2">
                      {activeDeliverable.findings.map((f, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border space-y-1.5 ${
                            f.severity === 'critical'
                              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                              : f.severity === 'high'
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              {f.severity === 'critical' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              {f.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                              {f.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{f.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Recommendations & Decisions */}
                {activeDeliverable.recommendations && activeDeliverable.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Recomendaciones & Acciones Propuestas
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      {activeDeliverable.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Cryptographic Seal & Signatures Box */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Hash className="w-3.5 h-3.5 text-teal-400" />
                      <span className="font-mono text-[11px]">
                        SHA-256 (DEMO):{' '}
                        <strong className="text-slate-300 font-mono">
                          {activeDeliverable.simulatedSha256 || 'e3b0c44298fc1c14...'}
                        </strong>
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        DEMO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hash calculado localmente en el navegador; no constituye firma digital ni evidencia de servidor.
                    </p>
                  </div>

                  <button
                    onClick={handleCopyHash}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-teal-400" />
                    <span>Copiar Hash</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Full Raw Markdown Content */}
            {activeTab === 'markdown' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  <div className="text-teal-400 pb-2 border-b border-slate-800">
                    # {activeDeliverable.title} ({activeDeliverable.code})
                  </div>
                  <div className="whitespace-pre-wrap">
                    {activeDeliverable.rawContentMarkdown ||
                      (activeDeliverable as any).content ||
                      `## 1. Resumen de Hallazgos\n${activeDeliverable.executiveSummary}\n\n## 2. Recomendaciones\n${(activeDeliverable.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
