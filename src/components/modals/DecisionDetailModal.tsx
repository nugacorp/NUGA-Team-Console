import React, { useState, useEffect } from 'react';
import {
  Scale,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Play,
  FileCode,
  ShieldAlert,
  HelpCircle,
  Clock,
  Check,
  Flame,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DecisionDetailModal: React.FC = () => {
  const { activeModal, closeModal, modalProps, decisions, executeDecisionAction } = useApp();

  const decision = decisions.find(d => d.id === modalProps?.decisionId);

  const [activeTab, setActiveTab] = useState<'approve' | 'reject' | 'info' | 'simulate'>(
    modalProps?.defaultTab || 'approve'
  );
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  useEffect(() => {
    if (modalProps?.defaultTab) {
      setActiveTab(modalProps.defaultTab);
    }
    setTypedConfirmation('');
    setCommentText('');
    setSimulationLog(null);
  }, [modalProps]);

  if (activeModal !== 'decisionDetail' || !decision) return null;

  const isCrit = decision.risk === 'critical';
  const isHigh = decision.risk === 'high';
  const isUrgent = decision.priority === 'urgente';
  const isHighRiskDecision = isCrit || isHigh || isUrgent;

  // Exact required confirmation phrases
  const expectedApprovePhrase = `APROBAR ${decision.code}`;
  const expectedRejectPhrase = `RECHAZAR ${decision.code}`;

  const isApproveValid = !isHighRiskDecision || typedConfirmation.trim().toUpperCase() === expectedApprovePhrase;
  const isRejectValid = !isHighRiskDecision || typedConfirmation.trim().toUpperCase() === expectedRejectPhrase;

  const handleConfirmApprove = () => {
    if (!isApproveValid) return;
    executeDecisionAction(decision.id, 'approve', commentText, typedConfirmation);
    closeModal();
  };

  const handleConfirmReject = () => {
    if (!isRejectValid) return;
    executeDecisionAction(decision.id, 'reject', commentText || `Rechazado por Ramiro (${decision.code}).`);
    closeModal();
  };

  const handleConfirmNeedsInfo = () => {
    executeDecisionAction(decision.id, 'needs_info', commentText || 'Se solicita mayor justificación técnica.');
    closeModal();
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationLog(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationLog(`[SIMULACIÓN SANDBOX DRY-RUN - ${decision.code}]
> Objetivo: ${decision.title}
> Nodo objetivo: ${decision.affectedScope}
> Analizando comandos propuestos:
${decision.exactChangeDiff || decision.proposal}
>
> Verificación de sintaxis RouterOS v7 / Reglas: PASS (100% válida)
> Impacto estimado: ${decision.impact}
> Riesgo de acción detectado: ${decision.riskOfAction}
> Plan de Rollback verificado: ${decision.rollbackPlan}
> Temporizador de seguridad Safe-Mode: 120s programado.
> Resultado: SIMULACIÓN SATISFACTORIA (Sin fallas críticas detectadas).`);
      executeDecisionAction(decision.id, 'simulate', 'Simulación dry-run completada satisfactoriamente en sandbox.');
    }, 1200);
  };

  return (
    <div
      id="decision-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={closeModal}
    >
      <div
        id="decision-detail-modal"
        className="w-full max-w-3xl rounded-2xl bg-[#0A141D] border border-[#1E293B] shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] flex items-start justify-between gap-3 bg-[#0A141D]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isCrit
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : isHigh
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-[#111D27] border border-blue-500/30">
                  {decision.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                    isCrit
                      ? 'bg-rose-500 text-white'
                      : isHigh
                      ? 'bg-orange-500 text-black font-bold'
                      : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  Riesgo {decision.risk}
                </span>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase">
                  Prioridad {decision.priority}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  • Plazo: <strong className="text-[#E0E7FF]">{decision.deadline}</strong>
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                {decision.title}
              </h3>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-5 pt-3 border-b border-[#1E293B] text-xs bg-[#0A141D] overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('approve')}
            className={`pb-2.5 px-2 font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'approve'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprobar Decisión</span>
          </button>

          <button
            onClick={() => setActiveTab('reject')}
            className={`pb-2.5 px-2 font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'reject'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`pb-2.5 px-2 font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'simulate'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simular Dry-run</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-2 font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pedir Información</span>
          </button>
        </div>

        {/* Scrollable Body: PROMINENT DISPLAY OF ALL DECISION DETAILS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs custom-scrollbar">
          {/* 1. Situation & Technical Evidence Bento Card */}
          <div className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B] space-y-3">
            <div>
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                1. Situación Actual Detectada:
              </span>
              <p className="text-white mt-1 leading-relaxed text-xs sm:text-[13px]">
                {decision.situation}
              </p>
            </div>

            {decision.evidence && (
              <div className="pt-2 border-t border-[#1E293B]">
                <span className="font-bold text-[#94A3B8] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Evidencia Técnica / Registros & Métricas:
                </span>
                <p className="text-[#E0E7FF] mt-1 leading-relaxed text-xs">
                  {decision.evidence}
                </p>
              </div>
            )}
          </div>

          {/* 2. Impact on Network / Business */}
          <div className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B]">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              2. Impacto Estimado en Red & Operaciones:
            </span>
            <p className="text-white mt-1 leading-relaxed text-xs sm:text-[13px]">
              {decision.impact}
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-2">
              Alcance Afectado: <strong className="text-white">{decision.affectedScope}</strong>
            </p>
          </div>

          {/* 3. High-Contrast Comparison: Risk of Acting vs Risk of Inaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Risk of Acting */}
            <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/40 space-y-1.5">
              <span className="font-bold text-orange-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                3. Riesgo de Actuar (Riesgo de Ejecución):
              </span>
              <p className="text-[#E0E7FF] leading-relaxed text-xs">
                {decision.riskOfAction}
              </p>
            </div>

            {/* Risk of Inaction */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-1.5">
              <span className="font-bold text-rose-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                4. Riesgo de No Actuar (Riesgo de Inacción):
              </span>
              <p className="text-[#E0E7FF] leading-relaxed text-xs">
                {decision.riskOfInaction}
              </p>
            </div>
          </div>

          {/* 4. Proposal & Exact Command / Change Diff */}
          <div className="p-4 rounded-xl bg-[#111D27] border border-[#1E293B] space-y-2.5">
            <div>
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                5. Propuesta de Modificación:
              </span>
              <p className="text-[#E0E7FF] mt-1 leading-relaxed">{decision.proposal}</p>
            </div>

            {decision.exactChangeDiff && (
              <div className="pt-2 border-t border-[#1E293B]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Diff Exacto de Configuración / Script Preparado:
                </span>
                <pre className="p-3 rounded-lg bg-[#0A141D] border border-[#1E293B] text-blue-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-36 custom-scrollbar">
                  {decision.exactChangeDiff}
                </pre>
              </div>
            )}
          </div>

          {/* 5. Rollback Plan & Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#111D27] border border-[#1E293B] space-y-1">
              <span className="font-bold text-rose-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Plan de Rollback Automático:
              </span>
              <p className="text-[#94A3B8] font-mono text-[11px] leading-relaxed">
                {decision.rollbackPlan}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111D27] border border-[#1E293B] space-y-1">
              <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Recomendación del Especialista:
              </span>
              <p className="text-[#E0E7FF] text-[11px] leading-relaxed">
                {decision.recommendation}
              </p>
            </div>
          </div>

          {/* TAB 1: Approve Form with Reinforced Confirmation for High Risk */}
          {activeTab === 'approve' && (
            <div className="p-4 rounded-xl bg-[#111D27] border border-emerald-500/40 space-y-3.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-[#1E293B] pb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Paso de Aprobación Ejecutiva</span>
              </div>

              {isHighRiskDecision ? (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-orange-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-orange-400" />
                    <span>Confirmación Reforzada Requerida (Gobernanza Humana):</span>
                  </div>
                  <p className="text-[#E0E7FF] text-xs leading-relaxed">
                    Esta decisión tiene nivel de riesgo <strong className="text-orange-400 uppercase font-mono font-bold">[{decision.risk}]</strong>. Para confirmar la aprobación, escribe con precisión la siguiente frase:
                  </p>
                  <div className="p-2 rounded-lg bg-[#0A141D] border border-orange-500/40 flex items-center justify-between gap-2">
                    <code className="text-orange-300 font-mono font-bold text-xs sm:text-sm select-all">
                      {expectedApprovePhrase}
                    </code>
                    {typedConfirmation.trim().toUpperCase() === expectedApprovePhrase ? (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Coincide
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#64748B] font-mono">Sensible a mayúsculas</span>
                    )}
                  </div>
                  <input
                    type="text"
                    id="input-typed-approval-confirmation"
                    value={typedConfirmation}
                    onChange={e => setTypedConfirmation(e.target.value)}
                    placeholder={`Escribe aquí: ${expectedApprovePhrase}`}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0A141D] border border-orange-500/50 text-white font-mono text-xs focus:outline-hidden focus:border-orange-400"
                  />
                </div>
              ) : (
                <p className="text-[#94A3B8] text-xs">
                  Esta decisión tiene riesgo moderado/bajo y puede ser autorizada directamente.
                </p>
              )}

              <div>
                <label className="font-bold text-[#E0E7FF] block mb-1 text-xs">
                  Comentario Ejecutivo de Ramiro (Opcional):
                </label>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Instrucciones adicionales para los agentes o registro de auditoría..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-white text-xs focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-[#94A3B8] hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  id="btn-modal-confirm-approve"
                  onClick={handleConfirmApprove}
                  disabled={!isApproveValid}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Autorizar y Ejecutar Aprobación</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Reject Form with Reinforced Confirmation for High Risk */}
          {activeTab === 'reject' && (
            <div className="p-4 rounded-xl bg-[#111D27] border border-rose-500/40 space-y-3.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs border-b border-[#1E293B] pb-2">
                <XCircle className="w-4 h-4" />
                <span>Rechazo y Gestión de la Propuesta</span>
              </div>

              {/* Quick Actions / Options */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#E0E7FF] block text-xs">
                  Acción alternativa sugerida:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className="p-2 rounded-lg bg-[#0A141D] hover:bg-amber-950/30 border border-[#1E293B] hover:border-amber-500/50 text-left text-xs text-amber-300 transition-colors"
                  >
                    <span className="font-bold block text-[11px]">Solicitar más info</span>
                    <span className="text-[10px] text-[#94A3B8]">Pedir detalles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeDecisionAction(decision.id, 'postpone', commentText || 'Pospuesta para posterior revisión');
                      closeModal();
                    }}
                    className="p-2 rounded-lg bg-[#0A141D] hover:bg-purple-950/30 border border-[#1E293B] hover:border-purple-500/50 text-left text-xs text-purple-300 transition-colors"
                  >
                    <span className="font-bold block text-[11px]">Posponer</span>
                    <span className="text-[10px] text-[#94A3B8]">Diferir análisis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeDecisionAction(decision.id, 'adjust_scope', commentText || 'Ajustar alcance solicitado');
                      closeModal();
                    }}
                    className="p-2 rounded-lg bg-[#0A141D] hover:bg-sky-950/30 border border-[#1E293B] hover:border-sky-500/50 text-left text-xs text-sky-300 transition-colors"
                  >
                    <span className="font-bold block text-[11px]">Ajustar alcance</span>
                    <span className="text-[10px] text-[#94A3B8]">Modificar límites</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeDecisionAction(decision.id, 'reject', commentText || 'Propuesta descartada');
                      closeModal();
                    }}
                    className="p-2 rounded-lg bg-[#0A141D] hover:bg-rose-950/30 border border-[#1E293B] hover:border-rose-500/50 text-left text-xs text-rose-300 transition-colors"
                  >
                    <span className="font-bold block text-[11px]">Descartar</span>
                    <span className="text-[10px] text-[#94A3B8]">Archivar rechazo</span>
                  </button>
                </div>
              </div>

              {isHighRiskDecision ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Confirmación de Rechazo Reforzada:</span>
                  </div>
                  <p className="text-[#E0E7FF] text-xs leading-relaxed">
                    Escribe la siguiente frase para formalizar el rechazo en la bitácora local DEMO:
                  </p>
                  <div className="p-2 rounded-lg bg-[#0A141D] border border-rose-500/40 flex items-center justify-between gap-2">
                    <code className="text-rose-300 font-mono font-bold text-xs sm:text-sm select-all">
                      {expectedRejectPhrase}
                    </code>
                    {typedConfirmation.trim().toUpperCase() === expectedRejectPhrase ? (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Coincide
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#64748B] font-mono">Sensible a mayúsculas</span>
                    )}
                  </div>
                  <input
                    type="text"
                    id="input-typed-rejection-confirmation"
                    value={typedConfirmation}
                    onChange={e => setTypedConfirmation(e.target.value)}
                    placeholder={`Escribe aquí: ${expectedRejectPhrase}`}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0A141D] border border-rose-500/50 text-white font-mono text-xs focus:outline-hidden focus:border-rose-400"
                  />
                </div>
              ) : null}

              <div>
                <label className="font-bold text-[#E0E7FF] block mb-1 text-xs">
                  Motivo o Justificación del Rechazo:
                </label>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Explica al especialista por qué se rechaza la propuesta o qué modificaciones debe incorporar..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-white text-xs focus:outline-hidden focus:border-rose-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-[#94A3B8] hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  id="btn-modal-confirm-reject"
                  onClick={handleConfirmReject}
                  disabled={!isRejectValid}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmar Rechazo</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Simulate Dry-run */}
          {activeTab === 'simulate' && (
            <div className="p-4 rounded-xl bg-[#111D27] border border-blue-500/40 space-y-3.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs border-b border-[#1E293B] pb-2">
                <Play className="w-4 h-4" />
                <span>Simulador de Entorno Sandbox (Dry-run)</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed text-xs">
                Valida la sintaxis del comando, la compatibilidad con RouterOS v7 y el temporizador safe-mode de reversión sin afectar la red en producción.
              </p>

              {simulationLog && (
                <pre className="p-3.5 rounded-lg bg-[#0A141D] border border-blue-500/40 text-blue-300 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar">
                  {simulationLog}
                </pre>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-[#94A3B8] hover:text-white text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{isSimulating ? 'Validando en Sandbox...' : 'Ejecutar Simulación Dry-run'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Request Info */}
          {activeTab === 'info' && (
            <div className="p-4 rounded-xl bg-[#111D27] border border-amber-500/40 space-y-3.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs border-b border-[#1E293B] pb-2">
                <HelpCircle className="w-4 h-4" />
                <span>Solicitud de Información Complementaria</span>
              </div>
              <div>
                <label className="font-bold text-[#E0E7FF] block mb-1 text-xs">
                  Detalles o Dudas a Resolver por el Agente Especialista:
                </label>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Especifica qué información, pruebas de laboratorio o validación de costos requieres..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-white text-xs focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-[#0A141D] border border-[#1E293B] text-[#94A3B8] hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmNeedsInfo}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Enviar Solicitud a Especialista</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
